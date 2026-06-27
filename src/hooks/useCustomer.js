import { useState, useCallback } from 'react'

const STORAGE_KEY = 'neon_customer'
const TOKEN_KEY   = 'neon_customer_token'

// ── Config ────────────────────────────────────────────────────────────────────
// Update APP_URL if you change your hosting domain
const APP_URL  = 'https://testing-headless.pages.dev'
const STORE_ID = '69915508787'

function getClientId()    { return import.meta.env.VITE_SHOPIFY_CUSTOMER_CLIENT_ID || '' }
function getRedirectUri() { return `${APP_URL}/account/callback` }

// ── PKCE helpers ──────────────────────────────────────────────────────────────
function randomString(n = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const arr   = new Uint8Array(n)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, b => chars[b % chars.length]).join('')
}

async function codeChallenge(verifier) {
  const data   = new TextEncoder().encode(verifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
}

// ── Decode JWT payload ────────────────────────────────────────────────────────
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    const padded  = payload + '='.repeat((4 - payload.length % 4) % 4)
    const base64  = padded.replace(/-/g,'+').replace(/_/g,'/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export function useCustomer() {
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY) || null
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Resolve from localStorage synchronously in case React state lags
  const resolvedCustomer = customer || (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })()
  const resolvedToken  = token  || localStorage.getItem(TOKEN_KEY)
  const isLoggedIn     = !!(resolvedCustomer && resolvedToken)

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    setError(null)
    try {
      const verifier   = randomString()
      const challenge  = await codeChallenge(verifier)
      const state      = randomString(16)
      sessionStorage.setItem('pkce_verifier', verifier)
      sessionStorage.setItem('pkce_state',    state)

      const clientId = getClientId()
      if (!clientId) {
        setError('VITE_SHOPIFY_CUSTOMER_CLIENT_ID is not set')
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

      window.location.href =
        `https://shopify.com/authentication/${STORE_ID}/oauth/authorize?${params}`
    } catch (err) {
      setError('Login failed. Please try again.')
      console.error(err)
    }
  }, [])

  // ── Handle OAuth callback ─────────────────────────────────────────────────
  const handleCallback = useCallback(async () => {
    const params   = new URLSearchParams(window.location.search)
    const code     = params.get('code')
    const state    = params.get('state')
    const errParam = params.get('error')

    if (errParam) {
      setError('Login cancelled.')
      return false
    }

    const savedState    = sessionStorage.getItem('pkce_state')
    const savedVerifier = sessionStorage.getItem('pkce_verifier')

    if (!code || state !== savedState) {
      setError('Security check failed. Please try again.')
      return false
    }

    setLoading(true)
    try {
      // Exchange code for tokens
      const res = await fetch(
        `https://shopify.com/authentication/${STORE_ID}/oauth/token`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type:    'authorization_code',
            client_id:     getClientId(),
            redirect_uri:  getRedirectUri(),
            code,
            code_verifier: savedVerifier,
          }),
        }
      )

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Token exchange failed: ${res.status} ${txt}`)
      }

      const data        = await res.json()
      const accessToken = data.access_token
      const idToken     = data.id_token   // JWT with customer profile — no extra request needed

      if (!accessToken) throw new Error('No access token in response')

      // ── Parse customer from id_token ────────────────────────────────────
      // id_token is a JWT already containing email, name etc.
      // We decode it directly — NO userinfo endpoint call needed (it has CORS issues)
      const profile = idToken ? decodeJWT(idToken) : null

      const customerData = {
        id:        profile?.sub         || '',
        email:     profile?.email       || '',
        firstName: profile?.given_name  || profile?.first_name  || '',
        lastName:  profile?.family_name || profile?.last_name   || '',
        name:      profile?.name        || profile?.email       || 'Customer',
      }

      // Save to localStorage and React state
      localStorage.setItem(TOKEN_KEY,    accessToken)
      localStorage.setItem(STORAGE_KEY,  JSON.stringify(customerData))
      setToken(accessToken)
      setCustomer(customerData)

      // Clean up PKCE
      sessionStorage.removeItem('pkce_verifier')
      sessionStorage.removeItem('pkce_state')

      return true

    } catch (err) {
      console.error('Callback error:', err)
      setError('Sign in failed. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const t = resolvedToken
    if (!t) return []
    try {
      const res = await fetch(
        `https://${import.meta.env.VITE_SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`,
        {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Customer-Access-Token': t,
          },
          body: JSON.stringify({ query: `{
            customer {
              orders(first:10) {
                edges { node {
                  id orderNumber name processedAt
                  financialStatus fulfillmentStatus
                  currentTotalPrice { amount currencyCode }
                  lineItems(first:3) { edges { node { title quantity } } }
                } }
              }
            }
          }` }),
        }
      )
      const json = await res.json()
      return json?.data?.customer?.orders?.edges?.map(e => e.node) || []
    } catch { return [] }
  }, [resolvedToken])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setCustomer(null)
    setToken(null)
    setError(null)
  }, [])

  return {
    customer:  resolvedCustomer,
    token:     resolvedToken,
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
