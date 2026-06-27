import { useState, useCallback } from 'react'

const STORAGE_KEY = 'neon_customer'
const TOKEN_KEY   = 'neon_customer_token'

// ── Config ────────────────────────────────────────────────────────────────────
const APP_URL  = 'https://testing-headless.pages.dev'
const STORE_ID = '69915508787'  // numeric store ID from Shopify admin URL

// Correct endpoints — discovered from successful Shopify theme HAR analysis
// Token:   https://shopify.com/{STORE_ID}/account/oauth/token
// Profile: https://shopify.com/{STORE_ID}/account/customer/api/unstable/graphql

function getClientId()    { return import.meta.env.VITE_SHOPIFY_CUSTOMER_CLIENT_ID || '' }
function getRedirectUri() { return `${APP_URL}/account/callback` }
function tokenUrl()       { return `https://shopify.com/authentication/${STORE_ID}/oauth/token` }
function profileUrl()     { return `https://shopify.com/${STORE_ID}/account/customer/api/unstable/graphql?operation=Profile` }

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
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Decode JWT payload (fallback profile parsing) ─────────────────────────────
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    const padded  = payload + '='.repeat((4 - payload.length % 4) % 4)
    return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

export function useCustomer() {
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const resolvedCustomer = customer || (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })()
  const resolvedToken = token || localStorage.getItem(TOKEN_KEY)
  const isLoggedIn    = !!(resolvedCustomer && resolvedToken)

  // ── Login — redirect to Shopify hosted login ──────────────────────────────
  const login = useCallback(async () => {
    setError(null)
    try {
      const verifier  = randomString()
      const challenge = await codeChallenge(verifier)
      const state     = randomString(16)
      sessionStorage.setItem('pkce_verifier', verifier)
      sessionStorage.setItem('pkce_state',    state)

      const clientId = getClientId()
      if (!clientId) { setError('Customer Client ID not configured'); return }

      const params = new URLSearchParams({
        client_id:             clientId,
        response_type:         'code',
        redirect_uri:          getRedirectUri(),
        scope:                 'openid email customer-account-api:full',
        state,
        code_challenge:        challenge,
        code_challenge_method: 'S256',
      })

      // Use the correct authorize endpoint
      window.location.href =
        `https://shopify.com/authentication/${STORE_ID}/oauth/authorize?${params}`
    } catch (err) {
      setError('Login failed. Please try again.')
      console.error(err)
    }
  }, [])

  // ── Handle OAuth callback ─────────────────────────────────────────────────
  const handleCallback = useCallback(async () => {
    const params      = new URLSearchParams(window.location.search)
    const code        = params.get('code')
    const state       = params.get('state')
    const errParam    = params.get('error')
    const savedState  = sessionStorage.getItem('pkce_state')
    const savedVerif  = sessionStorage.getItem('pkce_verifier')

    if (errParam)               { setError('Login cancelled.');              return false }
    if (!code || state !== savedState) { setError('Security check failed.'); return false }

    setLoading(true)
    try {
      // ── Step 1: Exchange code for token ───────────────────────────────────
      // Using the correct endpoint discovered from successful Shopify theme HAR:
      // https://shopify.com/{STORE_ID}/account/oauth/token  (NOT /authentication/)
      const tokenRes = await fetch(tokenUrl(), {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'authorization_code',
          client_id:     getClientId(),
          redirect_uri:  getRedirectUri(),
          code,
          code_verifier: savedVerif,
        }),
      })

      if (!tokenRes.ok) {
        const txt = await tokenRes.text()
        throw new Error(`Token exchange failed ${tokenRes.status}: ${txt}`)
      }

      const tokenData   = await tokenRes.json()
      const accessToken = tokenData.access_token
      const idToken     = tokenData.id_token
      if (!accessToken) throw new Error('No access token received')

      // ── Step 2: Fetch profile using correct Customer API endpoint ─────────
      // https://shopify.com/{STORE_ID}/account/customer/api/unstable/graphql
      // This is what Shopify's own theme uses — no CORS issues
      let customerData = null
      try {
        const profileRes = await fetch(profileUrl(), {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: `{
              customer {
                id
                firstName
                lastName
                emailAddress { emailAddress }
              }
            }`,
          }),
        })

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const c = profileData?.data?.customer
          if (c) {
            customerData = {
              id:        c.id || '',
              email:     c.emailAddress?.emailAddress || '',
              firstName: c.firstName || '',
              lastName:  c.lastName  || '',
              name:      `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.emailAddress?.emailAddress || 'Customer',
            }
          }
        }
      } catch (profileErr) {
        console.warn('Profile fetch failed, falling back to id_token:', profileErr)
      }

      // ── Fallback: parse id_token JWT if profile fetch failed ──────────────
      if (!customerData && idToken) {
        const decoded = decodeJWT(idToken)
        if (decoded) {
          customerData = {
            id:        decoded.sub         || '',
            email:     decoded.email       || '',
            firstName: decoded.given_name  || '',
            lastName:  decoded.family_name || '',
            name:      decoded.name        || decoded.email || 'Customer',
          }
        }
      }

      if (!customerData) customerData = { id:'', email:'Customer', firstName:'Customer', lastName:'', name:'Customer' }

      // ── Save to localStorage and React state ──────────────────────────────
      localStorage.setItem(TOKEN_KEY,   accessToken)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData))
      setToken(accessToken)
      setCustomer(customerData)

      sessionStorage.removeItem('pkce_verifier')
      sessionStorage.removeItem('pkce_state')

      return true

    } catch (err) {
      console.error('Auth callback error:', err)
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
        `https://shopify.com/${STORE_ID}/account/customer/api/unstable/graphql?operation=Orders`,
        {
          method:  'POST',
          headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${t}` },
          body: JSON.stringify({ query: `{
            customer {
              orders(first: 10) {
                nodes {
                  id orderNumber name processedAt
                  financialStatus fulfillmentStatus
                  totalPrice { amount currencyCode }
                  lineItems(first: 3) { nodes { title quantity } }
                }
              }
            }
          }` }),
        }
      )
      const json = await res.json()
      return json?.data?.customer?.orders?.nodes || []
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

  return { customer: resolvedCustomer, token: resolvedToken, isLoggedIn,
           loading, error, setError, login, logout, handleCallback, fetchOrders }
}
