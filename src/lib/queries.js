export const GET_PRODUCTS = `
  query GetProducts($first: Int!) {
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
          images(first: 3) {
            edges { node { url altText } }
          }
          tags
        }
      }
    }
  }
`

export const CREATE_CART = `
  mutation CartCreate($lines: [CartLineInput!]) {
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
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
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
