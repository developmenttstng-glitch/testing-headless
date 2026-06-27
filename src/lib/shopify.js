import { createStorefrontApiClient } from '@shopify/storefront-api-client'

export const shopifyClient = createStorefrontApiClient({
  storeDomain:       import.meta.env.VITE_SHOPIFY_STORE_DOMAIN,
  apiVersion:        import.meta.env.VITE_SHOPIFY_API_VERSION || '2026-04',
  publicAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN,
})

// Country code for price context — matches your store's market
// PH = Philippines (PHP - Philippine Peso)
// Change this if your store targets a different country
export const COUNTRY_CODE = 'PH'
