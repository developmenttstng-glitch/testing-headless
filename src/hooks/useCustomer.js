// ── Simple customer account — links to Shopify's hosted account page ──────────
// No OAuth, no tokens, no callbacks. Clean and reliable.

const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'headless-website.myshopify.com'

export function useCustomer() {
  function login() {
    window.open(`https://${SHOPIFY_DOMAIN}/account/login`, '_blank')
  }

  function goToAccount() {
    window.open(`https://${SHOPIFY_DOMAIN}/account`, '_blank')
  }

  function goToOrders() {
    window.open(`https://${SHOPIFY_DOMAIN}/account/orders`, '_blank')
  }

  return {
    customer:    null,
    token:       null,
    isLoggedIn:  false,
    loading:     false,
    error:       null,
    login,
    logout:      () => window.open(`https://${SHOPIFY_DOMAIN}/account/logout`, '_blank'),
    goToAccount,
    goToOrders,
    handleCallback: () => Promise.resolve(false),
    fetchOrders:    () => Promise.resolve([]),
  }
}
