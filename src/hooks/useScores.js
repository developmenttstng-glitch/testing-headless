import { useState, useCallback } from 'react'

const KEY = 'neon_scores'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function save(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch {}
}

export function useScores() {
  const [scores, setScores] = useState(load)

  const getBest = useCallback((id) => {
    const list = scores[id] || []
    return list.length ? Math.max(...list.map(s => s.score)) : 0
  }, [scores])

  const getTop = useCallback((id, n = 5) => {
    return (scores[id] || []).slice(0, n)
  }, [scores])

  const addScore = useCallback((id, score) => {
    setScores(prev => {
      const list = [...(prev[id] || []), { score, date: new Date().toLocaleDateString() }]
      list.sort((a, b) => b.score - a.score)
      const next = { ...prev, [id]: list.slice(0, 5) }
      save(next)
      return next
    })
  }, [])

  return { getBest, getTop, addScore }
}
