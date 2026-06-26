import { useState, useCallback } from 'react'

const KEY = 'neon_wishlist'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch {}
}

export function useWishlist() {
  const [items, setItems] = useState(load)

  const toggle = useCallback((product) => {
    setItems(prev => {
      const exists = prev.some(p => p.id === product.id)
      const next = exists
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
      save(next)
      return next
    })
  }, [])

  const isWishlisted = useCallback((id) => {
    return items.some(p => p.id === id)
  }, [items])

  const clear = useCallback(() => { setItems([]); save([]) }, [])

  return { items, toggle, isWishlisted, clear, count: items.length }
}
