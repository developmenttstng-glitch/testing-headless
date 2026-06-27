// All queries use @inContext(country: $country) to return correct local currency
// Pass country: "PH" in variables to get PHP prices

export const GET_PRODUCTS = `
  query GetProducts($first: Int!, $country: CountryCode!) @inContext(country: $country) {
    products(first: $first) {
      edges {
        node {
          id title handle description
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          variants(first: 10) {
            edges {
              node {
                id title availableForSale
                price { amount currencyCode }
              }
            }
          }
          featuredImage { url altText }
          images(first: 5) {
            edges { node { url altText } }
          }
          tags
        }
      }
    }
  }
`

export const CREATE_CART = `
  mutation CartCreate($lines: [CartLineInput!], $country: CountryCode!)
    @inContext(country: $country) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id checkoutUrl
        lines(first: 10) {
          edges {
            node {
              id quantity
              merchandise {
                ... on ProductVariant {
                  id title
                  product { title }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
        cost { totalAmount { amount currencyCode } }
      }
    }
  }
`

export const ADD_CART_LINES = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $country: CountryCode!)
    @inContext(country: $country) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id checkoutUrl
        lines(first: 10) {
          edges {
            node {
              id quantity
              merchandise {
                ... on ProductVariant {
                  id title
                  product { title }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
        cost { totalAmount { amount currencyCode } }
      }
    }
  }
`

export const GET_CART = `
  query GetCart($cartId: ID!, $country: CountryCode!) @inContext(country: $country) {
    cart(id: $cartId) {
      id checkoutUrl
      lines(first: 10) {
        edges {
          node {
            id quantity
            merchandise {
              ... on ProductVariant {
                id title
                product { title }
                price { amount currencyCode }
              }
            }
          }
        }
      }
      cost { totalAmount { amount currencyCode } }
    }
  }
`
