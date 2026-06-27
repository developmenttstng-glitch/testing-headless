import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'neon_customer'
const TOKEN_KEY   = 'neon_customer_token'

// ── Shopify Customer Account API helpers ─────────────────────────────────────
// Uses PKCE (Proof Key for Code Exchange) — no client secret needed in frontend

function generateRandomString(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = new Uint8Array(length)
  window.crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data    = encoder.encode(verifier)
  const digest  = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function getShopDomain() {
  return import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || ''
}

function getClientId() {
  return import.meta.env.VITE_SHOPIFY_CUSTOMER_CLIENT_ID || ''
}

function getRedirectUri() {
  return `${window.location.origin}/account/callback`
}

export function useCustomer() {
  const [customer,    setCustomer]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })
  const [token,       setToken]       = useState(() =>
    localStorage.getItem(TOKEN_KEY) || null
  )
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const isLoggedIn = !!token && !!customer

  // ── Login — redirect to Shopify hosted login ─────────────────────────────
  const login = useCallback(async () => {
    try {
      setError(null)
      const verifier  = generateRandomString()
      const challenge = await generateCodeChallenge(verifier)
      const state     = generateRandomString(16)

      // Store verifier and state for callback verification
      sessionStorage.setItem('pkce_verifier', verifier)
      sessionStorage.setItem('pkce_state',    state)

      const shop     = getShopDomain()
      const clientId = getClientId()

      if (!shop || !clientId) {
        setError('Customer Account API not configured. Add VITE_SHOPIFY_CUSTOMER_CLIENT_ID to your .env')
        return
      }

      const params = new URLSearchParams({
        client_id:             clientId,
        response_type:         'code',
        redirect_uri:          getRedirectUri(),
        scope:                 'openid email customer-account-api:full',
        state,
        code_challenge:        challenge,
        code_challenge_method: 'S256',
      })

      const authUrl = `https://shopify.com/authentication/${shop.replace('.myshopify.com','')}/oauth/authorize?${params}`
      window.location.href = authUrl
    } catch (err) {
      setError('Login failed. Please try again.')
      console.error('Login error:', err)
    }
  }, [])

  // ── Handle callback — exchange code for token ────────────────────────────
  const handleCallback = useCallback(async () => {
    const params   = new URLSearchParams(window.location.search)
    const code     = params.get('code')
    const state    = params.get('state')
    const error    = params.get('error')

    if (error) {
      setError('Login was cancelled or failed.')
      return false
    }

    const savedState    = sessionStorage.getItem('pkce_state')
    const savedVerifier = sessionStorage.getItem('pkce_verifier')

    if (!code || state !== savedState) {
      setError('Security check failed. Please try logging in again.')
      return false
    }

    setLoading(true)
    try {
      const shop     = getShopDomain()
      const clientId = getClientId()

      const tokenRes = await fetch(
        `https://shopify.com/authentication/${shop.replace('.myshopify.com','')}/oauth/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type:    'authorization_code',
            client_id:     clientId,
            redirect_uri:  getRedirectUri(),
            code,
            code_verifier: savedVerifier,
          }),
        }
      )

      if (!tokenRes.ok) throw new Error('Token exchange failed')

      const tokenData = await tokenRes.json()
      const accessToken = tokenData.access_token

      // Store token
      localStorage.setItem(TOKEN_KEY, accessToken)
      setToken(accessToken)

      // Fetch customer profile
      await fetchCustomerProfile(accessToken)

      // Clean up PKCE values
      sessionStorage.removeItem('pkce_verifier')
      sessionStorage.removeItem('pkce_state')

      // Remove code from URL
      window.history.replaceState({}, '', '/account')
      return true

    } catch (err) {
      setError('Failed to complete login. Please try again.')
      console.error('Callback error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch customer profile ───────────────────────────────────────────────
  const fetchCustomerProfile = useCallback(async (accessToken) => {
    try {
      const shop = getShopDomain()
      const res  = await fetch(
        `https://shopify.com/authentication/${shop.replace('.myshopify.com','')}/oauth/userinfo`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) throw new Error('Profile fetch failed')
      const profile = await res.json()

      const customerData = {
        id:        profile.sub,
        email:     profile.email,
        firstName: profile.given_name  || '',
        lastName:  profile.family_name || '',
        name:      profile.name        || profile.email,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData))
      setCustomer(customerData)
      return customerData
    } catch (err) {
      console.error('Profile fetch error:', err)
      return null
    }
  }, [])

  // ── Fetch orders via Storefront API ─────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!token) return []
    try {
      const res = await fetch(
        `https://${getShopDomain()}/api/2025-01/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Customer-Access-Token': token,
          },
          body: JSON.stringify({
            query: `{
              customer {
                orders(first: 10) {
                  edges {
                    node {
                      id orderNumber name
                      processedAt
                      financialStatus fulfillmentStatus
                      currentTotalPrice { amount currencyCode }
                      lineItems(first: 3) {
                        edges {
                          node { title quantity }
                        }
                      }
                    }
                  }
                }
              }
            }`,
          }),
        }
      )
      const data = await res.json()
      return data?.data?.customer?.orders?.edges?.map(e => e.node) || []
    } catch {
      return []
    }
  }, [token])

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setCustomer(null)
    setToken(null)
    setError(null)
  }, [])

  return {
    customer,
    token,
    isLoggedIn,
    loading,
    error,
    setError,
    login,
    logout,
    handleCallback,
    fetchOrders,
  }
}
