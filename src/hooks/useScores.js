// Global leaderboard via Supabase
// Falls back to localStorage if Supabase is unavailable

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mmbslafosnxbysifyfjb.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tYnNsYWZvc254YnlzaWZ5ZmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzE5NTYsImV4cCI6MjA5ODE0Nzk1Nn0.IkV0g-8R86bKMRSjO-XDQwblIOZDItVVFjLKDPNng7g'

const HEADERS = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
}

// ── Local storage helpers (for getBest — instant, no network) ─────────────────
const LS_KEY = 'neon_scores_v2'

function getLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}

function setLocalBest(gameId, score) {
  const data = getLocal()
  if (!data[gameId] || score > data[gameId]) {
    data[gameId] = score
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  }
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbInsert(gameId, name, score) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method:  'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body:    JSON.stringify({ game_id: gameId, name, score }),
  })
  if (!res.ok) throw new Error(`Insert failed: ${res.status}`)
}

async function sbGetTop(gameId, limit = 10) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores?game_id=eq.${gameId}&order=score.desc&limit=${limit}`,
    { headers: HEADERS }
  )
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return await res.json()
}

async function sbGetBest(gameId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores?game_id=eq.${gameId}&order=score.desc&limit=1`,
    { headers: HEADERS }
  )
  if (!res.ok) return 0
  const rows = await res.json()
  return rows[0]?.score || 0
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useScores() {

  // getBest — returns local best instantly (no network delay in UI)
  function getBest(gameId) {
    return getLocal()[gameId] || 0
  }

  // getTop — returns cached local scores instantly
  // ArcadePage calls this for display; refreshTopScores updates from Supabase
  function getTop(gameId, limit = 10) {
    try {
      const cached = JSON.parse(localStorage.getItem(`neon_top_${gameId}`)) || []
      return cached.slice(0, limit)
    } catch { return [] }
  }

  // addScore — saves to localStorage + Supabase
  async function addScore(gameId, score, name = 'Anonymous') {
    if (!score || score <= 0) return

    // Always save local best
    setLocalBest(gameId, score)

    // Save to Supabase
    try {
      await sbInsert(gameId, name, score)
      // Refresh top scores for this game in background
      const top = await sbGetTop(gameId, 10)
      const formatted = top.map(r => ({ name: r.name, score: r.score, date: r.created_at?.slice(0,10) }))
      localStorage.setItem(`neon_top_${gameId}`, JSON.stringify(formatted))
    } catch (err) {
      console.warn('Supabase unavailable, score saved locally only:', err.message)
      // Fallback: save to local top scores
      const local = getTop(gameId)
      const updated = [...local, { name, score, date: new Date().toISOString().slice(0,10) }]
        .sort((a,b) => b.score - a.score)
        .slice(0, 10)
      localStorage.setItem(`neon_top_${gameId}`, JSON.stringify(updated))
    }
  }

  // refreshScores — call this to pull latest from Supabase for a game
  async function refreshScores(gameId) {
    try {
      const top = await sbGetTop(gameId, 10)
      const formatted = top.map(r => ({ name: r.name, score: r.score, date: r.created_at?.slice(0,10) }))
      localStorage.setItem(`neon_top_${gameId}`, JSON.stringify(formatted))
      return formatted
    } catch { return getTop(gameId) }
  }

  return { getBest, getTop, addScore, refreshScores }
}
