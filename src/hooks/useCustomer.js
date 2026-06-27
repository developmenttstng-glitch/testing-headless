import { useState, useCallback, useRef } from 'react'

const STORAGE_KEY  = 'neon_customer'
const TOKEN_KEY    = 'neon_customer_token'
const REFRESH_KEY  = 'neon_customer_refresh'
const APP_URL      = 'https://testing-headless.pages.dev'
const SHOP_DOMAIN  = 'headless-website.myshopify.com'

function getClientId() { return import.meta.env.VITE_SHOPIFY_CUSTOMER_CLIENT_ID || '' }
function getRedirectUri() { return `${APP_URL}/account/callback` }

// ── PKCE helpers (exactly from Shopify docs) ──────────────────────────────────
function generateCodeVerifier() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const str = String.fromCharCode.apply(null, Array.from(array))
  const base64 = btoa(str)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const str    = String.fromCharCode(...new Uint8Array(digest))
  const base64 = btoa(str)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function generateState() {
  return Date.now().toString() + Math.random().toString(36).substring(2)
}

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    const padded  = payload + '='.repeat((4 - payload.length % 4) % 4)
    return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

// ── Discover endpoints from Shopify (docs-recommended approach) ───────────────
async function discoverAuthEndpoints() {
  const res = await fetch(`https://${SHOP_DOMAIN}/.well-known/openid-configuration`)
  return await res.json()
  // Returns: { authorization_endpoint, token_endpoint, end_session_endpoint }
}

async function discoverAPIEndpoints() {
  const res = await fetch(`https://${SHOP_DOMAIN}/.well-known/customer-account-api`)
  return await res.json()
  // Returns: { graphql_api: "https://{shopDomain}/customer/api/{version}/graphql" }
}

