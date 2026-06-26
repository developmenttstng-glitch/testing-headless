export default function MiniPlayer({ onNav }) {
  return (
    <>
      <style>{`
        .mini-player {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 150;
          height: 56px;
          background: rgba(3,5,10,0.96);
          border-top: 1px solid rgba(0,255,200,0.15);
          display: flex; align-items: center; gap: 16px;
          padding: 0 20px;
          backdrop-filter: blur(8px);
        }
        .mp-icon {
          width: 32px; height: 32px; flex-shrink: 0;
          background: rgba(0,255,200,0.08); border: 1px solid rgba(0,255,200,0.2);
          border-radius: 2px; display: flex; align-items: center;
          justify-content: center; font-size: 14px; color: var(--accent);
        }
        .mp-label {
          font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(0,255,200,0.5); flex: 1;
        }
        .mp-open {
          font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
          text-transform: uppercase; background: none;
          border: 1px solid rgba(0,255,200,0.25); color: var(--accent);
          padding: 5px 12px; cursor: pointer; transition: all 0.15s;
        }
        .mp-open:hover { background: rgba(0,255,200,0.08); border-color: var(--accent); }
        .mp-viz {
          display: flex; align-items: flex-end; gap: 2px; height: 24px; width: 32px;
        }
        .mp-bar {
          flex: 1; background: var(--accent); border-radius: 1px; min-height: 2px;
          animation: mpb 0.8s ease infinite alternate;
          opacity: 0.7;
        }
        .mp-bar:nth-child(2) { animation-duration: 0.6s; animation-delay: 0.1s; }
        .mp-bar:nth-child(3) { animation-duration: 1s; animation-delay: 0.2s; }
        .mp-bar:nth-child(4) { animation-duration: 0.7s; animation-delay: 0.05s; }
        @keyframes mpb { from{height:3px} to{height:22px} }
      `}</style>

      <div className="mini-player">
        <div className="mp-icon">♫</div>
        <div className="mp-viz">
          <div className="mp-bar"/>
          <div className="mp-bar"/>
          <div className="mp-bar"/>
          <div className="mp-bar"/>
        </div>
        <div className="mp-label">Neon Radio is playing</div>
        <button className="mp-open" onClick={() => onNav('music')}>
          Open player →
        </button>
      </div>
    </>
  )
}
