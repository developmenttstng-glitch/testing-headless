import { useEffect, useState, useRef } from 'react'

export default function CallbackPage({ handleCallback, onNav }) {
  const [status, setStatus] = useState('processing')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    handleCallback().then(success => {
      if (success) {
        setStatus('success')
        // Hard redirect with ?account=1 — cleanest way to reload with token in localStorage
        setTimeout(() => { window.location.replace('/?account=1') }, 800)
      } else {
        setStatus('error')
        setTimeout(() => { window.location.replace('/') }, 2500)
      }
    }).catch(() => {
      setStatus('error')
      setTimeout(() => { window.location.replace('/') }, 2500)
    })
  }, [])

  return (
    <>
      <style>{`
        .cb-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#03050a; flex-direction:column; gap:16px; text-align:center; }
        .cb-spin { width:40px; height:40px; border:2px solid rgba(0,255,200,0.2); border-top-color:#00ffc8; border-radius:50%; animation:spin 0.8s linear infinite; }
        .cb-icon  { font-size:56px; }
        .cb-title { font-family:monospace; font-size:16px; color:#00ffc8; letter-spacing:0.1em; }
        .cb-sub   { font-family:monospace; font-size:11px; color:#4a6a8a; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
      <div className="cb-page">
        {status === 'processing' && (<><div className="cb-spin"/><div className="cb-title">Signing you in...</div><div className="cb-sub">Please wait</div></>)}
        {status === 'success'    && (<><div className="cb-icon">✓</div><div className="cb-title">Signed in!</div><div className="cb-sub">Loading your account...</div></>)}
        {status === 'error'      && (<><div className="cb-icon">✗</div><div className="cb-title" style={{color:'#ff003c'}}>Sign in failed</div><div className="cb-sub">Redirecting...</div></>)}
      </div>
    </>
  )
}
