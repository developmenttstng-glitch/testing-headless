import { useState } from 'react'
import { shopifyClient } from '../lib/shopify'
import { CREATE_CART, ADD_CART_LINES } from '../lib/queries'

export function useCart() {
  const [cart,    setCart]    = useState(null)
  const [loading, setLoading] = useState(false)

  const totalItems = cart
    ? cart.lines.edges.reduce((s, e) => s + e.node.quantity, 0)
    : 0

  const totalPrice = cart
    ? parseFloat(cart.cost.totalAmount.amount).toFixed(2)
    : '0.00'

  const currency = cart?.cost?.totalAmount?.currencyCode || 'USD'

  const lines = cart
    ? cart.lines.edges.map(e => e.node)
    : []

  async function addToCart(variantId, quantity = 1) {
    setLoading(true)
    try {
      if (!cart) {
        const { data } = await shopifyClient.request(CREATE_CART, {
          variables: { lines: [{ merchandiseId: variantId, quantity }] },
        })
        setCart(data.cartCreate.cart)
      } else {
        const { data } = await shopifyClient.request(ADD_CART_LINES, {
          variables: { cartId: cart.id, lines: [{ merchandiseId: variantId, quantity }] },
        })
        setCart(data.cartLinesAdd.cart)
      }
    } catch (err) {
      console.error('Cart error:', err)
    } finally {
      setLoading(false)
    }
  }

  function goToCheckout() {
    if (cart?.checkoutUrl) window.location.href = cart.checkoutUrl
  }

  return { cart, lines, totalItems, totalPrice, currency, loading, addToCart, goToCheckout }
}
