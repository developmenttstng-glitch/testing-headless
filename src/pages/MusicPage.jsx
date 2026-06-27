import { useState, useEffect, useRef, useCallback } from 'react'

// ── Default playlists — edit titles and IDs to your own ─────────────────────
// To find a playlist ID: youtube.com/playlist?list=PLAYLIST_ID_HERE
//                                                    ^^^^^^^^^^^^^^^^
const DEFAULT_PLAYLISTS = [
  { id: 1, title: 'Random Playlist',      playlistId: 'PLtbTLuDnukbd0GxFD7luJNgH6_tp8qxWN' },
  { id: 2, title: 'Maki',        playlistId: 'PLj-aqtAx2gcUntmX29_YXvgvz1M15aKSf' },
  { id: 3, title: 'Cup of Joe',     playlistId: 'PLxA687tYuMWiJpOptROc70f98ilFRa_gI' },
  { id: 4, title: 'Silent Sanctuary',       playlistId: 'PLEFw-gRT1Nu9m_4flpFoUB4-MnV0-H1YB' },
  { id: 5, title: 'Eheads, Parokya, Rivermaya',       playlistId: 'PLiy0XOfUv4hG015r78ijWECJ-BZHdxyEJ' },
  { id: 6, title: '6Cyclemind, Cueshe, Sponge Cola, SugarFree',       playlistId: 'PLEbKodTRJs9--8H7ACBA7wnJIR53Eu8BW' },
  { id: 7, title: 'Playlist 7',       playlistId: '' },
  { id: 8, title: 'Playlist 8',       playlistId: '' },
  { id: 9, title: 'Playlist 9',       playlistId: '' },
  { id: 10, title: 'Playlist 10',     playlistId: '' },
]

const STORAGE_KEY = 'neon_playlists'

function loadPlaylists() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved && Array.isArray(saved) && saved.length === 10) return saved
  } catch {}
  return DEFAULT_PLAYLISTS
}

function savePlaylists(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

// ── YouTube IFrame API loader ─────────────────────────────────────────────────
let ytReady = false
let ytCallbacks = []

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) { ytReady = true; return }
  if (document.getElementById('yt-api-script')) return
  const tag = document.createElement('script')
  tag.id  = 'yt-api-script'
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
  window.onYouTubeIframeAPIReady = () => {
    ytReady = true
    ytCallbacks.forEach(cb => cb())
    ytCallbacks = []
  }
}

function onYTReady(cb) {
  if (ytReady) { cb(); return }
  ytCallbacks.push(cb)
  loadYouTubeAPI()
}

