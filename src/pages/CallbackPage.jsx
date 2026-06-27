import { useEffect, useState, useRef } from 'react'

export default function CallbackPage({ handleCallback, onNav }) {
  const [status, setStatus] = useState('processing')
  const ran = useRef(false)

  useEffect(() => {
    // Strict double-run guard
    if (ran.current) return
    ran.current = true

    // Clear the URL immediately so refreshing doesn't re-trigger
    const code  = new URLSearchParams(window.location.search).get('code')
    const state = new URLSearchParams(window.location.search).get('state')

    if (!code || !state) {
      setStatus('error')
      setTimeout(() => onNav('home'), 2000)
      return
    }

    // Replace URL to prevent re-runs on refresh
    window.history.replaceState({}, document.title, '/account/callback')

    handleCallback().then(success => {
      if (success) {
        setStatus('success')
        setTimeout(() => onNav('account'), 600)
      } else {
        setStatus('error')
        setTimeout(() => onNav('home'), 2500)
      }
    }).catch(() => {
      setStatus('error')
      setTimeout(() => onNav('home'), 2500)
    })
  }, [])

  return (
    <>
      <style>{`
        .callback-page {
          min-height:100vh; display:flex; align-items:center; justify-content:center;
          background:var(--bg); flex-direction:column; gap:16px; text-align:center;
        }
        .cb-icon  { font-size:48px; }
        .cb-title { font-family:var(--mono); font-size:16px; color:var(--accent); letter-spacing:0.1em; }
        .cb-sub   { font-family:var(--mono); font-size:11px; color:var(--muted); }
        .cb-spin  {
          width:32px; height:32px; border:2px solid rgba(0,255,200,0.2);
          border-top-color:var(--accent); border-radius:50%;
          animation:spin 0.8s linear infinite;
        }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
      <div className="callback-page">
        {status === 'processing' && (
          <>
            <div className="cb-spin"/>
            <div className="cb-title">Signing you in...</div>
            <div className="cb-sub">Please wait</div>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="cb-icon" style={{color:'var(--accent)'}}>✓</div>
            <div className="cb-title">Signed in successfully</div>
            <div className="cb-sub">Loading your account...</div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="cb-icon" style={{color:'#ff003c'}}>✗</div>
            <div className="cb-title" style={{color:'#ff003c'}}>Sign in failed</div>
            <div className="cb-sub">Redirecting home...</div>
          </>
        )}
      </div>
    </>
  )
}
