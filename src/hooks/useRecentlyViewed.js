import { useState, useCallback } from 'react'

const KEY = 'neon_recently_viewed'
const MAX  = 8

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch {}
}

export function useRecentlyViewed() {
  const [items, setItems] = useState(load)

  const add = useCallback((product) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id)
      const next = [product, ...filtered].slice(0, MAX)
      save(next)
      return next
    })
  }, [])

  return { items, add }
}