export function useCustomer() {
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY)   || null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const callbackRan = useRef(false)

  const resolvedCustomer = customer || (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })()
  const resolvedToken = token || localStorage.getItem(TOKEN_KEY)
  const isLoggedIn    = !!(resolvedCustomer && resolvedToken)

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    setError(null)
    try {
      const clientId = getClientId()
      console.log('[Auth] Client ID:', clientId ? 'found' : 'MISSING')
      if (!clientId) { setError('VITE_SHOPIFY_CUSTOMER_CLIENT_ID not set'); return }

      // Step 1: Discover endpoints (docs recommended)
      console.log('[Auth] Discovering endpoints from:', `https://${SHOP_DOMAIN}/.well-known/openid-configuration`)
      const config = await discoverAuthEndpoints()
      console.log('[Auth] Auth endpoint:', config.authorization_endpoint)

      // Step 2: Generate PKCE
      const verifier   = generateCodeVerifier()
      const challenge  = await generateCodeChallenge(verifier)
      const state      = generateState()

      localStorage.setItem('pkce_verifier', verifier)
      localStorage.setItem('pkce_state',    state)

      // Step 3: Build authorize URL
      const url = new URL(config.authorization_endpoint)
      url.searchParams.append('client_id',             clientId)
      url.searchParams.append('response_type',         'code')
      url.searchParams.append('redirect_uri',          getRedirectUri())
      url.searchParams.append('scope',                 'openid email customer-account-api:full')
      url.searchParams.append('state',                 state)
      url.searchParams.append('code_challenge',        challenge)
      url.searchParams.append('code_challenge_method', 'S256')

      window.location.href = url.toString()
    } catch (err) {
      setError('Login failed. Please try again.')
      console.error(err)
    }
  }, [])

  // ── Handle OAuth callback ─────────────────────────────────────────────────
  const handleCallback = useCallback(async () => {
    // Only run once — auth codes are single use
    if (callbackRan.current) return !!localStorage.getItem(TOKEN_KEY)
    callbackRan.current = true

    // If already logged in (token in localStorage), skip the callback entirely
    // This handles the back-button case where the callback URL is re-visited
    if (localStorage.getItem(TOKEN_KEY) && localStorage.getItem(STORAGE_KEY)) {
      console.log('[Auth] Already logged in — skipping callback')
      return true
    }

    const params    = new URLSearchParams(window.location.search)
    const code      = params.get('code')
    const state     = params.get('state')
    const errParam  = params.get('error')

    if (errParam)  { setError('Login cancelled.'); return false }
    if (!code)     { setError('No code received.'); return false }

    const savedState   = localStorage.getItem('pkce_state')
    const savedVerifier = localStorage.getItem('pkce_verifier')

    if (state !== savedState) { setError('State mismatch — please try again.'); return false }

    setLoading(true)
    try {
      // Step 1: Discover token endpoint
      const config    = await discoverAuthEndpoints()
      const clientId  = getClientId()

      // Step 2: Exchange code for token
      // Include origin header as required by Shopify docs to avoid 401 invalid_token
      const tokenRes = await fetch(config.token_endpoint, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin':       APP_URL,
        },
        body: new URLSearchParams({
          grant_type:    'authorization_code',
          client_id:     clientId,
          redirect_uri:  getRedirectUri(),
          code,
          code_verifier: savedVerifier,
        }),
      })

      if (!tokenRes.ok) {
        const txt = await tokenRes.text()
        throw new Error(`Token exchange ${tokenRes.status}: ${txt}`)
      }

      const tokenData    = await tokenRes.json()
      const accessToken  = tokenData.access_token
      const idToken      = tokenData.id_token
      const refreshToken = tokenData.refresh_token

      if (!accessToken) throw new Error('No access token in response')

      // Step 3: Fetch customer profile using discovered GraphQL endpoint
      let customerData = null
      try {
        const apiConfig  = await discoverAPIEndpoints()
        const profileRes = await fetch(apiConfig.graphql_api, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken,
            'Origin':        APP_URL,
          },
          body: JSON.stringify({
            operationName: 'GetProfile',
            query: `query GetProfile {
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
              name:      `${c.firstName||''} ${c.lastName||''}`.trim() || c.emailAddress?.emailAddress || 'Customer',
            }
          }
        }
      } catch (profileErr) {
        console.warn('Profile fetch failed, using id_token fallback:', profileErr)
      }

      // Fallback: decode id_token JWT
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

      // Save everything
      localStorage.setItem(TOKEN_KEY,    accessToken)
      localStorage.setItem(REFRESH_KEY,  refreshToken || '')
      localStorage.setItem(STORAGE_KEY,  JSON.stringify(customerData))
      setToken(accessToken)
      setCustomer(customerData)

      // Clean up PKCE
      localStorage.removeItem('pkce_verifier')
      localStorage.removeItem('pkce_state')

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
      const apiConfig = await discoverAPIEndpoints()
      const res = await fetch(apiConfig.graphql_api, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': t,
          'Origin':        APP_URL,
        },
        body: JSON.stringify({
          query: `{
            customer {
              orders(first: 10) {
                nodes {
                  id
                  name
                  number
                  processedAt
                  financialStatus
                  fulfillmentStatus
                  totalPrice    { amount currencyCode }
                  totalShipping { amount currencyCode }
                  totalTax      { amount currencyCode }
                  shippingAddress {
                    firstName lastName
                    address1 address2
                    city province country zip
                  }
                  lineItems(first: 10) {
                    nodes {
                      title
                      quantity
                      variantTitle
                    }
                  }
                  fulfillments(first: 5) {
                    nodes {
                      displayStatus
                      trackingInfo {
                        company
                        number
                        url
                      }
                    }
                  }
                }
              }
            }
          }`,
        }),
      })
      const json = await res.json()
      return json?.data?.customer?.orders?.nodes || []
    } catch { return [] }
  }, [resolvedToken])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const idToken = resolvedToken
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setCustomer(null)
    setToken(null)
    setError(null)
    callbackRan.current = false

    try {
      const config = await discoverAuthEndpoints()
      const url    = new URL(config.end_session_endpoint)
      if (idToken) url.searchParams.append('id_token_hint', idToken)
      url.searchParams.append('post_logout_redirect_uri', APP_URL)
      window.location.href = url.toString()
    } catch {
      window.location.href = APP_URL
    }
  }, [resolvedToken])

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
