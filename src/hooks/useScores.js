import { useState, useEffect, useCallback } from 'react'

const SUPABASE_URL = 'https://mmbslafosnxbysifyfjb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYnNsYWZvc254YnlzaWZ5ZmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzE5NTYsImV4cCI6MjA5ODE0Nzk1Nn0.IkV0g-8R86bKMRSjO-XDQwblIOZDItVVFjLKDPNng7g'

const HEADERS = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
}

// Local best score — just for the "Best" display in the score strip (no network needed)
function getLocalBest(gameId) {
  try { return JSON.parse(localStorage.getItem('neon_scores_v2') || '{}')[gameId] || 0 } catch { return 0 }
}
function setLocalBest(gameId, score) {
  try {
    const d = JSON.parse(localStorage.getItem('neon_scores_v2') || '{}')
    if (!d[gameId] || score > d[gameId]) { d[gameId] = score; localStorage.setItem('neon_scores_v2', JSON.stringify(d)) }
  } catch {}
}

// Fetch top scores from Supabase
async function fetchTop(gameId, limit = 10) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores?game_id=eq.${gameId}&order=score.desc&limit=${limit}`,
    { headers: HEADERS }
  )
  if (!res.ok) throw new Error(res.status)
  const rows = await res.json()
  return rows.map(r => ({ name: r.name, score: r.score, date: r.created_at?.slice(0,10) }))
}

// Insert score to Supabase
async function insertScore(gameId, name, score) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method:  'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body:    JSON.stringify({ game_id: gameId, name, score }),
  })
  if (!res.ok) throw new Error(res.status)
}

export function useScores() {
  // topScores — global state: { [gameId]: [{name, score, date}] }
  const [topScores, setTopScores] = useState({})

  function getBest(gameId) {
    return getLocalBest(gameId)
  }

  function getTop(gameId, limit = 10) {
    return (topScores[gameId] || []).slice(0, limit)
  }

  async function refreshScores(gameId) {
    try {
      const scores = await fetchTop(gameId, 10)
      setTopScores(prev => ({ ...prev, [gameId]: scores }))
      return scores
    } catch (err) {
      console.warn('Could not fetch scores from Supabase:', err.message)
      return []
    }
  }

  async function addScore(gameId, score, name = 'Anonymous') {
    if (!score || score <= 0) return
    setLocalBest(gameId, score)
    try {
      await insertScore(gameId, name, score)
      // Refresh immediately so new score shows
      await refreshScores(gameId)
    } catch (err) {
      console.warn('Could not save score to Supabase:', err.message)
    }
  }

  return { getBest, getTop, addScore, refreshScores }
}
