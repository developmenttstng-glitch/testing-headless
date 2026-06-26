import { createStorefrontApiClient } from '@shopify/storefront-api-client'

export const shopifyClient = createStorefrontApiClient({
  storeDomain:     import.meta.env.VITE_SHOPIFY_STORE_DOMAIN,
  apiVersion:      import.meta.env.VITE_SHOPIFY_API_VERSION || '2025-01',
  publicAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN,
})
