import { useState, useEffect, useRef, useCallback } from 'react'

// ── YouTube Playlist config ───────────────────────────────────────────────────
// To change playlist: paste your playlist ID (the part after list= in the URL)
// e.g. youtube.com/playlist?list=PLtbTLuDnukbd0GxFD7luJNgH6_tp8qxWN
const PLAYLIST_ID = 'PLtbTLuDnukbd0GxFD7luJNgH6_tp8qxWN'

// ── YouTube IFrame API loader ─────────────────────────────────────────────────
let ytReady = false
let ytCallbacks = []

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) { ytReady = true; return }
  if (document.getElementById('yt-api-script')) return
  const tag = document.createElement('script')
  tag.id = 'yt-api-script'
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
  const [isPlaying,      setIsPlaying]      = useState(false)
  const [volume,         setVolume]         = useState(70)
  const [isMuted,        setIsMuted]        = useState(false)
  const [showVideo,      setShowVideo]      = useState(true)
  const [shuffle,        setShuffle]        = useState(false)
  const [repeat,         setRepeat]         = useState(false)
  const [playerReady,    setPlayerReady]    = useState(false)
  const [currentTime,    setCurrentTime]    = useState(0)
  const [duration,       setDuration]       = useState(0)
  const [nowPlaying,     setNowPlaying]     = useState({ title: 'Loading...', author: '' })
  const [visualizer,     setVisualizer]     = useState(Array.from({ length: 32 }, () => 0.2))
  const [customUrl,      setCustomUrl]      = useState('')
  const [customTitle,    setCustomTitle]    = useState('')
  const [showAdd,        setShowAdd]        = useState(false)

  const playerRef  = useRef(null)
  const timerRef   = useRef(null)
  const vizRef     = useRef(null)

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

  // ── Timer for progress bar ───────────────────────────────────────────────────
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
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay:       0,
          controls:       0,
          rel:            0,
          modestbranding: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          listType:       'playlist',
          list:           PLAYLIST_ID,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(70)
            setPlayerReady(true)
            // Get first video info
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

  // ── Controls ─────────────────────────────────────────────────────────────────
  function togglePlay() {
    if (!playerRef.current) return
    try {
      if (isPlaying) playerRef.current.pauseVideo()
      else playerRef.current.playVideo()
    } catch {}
  }

  const handleNext = useCallback(() => {
    try { playerRef.current?.nextVideo() } catch {}
  }, [])

  function handlePrev() {
    if (currentTime > 3) {
      try { playerRef.current?.seekTo(0, true) } catch {}
      setCurrentTime(0)
      return
    }
    try { playerRef.current?.previousVideo() } catch {}
  }

  function handleVolumeChange(v) {
    const vol = parseInt(v)
    setVolume(vol)
    setIsMuted(vol === 0)
    try { playerRef.current?.setVolume(vol) } catch {}
  }

  function toggleMute() {
    if (isMuted) {
      setIsMuted(false)
      try { playerRef.current?.unMute(); playerRef.current?.setVolume(volume || 70) } catch {}
    } else {
      setIsMuted(true)
      try { playerRef.current?.mute() } catch {}
    }
  }

  function toggleShuffle() {
    const next = !shuffle
    setShuffle(next)
    try { playerRef.current?.setShuffle(next) } catch {}
  }

  function handleSeek(v) {
    const t = parseFloat(v)
    setCurrentTime(t)
    try { playerRef.current?.seekTo(t, true) } catch {}
  }

  // ── Add custom video ─────────────────────────────────────────────────────────
  function extractVideoId(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    if (m) return m[1]
    return url.length === 11 ? url : null
  }

  function addVideo() {
    const id = extractVideoId(customUrl.trim())
    if (!id) return
    try {
      playerRef.current?.loadVideoById(id)
      setNowPlaying({ title: customTitle || 'Custom track', author: 'Added by you' })
    } catch {}
    setCustomUrl('')
    setCustomTitle('')
    setShowAdd(false)
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const VIZ_COLORS = ['#00ffc8', '#00ffc8', '#bf00ff', '#00ffc8', '#00c8ff']

  return (
    <>
      <style>{`
        .music-page { padding-top: 60px; min-height: 100vh; background: var(--bg); }

        .music-hero {
          padding: 40px 0 28px;
          border-bottom: 1px solid var(--border);
          background: radial-gradient(ellipse at 50% 100%, rgba(0,255,200,0.04) 0%, transparent 70%);
          position: relative;
        }
        .music-eyebrow {
          font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(0,255,200,0.5); margin-bottom: 8px;
        }
        .music-title {
          font-family: var(--mono); font-size: clamp(28px,5vw,52px);
          font-weight: bold; color: var(--accent); letter-spacing: 0.1em;
          text-shadow: 0 0 30px rgba(0,255,200,0.3);
        }

        .music-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          min-height: calc(100vh - 160px);
        }

        .player-area {
          border-right: 1px solid var(--border);
          padding: 24px 32px;
          display: flex; flex-direction: column; gap: 14px;
        }

        .video-container {
          width: 100%; background: #000;
          border: 1px solid var(--border); border-radius: 4px;
          overflow: hidden; position: relative;
          transition: all 0.4s ease;
        }
        .video-container.visible { aspect-ratio: 16/9; opacity: 1; }
        .video-container.hidden  { height: 0; opacity: 0; border: none; overflow: hidden; }
        .video-click-overlay {
          position: absolute; inset: 0; z-index: 2; cursor: pointer;
        }

        .now-playing { display: flex; align-items: center; gap: 14px; }
        .np-disc {
          width: 44px; height: 44px; flex-shrink: 0;
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: var(--accent);
          animation: disc-spin 8s linear infinite;
          animation-play-state: paused;
        }
        .np-disc.spinning { animation-play-state: running; }
        @keyframes disc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .np-title {
          font-family: var(--mono); font-size: 14px; font-weight: bold;
          color: var(--text); margin-bottom: 3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;
        }
        .np-artist { font-size: 11px; color: var(--muted); font-family: var(--mono); }

        .visualizer {
          display: flex; align-items: flex-end; gap: 2px; height: 44px;
        }
        .viz-bar {
          flex: 1; border-radius: 1px 1px 0 0; min-height: 2px;
          transition: height 0.08s ease;
        }

        .progress-area { }
        .progress-times {
          display: flex; justify-content: space-between;
          font-family: var(--mono); font-size: 10px; color: var(--muted); margin-bottom: 6px;
        }
        .progress-track {
          width: 100%; height: 3px; background: var(--surface2);
          border-radius: 2px; position: relative; cursor: pointer;
        }
        .progress-fill {
          height: 100%; background: var(--accent); border-radius: 2px;
          box-shadow: 0 0 6px rgba(0,255,200,0.4); pointer-events: none;
          transition: width 0.5s linear;
        }
        input[type=range].seek {
          position: absolute; inset: -6px 0; width: 100%; height: 15px;
          opacity: 0; cursor: pointer; margin: 0;
        }

        .controls {
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ctrl {
          background: none; border: none; cursor: pointer; color: var(--muted);
          font-size: 18px; width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .ctrl:hover { color: var(--accent); background: rgba(0,255,200,0.08); }
        .ctrl.on { color: var(--accent); }
        .ctrl-play {
          width: 52px; height: 52px; font-size: 20px;
          background: var(--accent); color: var(--bg);
          border: none; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(0,255,200,0.4);
          transition: all 0.15s;
        }
        .ctrl-play:hover { box-shadow: 0 0 28px rgba(0,255,200,0.7); transform: scale(1.05); }
        .ctrl-play:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .volume-row { display: flex; align-items: center; gap: 10px; padding: 0 4px; }
        .vol-btn {
          background: none; border: none; cursor: pointer; color: var(--muted);
          font-size: 16px; padding: 4px; transition: color 0.15s; flex-shrink: 0;
        }
        .vol-btn:hover { color: var(--accent); }
        input[type=range].vol {
          flex: 1; height: 3px; cursor: pointer; accent-color: var(--accent);
        }
        .vol-pct {
          font-family: var(--mono); font-size: 10px; color: var(--muted);
          width: 28px; text-align: right;
        }

        .extra-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .ex-btn {
          font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 6px 12px;
          border: 1px solid var(--border); background: transparent;
          color: var(--muted); cursor: pointer; border-radius: 2px;
          transition: all 0.15s;
        }
        .ex-btn:hover { border-color: var(--accent); color: var(--accent); }
        .ex-btn.on { background: rgba(0,255,200,0.08); border-color: var(--accent); color: var(--accent); }

        .right-panel { display: flex; flex-direction: column; }
        .panel-header {
          padding: 16px; border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .panel-label {
          font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(0,255,200,0.4);
        }
        .panel-body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 16px; }

        .now-block {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 4px; padding: 14px;
        }
        .now-block-lbl {
          font-family: var(--mono); font-size: 8px; letter-spacing: 0.15em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .now-block-title { font-size: 13px; color: var(--text); font-weight: 500; margin-bottom: 3px; line-height: 1.4; }
        .now-block-artist { font-size: 11px; color: var(--muted); font-family: var(--mono); }

        .controls-ref { }
        .ref-lbl {
          font-family: var(--mono); font-size: 8px; letter-spacing: 0.15em;
          text-transform: uppercase; color: rgba(0,255,200,0.3); margin-bottom: 10px;
        }
        .ref-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 5px 0; border-bottom: 1px solid rgba(0,255,200,0.04);
        }
        .ref-key { font-family: var(--mono); font-size: 11px; color: var(--accent); }
        .ref-desc { font-size: 11px; color: var(--muted); }

        .add-section { border-top: 1px solid var(--border); padding: 12px 16px; }
        .add-toggle {
          width: 100%; font-family: var(--mono); font-size: 9px;
          letter-spacing: 0.12em; text-transform: uppercase;
          background: transparent; border: 1px dashed rgba(0,255,200,0.2);
          color: var(--muted); padding: 8px; cursor: pointer; transition: all 0.15s;
        }
        .add-toggle:hover { border-color: var(--accent); color: var(--accent); }
        .add-form { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
        .add-input {
          width: 100%; background: var(--surface); border: 1px solid var(--border);
          color: var(--text); font-family: var(--mono); font-size: 11px;
          padding: 7px 10px; border-radius: 2px; outline: none;
          transition: border-color 0.15s;
        }
        .add-input:focus { border-color: var(--accent); }
        .add-input::placeholder { color: var(--muted); }
        .add-submit {
          font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
          text-transform: uppercase; background: var(--accent); color: var(--bg);
          border: none; padding: 8px; cursor: pointer; font-weight: bold;
        }

        @media (max-width: 900px) {
          .music-layout { grid-template-columns: 1fr; }
          .player-area { border-right: none; border-bottom: 1px solid var(--border); padding: 20px; }
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

          {/* ── LEFT — PLAYER ── */}
          <div className="player-area">

            {/* YouTube iframe */}
            <div className={`video-container ${showVideo ? 'visible' : 'hidden'}`}>
              <div id="yt-player" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />
              <div className="video-click-overlay" onClick={togglePlay} />
            </div>

            {/* Now playing */}
            <div className="now-playing">
              <div className={`np-disc ${isPlaying ? 'spinning' : ''}`}>◈</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="np-title">{nowPlaying.title}</div>
                <div className="np-artist">{nowPlaying.author || '—'}</div>
              </div>
            </div>

            {/* Visualizer */}
            <div className="visualizer">
              {visualizer.map((v, i) => (
                <div
                  key={i}
                  className="viz-bar"
                  style={{
                    height: `${v * 100}%`,
                    background: VIZ_COLORS[i % VIZ_COLORS.length],
                    opacity: 0.75,
                  }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="progress-area">
              <div className="progress-times">
                <span>{fmt(currentTime)}</span>
                <span>{duration > 0 ? fmt(duration) : '—'}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
                <input
                  type="range" className="seek"
                  min={0} max={duration || 100} step={1}
                  value={currentTime}
                  onChange={e => handleSeek(e.target.value)}
                />
              </div>
            </div>

            {/* Main controls */}
            <div className="controls">
              <button className={`ctrl ${shuffle ? 'on' : ''}`} onClick={toggleShuffle} title="Shuffle">⇄</button>
              <button className="ctrl" onClick={handlePrev} title="Previous">⏮</button>
              <button
                className="ctrl-play"
                onClick={togglePlay}
                disabled={!playerReady}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="ctrl" onClick={handleNext} title="Next">⏭</button>
              <button
                className={`ctrl ${repeat ? 'on' : ''}`}
                onClick={() => setRepeat(r => !r)}
                title="Repeat"
              >↺</button>
            </div>

            {/* Volume */}
            <div className="volume-row">
              <button className="vol-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? '🔇' : volume < 40 ? '🔈' : '🔊'}
              </button>
              <input
                type="range" className="vol"
                min={0} max={100} step={1}
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(e.target.value)}
              />
              <span className="vol-pct">{isMuted ? 0 : volume}%</span>
            </div>

            {/* Extra controls */}
            <div className="extra-row">
              <button className={`ex-btn ${showVideo ? 'on' : ''}`} onClick={() => setShowVideo(v => !v)}>
                {showVideo ? '◼ Hide video' : '▶ Show video'}
              </button>
              <button className="ex-btn" onClick={() => { try { playerRef.current?.seekTo(0, true) } catch {} setCurrentTime(0) }}>
                ↩ Restart
              </button>
              <button className="ex-btn" onClick={() => window.open(`https://youtube.com/playlist?list=${PLAYLIST_ID}`, '_blank')}>
                ↗ Full playlist
              </button>
            </div>

          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="right-panel">
            <div className="panel-header">
              <div className="panel-label">// Now playing</div>
            </div>
            <div className="panel-body">

              {/* Now playing card */}
              <div className="now-block">
                <div className="now-block-lbl">
                  <span style={{ color: isPlaying ? 'var(--accent)' : 'var(--muted)' }}>
                    {isPlaying ? '▶' : '◼'}
                  </span>
                  {isPlaying ? 'Playing' : 'Paused'}
                </div>
                <div className="now-block-title">{nowPlaying.title}</div>
                <div className="now-block-artist">{nowPlaying.author || '—'}</div>
              </div>

              {/* Playlist info */}
              <div>
                <div className="ref-lbl">// Playlist</div>
                <div style={{ fontSize:'11px', color:'var(--muted)', lineHeight:1.7 }}>
                  YouTube playlist loaded natively. All tracks available — use ⏮ ⏭ to navigate.
                </div>
                <button
                  className="ex-btn"
                  style={{ marginTop:'10px', width:'100%', textAlign:'center' }}
                  onClick={() => window.open(`https://youtube.com/playlist?list=${PLAYLIST_ID}`, '_blank')}
                >
                  ↗ Open in YouTube
                </button>
              </div>

              {/* Controls reference */}
              <div className="controls-ref">
                <div className="ref-lbl">// Controls</div>
                {[
                  ['⏮', 'Previous track'],
                  ['⏭', 'Next track'],
                  ['⇄', 'Shuffle on/off'],
                  ['↺', 'Repeat'],
                  ['▶ / ⏸', 'Play / pause'],
                  ['🔊', 'Mute / unmute'],
                ].map(([key, label]) => (
                  <div className="ref-row" key={key}>
                    <span className="ref-key">{key}</span>
                    <span className="ref-desc">{label}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Add custom video */}
            <div className="add-section">
              <button className="add-toggle" onClick={() => setShowAdd(s => !s)}>
                {showAdd ? '− Cancel' : '+ Play a specific YouTube video'}
              </button>
              {showAdd && (
                <div className="add-form">
                  <input
                    className="add-input"
                    type="text"
                    placeholder="YouTube URL or video ID"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                  />
                  <input
                    className="add-input"
                    type="text"
                    placeholder="Track title (optional)"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                  />
                  <button className="add-submit" onClick={addVideo}>
                    Play this video
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