export default function MusicPage() {
  const [playlists,    setPlaylists]    = useState(loadPlaylists)
  const [activeIdx,    setActiveIdx]    = useState(0)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [volume,       setVolume]       = useState(70)
  const [isMuted,      setIsMuted]      = useState(false)
  const [showVideo,    setShowVideo]    = useState(true)
  const [shuffle,      setShuffle]      = useState(false)
  const [repeat,       setRepeat]       = useState(false)
  const [playerReady,  setPlayerReady]  = useState(false)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [nowPlaying,   setNowPlaying]   = useState({ title: 'Select a playlist', author: '' })
  const [visualizer,   setVisualizer]   = useState(Array.from({length:32}, ()=>0.2))
  const [editingIdx,   setEditingIdx]   = useState(null)  // which playlist is being edited
  const [editTitle,    setEditTitle]    = useState('')
  const [editId,       setEditId]       = useState('')
  const [playerLoaded, setPlayerLoaded] = useState(false)

  const playerRef  = useRef(null)
  const timerRef   = useRef(null)
  const vizRef     = useRef(null)

  const active = playlists[activeIdx]

  // ── Visualizer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    vizRef.current = setInterval(() => {
      setVisualizer(prev => prev.map(v => {
        if (isPlaying) {
          const target = 0.1 + Math.random() * 0.9
          return v + (target - v) * 0.3
        }
        return Math.max(0.05, v * 0.92)
      }))
    }, 80)
    return () => clearInterval(vizRef.current)
  }, [isPlaying])

  // ── Timer ────────────────────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      try {
        if (playerRef.current?.getCurrentTime) {
          setCurrentTime(playerRef.current.getCurrentTime())
          setDuration(playerRef.current.getDuration() || 0)
        }
      } catch {}
    }, 1000)
  }
  function stopTimer() { clearInterval(timerRef.current) }

  // ── Init YouTube player ──────────────────────────────────────────────────────
  useEffect(() => {
    onYTReady(() => {
      if (playerRef.current) return
      const firstWithId = playlists.find(p => p.playlistId.trim())
      if (!firstWithId) return

      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width:  '100%',
        playerVars: {
          autoplay:       0,
          controls:       0,
          rel:            0,
          modestbranding: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          listType:       'playlist',
          list:           firstWithId.playlistId,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(70)
            setPlayerReady(true)
            setPlayerLoaded(true)
            try {
              const data = e.target.getVideoData()
              if (data?.title) setNowPlaying({ title: data.title, author: data.author || '' })
            } catch {}
          },
          onStateChange: (e) => {
            const YTS = window.YT.PlayerState
            if (e.data === YTS.PLAYING) {
              setIsPlaying(true)
              startTimer()
              try {
                const data = e.target.getVideoData()
                if (data?.title) setNowPlaying({ title: data.title, author: data.author || '' })
                const dur = e.target.getDuration()
                if (dur) setDuration(dur)
              } catch {}
            } else if (e.data === YTS.PAUSED || e.data === YTS.BUFFERING) {
              setIsPlaying(false)
              stopTimer()
            } else if (e.data === YTS.ENDED) {
              setIsPlaying(false)
              stopTimer()
            }
          },
        },
      })
    })
    return () => stopTimer()
  }, [])

  // ── Load a playlist into the player ─────────────────────────────────────────
  function loadPlaylist(idx) {
    const pl = playlists[idx]
    if (!pl?.playlistId?.trim()) return
    setActiveIdx(idx)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setNowPlaying({ title: pl.title, author: 'Loading...' })
    try {
      if (playerRef.current) {
        playerRef.current.loadPlaylist({
          list:      pl.playlistId,
          listType: 'playlist',
          index:     0,
        })
        // Pause immediately — don't autoplay on switch
        setTimeout(() => {
          try { playerRef.current?.pauseVideo() } catch {}
        }, 800)
      } else {
        // Player not ready yet — init it with this playlist
        onYTReady(() => {
          if (playerRef.current) return
          playerRef.current = new window.YT.Player('yt-player', {
            height: '100%', width: '100%',
            playerVars: {
              autoplay: 0, controls: 0, rel: 0,
              modestbranding: 1, iv_load_policy: 3, cc_load_policy: 0,
              listType: 'playlist', list: pl.playlistId,
            },
            events: {
              onReady: (e) => {
                e.target.setVolume(volume)
                setPlayerReady(true)
                setPlayerLoaded(true)
              },
              onStateChange: (e) => {
                const YTS = window.YT.PlayerState
                if (e.data === YTS.PLAYING) {
                  setIsPlaying(true); startTimer()
                  try {
                    const data = e.target.getVideoData()
                    if (data?.title) setNowPlaying({ title: data.title, author: data.author||'' })
                  } catch {}
                } else if (e.data === YTS.PAUSED || e.data === YTS.BUFFERING) {
                  setIsPlaying(false); stopTimer()
                } else if (e.data === YTS.ENDED) {
                  setIsPlaying(false); stopTimer()
                }
              },
            },
          })
        })
      }
    } catch {}
  }

  // ── Controls ─────────────────────────────────────────────────────────────────
  function togglePlay() {
    if (!playerRef.current) return
    try {
      if (isPlaying) playerRef.current.pauseVideo()
      else           playerRef.current.playVideo()
    } catch {}
  }

  const handleNext = useCallback(() => {
    try { playerRef.current?.nextVideo() } catch {}
  }, [])

  function handlePrev() {
    if (currentTime > 3) {
      try { playerRef.current?.seekTo(0, true) } catch {}
      setCurrentTime(0); return
    }
    try { playerRef.current?.previousVideo() } catch {}
  }

  function handleVolumeChange(v) {
    const vol = parseInt(v)
    setVolume(vol); setIsMuted(vol === 0)
    try { playerRef.current?.setVolume(vol) } catch {}
  }

  function toggleMute() {
    if (isMuted) {
      setIsMuted(false)
      try { playerRef.current?.unMute(); playerRef.current?.setVolume(volume||70) } catch {}
    } else {
      setIsMuted(true)
      try { playerRef.current?.mute() } catch {}
    }
  }

  function toggleShuffle() {
    const next = !shuffle; setShuffle(next)
    try { playerRef.current?.setShuffle(next) } catch {}
  }

  function handleSeek(v) {
    const t = parseFloat(v); setCurrentTime(t)
    try { playerRef.current?.seekTo(t, true) } catch {}
  }

  // ── Edit playlist ─────────────────────────────────────────────────────────────
  function startEdit(idx, e) {
    e.stopPropagation()
    setEditingIdx(idx)
    setEditTitle(playlists[idx].title)
    setEditId(playlists[idx].playlistId)
  }

  function saveEdit() {
    const updated = playlists.map((p, i) =>
      i === editingIdx
        ? { ...p, title: editTitle.trim() || p.title, playlistId: editId.trim() }
        : p
    )
    setPlaylists(updated)
    savePlaylists(updated)
    setEditingIdx(null)
    // If editing the active playlist, reload it
    if (editingIdx === activeIdx && editId.trim()) {
      loadPlaylist(editingIdx)
    }
  }

  function cancelEdit() { setEditingIdx(null) }

  function extractPlaylistId(input) {
    const m = input.match(/[?&]list=([^&]+)/)
    return m ? m[1] : input.trim()
  }

  // ── Format time ───────────────────────────────────────────────────────────────
  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s/60), sec = Math.floor(s%60)
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const progress = duration > 0 ? (currentTime/duration)*100 : 0
  const VIZ_COLORS = ['#00ffc8','#00ffc8','#bf00ff','#00ffc8','#00c8ff']

  return (
    <>
      <style>{`
        .music-page { padding-top: 60px; min-height: 100vh; background: var(--bg); }

        .music-hero {
          padding: 32px 0 24px;
          border-bottom: 1px solid var(--border);
          background: radial-gradient(ellipse at 50% 100%, rgba(0,255,200,0.04) 0%, transparent 70%);
        }
        .music-eyebrow {
          font-family:var(--mono); font-size:9px; letter-spacing:0.22em;
          text-transform:uppercase; color:rgba(0,255,200,0.5); margin-bottom:6px;
        }
        .music-title {
          font-family:var(--mono); font-size:clamp(24px,4vw,44px);
          font-weight:bold; color:var(--accent); letter-spacing:0.1em;
          text-shadow:0 0 30px rgba(0,255,200,0.3);
        }

        /* THREE COLUMN LAYOUT */
        .music-layout {
          display: grid;
          grid-template-columns: 220px 1fr 240px;
          min-height: calc(100vh - 140px);
        }

        /* ── LEFT — PLAYLIST SELECTOR ── */
        .playlist-col {
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
        }
        .pl-col-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .pl-col-title {
          font-family:var(--mono); font-size:9px; letter-spacing:0.18em;
          text-transform:uppercase; color:rgba(0,255,200,0.4);
        }
        .pl-col-hint { font-size:10px; color:var(--muted); }

        .pl-list { flex:1; overflow-y:auto; }
        .pl-item {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px; cursor:pointer;
          border-bottom:1px solid rgba(0,255,200,0.04);
          transition:background 0.12s; position:relative;
        }
        .pl-item:hover { background:rgba(0,255,200,0.04); }
        .pl-item.active { background:rgba(0,255,200,0.08); }
        .pl-num {
          font-family:var(--mono); font-size:10px;
          color:var(--muted); width:16px; flex-shrink:0; text-align:center;
        }
        .pl-item.active .pl-num { color:var(--accent); }
        .pl-info { flex:1; min-width:0; }
        .pl-name {
          font-size:12px; color:var(--text); white-space:nowrap;
          overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
        }
        .pl-item.active .pl-name { color:var(--accent); }
        .pl-status { font-size:10px; font-family:var(--mono); }
        .pl-status.has-id  { color:rgba(0,255,200,0.4); }
        .pl-status.no-id   { color:rgba(74,106,138,0.5); }
        .pl-edit-btn {
          opacity:0; background:none; border:none; color:var(--muted);
          font-size:13px; cursor:pointer; padding:2px 5px; transition:all 0.15s;
          flex-shrink:0;
        }
        .pl-item:hover .pl-edit-btn { opacity:1; }
        .pl-edit-btn:hover { color:var(--accent); }

        /* Equalizer on active playing item */
        .pl-eq { display:flex; gap:2px; align-items:flex-end; height:12px; width:14px; flex-shrink:0; }
        .pl-eq-b { width:3px; background:var(--accent); border-radius:1px;
          animation:plEq 0.8s ease infinite alternate; }
        .pl-eq-b:nth-child(2) { animation-duration:0.6s; animation-delay:0.1s; }
        .pl-eq-b:nth-child(3) { animation-duration:1s;   animation-delay:0.2s; }
        @keyframes plEq { from{height:2px} to{height:11px} }
        .pl-eq.paused .pl-eq-b { animation-play-state:paused; height:5px; }

        /* EDIT DRAWER */
        .pl-edit-drawer {
          background: var(--surface); border-top:1px solid rgba(0,255,200,0.15);
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
        }
        .edit-field-lbl {
          font-family:var(--mono); font-size:8px; letter-spacing:0.15em;
          text-transform:uppercase; color:rgba(0,255,200,0.35); margin-bottom:5px;
        }
        .edit-input {
          width:100%; background:var(--surface2); border:1px solid var(--border);
          color:var(--text); font-family:var(--mono); font-size:11px;
          padding:7px 9px; outline:none; transition:border-color 0.15s; margin-bottom:8px;
        }
        .edit-input:focus { border-color:var(--accent); }
        .edit-input::placeholder { color:var(--muted); }
        .edit-btns { display:flex; gap:6px; }
        .edit-save {
          flex:1; padding:7px; background:var(--accent); color:var(--bg);
          border:none; font-family:var(--mono); font-size:9px; letter-spacing:0.12em;
          text-transform:uppercase; font-weight:bold; cursor:pointer;
        }
        .edit-cancel {
          padding:7px 12px; background:transparent;
          border:1px solid var(--border); color:var(--muted);
          font-family:var(--mono); font-size:9px; cursor:pointer; transition:all 0.15s;
        }
        .edit-cancel:hover { border-color:var(--accent); color:var(--accent); }

        /* ── CENTRE — PLAYER ── */
        .player-area {
          padding: 20px 28px;
          display: flex; flex-direction: column; gap: 12px;
          border-right: 1px solid var(--border);
        }

        .video-container {
          width:100%; background:#000; border:1px solid var(--border);
          border-radius:3px; overflow:hidden; position:relative;
          transition:all 0.35s ease;
        }
        .video-container.visible { aspect-ratio:16/9; opacity:1; }
        .video-container.hidden  { height:0; opacity:0; border:none; }
        .video-overlay { position:absolute; inset:0; z-index:2; cursor:pointer; }

        .now-playing { display:flex; align-items:center; gap:12px; }
        .np-disc {
          width:40px; height:40px; flex-shrink:0;
          background:var(--surface2); border:1px solid var(--border);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          font-size:16px; color:var(--accent);
          animation:discSpin 8s linear infinite; animation-play-state:paused;
        }
        .np-disc.spinning { animation-play-state:running; }
        @keyframes discSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .np-title {
          font-family:var(--mono); font-size:13px; font-weight:bold;
          color:var(--text); margin-bottom:2px; white-space:nowrap;
          overflow:hidden; text-overflow:ellipsis; max-width:340px;
        }
        .np-author { font-size:11px; color:var(--muted); font-family:var(--mono); }
        .np-playlist-tag {
          font-size:9px; font-family:var(--mono); letter-spacing:0.1em;
          text-transform:uppercase; color:var(--accent);
          border:1px solid rgba(0,255,200,0.2); padding:2px 7px; margin-top:3px;
          display:inline-block;
        }

        .visualizer { display:flex; align-items:flex-end; gap:2px; height:40px; }
        .viz-bar { flex:1; border-radius:1px 1px 0 0; min-height:2px; transition:height 0.08s ease; }

        .progress-area { }
        .progress-times {
          display:flex; justify-content:space-between;
          font-family:var(--mono); font-size:10px; color:var(--muted); margin-bottom:5px;
        }
        .progress-track { width:100%; height:3px; background:var(--surface2); border-radius:2px; position:relative; cursor:pointer; }
        .progress-fill { height:100%; background:var(--accent); border-radius:2px; pointer-events:none; transition:width 0.5s linear; }
        input[type=range].seek { position:absolute; inset:-6px 0; width:100%; height:15px; opacity:0; cursor:pointer; margin:0; }

        .controls { display:flex; align-items:center; justify-content:center; gap:8px; }
        .ctrl { background:none; border:none; cursor:pointer; color:var(--muted); font-size:18px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .ctrl:hover { color:var(--accent); background:rgba(0,255,200,0.08); }
        .ctrl.on { color:var(--accent); }
        .ctrl-play { width:50px; height:50px; font-size:20px; background:var(--accent); color:var(--bg); border:none; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(0,255,200,0.35); transition:all 0.15s; }
        .ctrl-play:hover { box-shadow:0 0 26px rgba(0,255,200,0.6); transform:scale(1.05); }
        .ctrl-play:disabled { opacity:0.4; cursor:not-allowed; transform:none; }

        .volume-row { display:flex; align-items:center; gap:10px; }
        .vol-btn { background:none; border:none; cursor:pointer; color:var(--muted); font-size:15px; padding:4px; transition:color 0.15s; flex-shrink:0; }
        .vol-btn:hover { color:var(--accent); }
        input[type=range].vol { flex:1; height:3px; cursor:pointer; accent-color:var(--accent); }
        .vol-pct { font-family:var(--mono); font-size:10px; color:var(--muted); width:28px; text-align:right; }

        .extra-row { display:flex; gap:6px; flex-wrap:wrap; }
        .ex-btn { font-family:var(--mono); font-size:9px; letter-spacing:0.1em; text-transform:uppercase; padding:5px 11px; border:1px solid var(--border); background:transparent; color:var(--muted); cursor:pointer; border-radius:2px; transition:all 0.15s; }
        .ex-btn:hover { border-color:var(--accent); color:var(--accent); }
        .ex-btn.on { background:rgba(0,255,200,0.08); border-color:var(--accent); color:var(--accent); }

        /* ── RIGHT — INFO PANEL ── */
        .info-panel { padding:18px 16px; display:flex; flex-direction:column; gap:14px; }
        .info-lbl { font-family:var(--mono); font-size:8px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(0,255,200,0.35); margin-bottom:7px; padding-bottom:6px; border-bottom:1px solid var(--border); }

        .now-block { background:var(--surface); border:1px solid var(--border); border-radius:3px; padding:12px; }
        .now-block-status { font-family:var(--mono); font-size:8px; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:6px; }
        .now-block-title { font-size:12px; color:var(--text); font-weight:500; margin-bottom:2px; line-height:1.4; }
        .now-block-author { font-size:10px; color:var(--muted); font-family:var(--mono); }

        .ctrl-ref .ref-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid rgba(0,255,200,0.04); }
        .ref-key { font-family:var(--mono); font-size:10px; color:var(--accent); }
        .ref-desc { font-size:10px; color:var(--muted); }

        .no-playlist-msg {
          padding:16px; background:var(--surface); border:1px solid var(--border);
          border-radius:3px; font-size:11px; color:var(--muted); line-height:1.6;
          font-family:var(--mono);
        }

        @media (max-width:1100px) {
          .music-layout { grid-template-columns:180px 1fr 200px; }
        }
        @media (max-width:860px) {
          .music-layout { grid-template-columns:1fr; }
          .playlist-col { border-right:none; border-bottom:1px solid var(--border); max-height:280px; }
          .player-area { border-right:none; border-bottom:1px solid var(--border); }
        }
      `}</style>

      <div className="music-page">

        {/* Hero */}
        <div className="music-hero">
          <div className="container">
            <div className="music-eyebrow">// Sound system</div>
            <div className="music-title">NEON RADIO</div>
          </div>
        </div>

        <div className="music-layout">

          {/* ── LEFT — PLAYLIST SELECTOR ── */}
          <div className="playlist-col">
            <div className="pl-col-header">
              <div className="pl-col-title">// Playlists</div>
              <div className="pl-col-hint">✎ to edit</div>
            </div>

            <div className="pl-list">
              {playlists.map((pl, idx) => (
                <div key={pl.id}>
                  <div
                    className={`pl-item ${idx === activeIdx ? 'active' : ''}`}
                    onClick={() => pl.playlistId.trim() && loadPlaylist(idx)}>

                    <div className="pl-num">
                      {idx === activeIdx && pl.playlistId.trim() ? (
                        <div className={`pl-eq ${!isPlaying ? 'paused' : ''}`}>
                          <div className="pl-eq-b"/>
                          <div className="pl-eq-b"/>
                          <div className="pl-eq-b"/>
                        </div>
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="pl-info">
                      <div className="pl-name">{pl.title}</div>
                      <div className={`pl-status ${pl.playlistId.trim() ? 'has-id' : 'no-id'}`}>
                        {pl.playlistId.trim() ? '● ready' : '○ no playlist'}
                      </div>
                    </div>

                    <button
                      className="pl-edit-btn"
                      onClick={e => startEdit(idx, e)}
                      title="Edit playlist">
                      ✎
                    </button>
                  </div>

                  {/* Inline edit drawer */}
                  {editingIdx === idx && (
                    <div className="pl-edit-drawer">
                      <div className="edit-field-lbl">Playlist title</div>
                      <input
                        className="edit-input"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="e.g. Lofi Chill"
                        maxLength={30}
                      />
                      <div className="edit-field-lbl">YouTube playlist URL or ID</div>
                      <input
                        className="edit-input"
                        value={editId}
                        onChange={e => setEditId(extractPlaylistId(e.target.value))}
                        placeholder="Paste URL or playlist ID"
                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      />
                      <div style={{fontSize:'9px',color:'var(--muted)',marginBottom:'8px',fontFamily:'var(--mono)'}}>
                        Paste full YouTube URL — ID auto-extracted
                      </div>
                      <div className="edit-btns">
                        <button className="edit-save" onClick={saveEdit}>Save</button>
                        <button className="edit-cancel" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── CENTRE — PLAYER ── */}
          <div className="player-area">

            {/* YouTube iframe */}
            <div className={`video-container ${showVideo ? 'visible' : 'hidden'}`}>
              <div id="yt-player" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
              <div className="video-overlay" onClick={togglePlay}/>
            </div>

            {/* Now playing */}
            <div className="now-playing">
              <div className={`np-disc ${isPlaying ? 'spinning' : ''}`}>◈</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="np-title">{nowPlaying.title}</div>
                <div className="np-author">{nowPlaying.author || '—'}</div>
                {active?.title && (
                  <div className="np-playlist-tag">{active.title}</div>
                )}
              </div>
            </div>

            {/* Visualizer */}
            <div className="visualizer">
              {visualizer.map((v, i) => (
                <div key={i} className="viz-bar" style={{
                  height:`${v*100}%`,
                  background:VIZ_COLORS[i%VIZ_COLORS.length],
                  opacity:0.75,
                }}/>
              ))}
            </div>

            {/* Progress */}
            <div className="progress-area">
              <div className="progress-times">
                <span>{fmt(currentTime)}</span>
                <span>{duration > 0 ? fmt(duration) : '—'}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{width:`${progress}%`}}/>
                <input type="range" className="seek"
                  min={0} max={duration||100} step={1} value={currentTime}
                  onChange={e => handleSeek(e.target.value)}/>
              </div>
            </div>

            {/* Controls */}
            <div className="controls">
              <button className={`ctrl ${shuffle?'on':''}`} onClick={toggleShuffle} title="Shuffle">⇄</button>
              <button className="ctrl" onClick={handlePrev} title="Previous">⏮</button>
              <button className="ctrl-play" onClick={togglePlay}
                disabled={!playerReady} title={isPlaying?'Pause':'Play'}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="ctrl" onClick={handleNext} title="Next">⏭</button>
              <button className={`ctrl ${repeat?'on':''}`}
                onClick={() => setRepeat(r=>!r)} title="Repeat">↺</button>
            </div>

            {/* Volume */}
            <div className="volume-row">
              <button className="vol-btn" onClick={toggleMute}>
                {isMuted||volume===0 ? '🔇' : volume<40 ? '🔈' : '🔊'}
              </button>
              <input type="range" className="vol"
                min={0} max={100} step={1} value={isMuted?0:volume}
                onChange={e => handleVolumeChange(e.target.value)}/>
              <span className="vol-pct">{isMuted?0:volume}%</span>
            </div>

            {/* Extra */}
            <div className="extra-row">
              <button className={`ex-btn ${showVideo?'on':''}`} onClick={() => setShowVideo(v=>!v)}>
                {showVideo ? '◼ Hide video' : '▶ Show video'}
              </button>
              <button className="ex-btn" onClick={() => {
                try { playerRef.current?.seekTo(0,true) } catch {}
                setCurrentTime(0)
              }}>↩ Restart</button>
              {active?.playlistId && (
                <button className="ex-btn"
                  onClick={() => window.open(`https://youtube.com/playlist?list=${active.playlistId}`,'_blank')}>
                  ↗ YouTube
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT — INFO ── */}
          <div className="info-panel">

            <div>
              <div className="info-lbl">// Now playing</div>
              <div className="now-block">
                <div className="now-block-status" style={{color:isPlaying?'var(--accent)':'var(--muted)'}}>
                  {isPlaying ? '▶ Playing' : '◼ Paused'}
                </div>
                <div className="now-block-title">{nowPlaying.title}</div>
                <div className="now-block-author">{nowPlaying.author || '—'}</div>
              </div>
            </div>

            {!active?.playlistId?.trim() && (
              <div className="no-playlist-msg">
                Click ✎ on any playlist to add a YouTube URL or playlist ID.
              </div>
            )}

            <div>
              <div className="info-lbl">// Active playlist</div>
              <div style={{fontSize:'12px',color:'var(--text)',marginBottom:'4px',fontWeight:500}}>{active?.title}</div>
              {active?.playlistId ? (
                <div style={{fontSize:'10px',color:'var(--muted)',fontFamily:'var(--mono)',wordBreak:'break-all'}}>
                  {active.playlistId.slice(0,28)}...
                </div>
              ) : (
                <div style={{fontSize:'10px',color:'var(--muted)',fontFamily:'var(--mono)'}}>No playlist set</div>
              )}
            </div>

            <div className="ctrl-ref">
              <div className="info-lbl">// Controls</div>
              {[
                ['⏮','Prev track'],
                ['⏭','Next track'],
                ['⇄','Shuffle'],
                ['↺','Repeat'],
                ['▶ / ⏸','Play / pause'],
                ['🔊','Mute'],
              ].map(([key,label]) => (
                <div className="ref-row" key={key}>
                  <span className="ref-key">{key}</span>
                  <span className="ref-desc">{label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
