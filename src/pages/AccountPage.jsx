import { useState, useEffect } from 'react'

export default function AccountPage({ customer, onLogout, fetchOrders, onNav }) {
  const [tab,    setTab]    = useState('profile')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === 'orders') {
      setLoading(true)
      fetchOrders().then(o => { setOrders(o); setLoading(false) })
    }
  }, [tab])

  function fmt(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year:'numeric', month:'short', day:'numeric'
    })
  }

  return (
    <>
      <style>{`
        .account-page { padding-top: 80px; min-height: 100vh; }
        .account-hero {
          padding: 40px 0 28px; border-bottom: 1px solid var(--border);
          background: radial-gradient(ellipse at 100% 0%, rgba(0,255,200,0.04) 0%, transparent 60%);
        }
        .account-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(0,255,200,0.5); margin-bottom:8px; }
        .account-title { font-family:var(--mono); font-size:clamp(24px,4vw,44px); font-weight:bold; color:var(--text); letter-spacing:0.06em; }
        .account-email { font-family:var(--mono); font-size:11px; color:var(--muted); margin-top:4px; }

        .account-layout { display:grid; grid-template-columns:200px 1fr; min-height:60vh; }
        .account-sidebar { border-right:1px solid var(--border); padding:24px 0; }
        .sidebar-btn {
          display:block; width:100%; text-align:left;
          font-family:var(--mono); font-size:11px; letter-spacing:0.1em;
          text-transform:uppercase; padding:12px 20px;
          background:none; border:none; color:var(--muted); cursor:pointer;
          transition:all 0.15s; border-left:2px solid transparent;
        }
        .sidebar-btn:hover { color:var(--accent); }
        .sidebar-btn.active { color:var(--accent); border-left-color:var(--accent); background:rgba(0,255,200,0.04); }
        .sidebar-divider { border:none; border-top:1px solid var(--border); margin:16px 0; }
        .sidebar-logout {
          display:block; width:100%; text-align:left;
          font-family:var(--mono); font-size:11px; letter-spacing:0.1em;
          text-transform:uppercase; padding:12px 20px;
          background:none; border:none; color:var(--muted); cursor:pointer;
          transition:color 0.15s;
        }
        .sidebar-logout:hover { color:#ff003c; }

        .account-content { padding:32px 40px; }

        /* Profile tab */
        .profile-card {
          background:var(--surface); border:1px solid var(--border);
          padding:24px; max-width:480px; margin-bottom:20px;
        }
        .profile-avatar {
          width:64px; height:64px; border-radius:50%;
          background:rgba(0,255,200,0.1); border:2px solid rgba(0,255,200,0.3);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--mono); font-size:24px; font-weight:bold;
          color:var(--accent); margin-bottom:16px;
        }
        .profile-name { font-size:20px; color:var(--text); font-weight:600; margin-bottom:4px; }
        .profile-email { font-family:var(--mono); font-size:12px; color:var(--muted); }
        .profile-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:10px 0; border-bottom:1px solid var(--border);
        }
        .profile-row:last-child { border-bottom:none; }
        .profile-lbl { font-family:var(--mono); font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); }
        .profile-val { font-size:13px; color:var(--text); font-family:var(--mono); }

        /* Orders tab */
        .orders-empty { padding:48px 0; text-align:center; color:var(--muted); }
        .orders-empty-icon { font-size:40px; opacity:0.15; margin-bottom:12px; }
        .orders-empty-text { font-family:var(--mono); font-size:11px; letter-spacing:0.12em; margin-bottom:20px; }
        .order-card {
          border:1px solid var(--border); margin-bottom:10px;
          background:var(--surface); transition:border-color 0.15s;
        }
        .order-card:hover { border-color:rgba(0,255,200,0.3); }
        .order-header {
          display:flex; align-items:center; gap:16px; padding:14px 16px;
          border-bottom:1px solid var(--border);
        }
        .order-num { font-family:var(--mono); font-size:14px; color:var(--accent); font-weight:bold; }
        .order-date { font-family:var(--mono); font-size:10px; color:var(--muted); }
        .order-status {
          margin-left:auto; font-family:var(--mono); font-size:9px;
          letter-spacing:0.1em; text-transform:uppercase;
          padding:3px 8px; border-radius:2px;
        }
        .order-status.paid    { background:rgba(0,255,200,0.1); color:var(--accent); }
        .order-status.pending { background:rgba(255,204,0,0.1); color:#ffcc00; }
        .order-status.refunded{ background:rgba(255,0,60,0.1); color:#ff003c; }
        .order-items { padding:12px 16px; }
        .order-item-row { font-size:12px; color:var(--muted); padding:3px 0; font-family:var(--mono); }
        .order-total { font-family:var(--mono); font-size:13px; color:var(--accent); font-weight:bold; }

        .loading-state { padding:48px 0; text-align:center; font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:0.15em; }

        .shop-btn {
          font-family:var(--mono); font-size:11px; letter-spacing:0.15em;
          text-transform:uppercase; padding:12px 24px;
          background:var(--accent); color:var(--bg); border:none;
          cursor:pointer; font-weight:bold;
          box-shadow:0 0 16px rgba(0,255,200,0.2); transition:all 0.15s;
        }
        .shop-btn:hover { box-shadow:0 0 28px rgba(0,255,200,0.4); }

        @media (max-width:768px) {
          .account-layout { grid-template-columns:1fr; }
          .account-sidebar { border-right:none; border-bottom:1px solid var(--border); padding:12px 0; display:flex; flex-wrap:wrap; gap:0; }
          .sidebar-btn { width:auto; padding:8px 16px; border-left:none; border-bottom:2px solid transparent; }
          .sidebar-btn.active { border-bottom-color:var(--accent); border-left-color:transparent; }
          .account-content { padding:20px; }
        }
      `}</style>

      <div className="account-page">
        <div className="account-hero">
          <div className="container">
            <div className="account-ey">// Customer account</div>
            <div className="account-title">
              Welcome back,<br/>{customer.firstName || customer.name}
            </div>
            <div className="account-email">{customer.email}</div>
          </div>
        </div>

        <div className="account-layout">
          {/* Sidebar */}
          <div className="account-sidebar">
            <button className={`sidebar-btn ${tab==='profile'?'active':''}`} onClick={() => setTab('profile')}>
              Profile
            </button>
            <button className={`sidebar-btn ${tab==='orders'?'active':''}`} onClick={() => setTab('orders')}>
              Orders
            </button>
            <button className={`sidebar-btn ${tab==='wishlist'?'active':''}`} onClick={() => { onNav('wishlist') }}>
              Wishlist
            </button>
            <hr className="sidebar-divider"/>
            <button className="sidebar-logout" onClick={onLogout}>
              Sign out
            </button>
          </div>

          {/* Content */}
          <div className="account-content">

            {/* Profile */}
            {tab === 'profile' && (
              <div>
                <div className="profile-card">
                  <div className="profile-avatar">
                    {(customer.firstName || customer.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="profile-name">
                    {customer.firstName && customer.lastName
                      ? `${customer.firstName} ${customer.lastName}`
                      : customer.name || customer.email}
                  </div>
                  <div className="profile-email">{customer.email}</div>
                </div>

                <div className="profile-card">
                  {[
                    ['First name', customer.firstName || '—'],
                    ['Last name',  customer.lastName  || '—'],
                    ['Email',      customer.email     || '—'],
                    ['Account ID', customer.id ? customer.id.split('/').pop() : '—'],
                  ].map(([lbl, val]) => (
                    <div className="profile-row" key={lbl}>
                      <span className="profile-lbl">{lbl}</span>
                      <span className="profile-val">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders */}
            {tab === 'orders' && (
              <div>
                {loading ? (
                  <div className="loading-state">LOADING ORDERS...</div>
                ) : orders.length === 0 ? (
                  <div className="orders-empty">
                    <div className="orders-empty-icon">📦</div>
                    <div className="orders-empty-text">No orders yet</div>
                    <button className="shop-btn" onClick={() => onNav('shop')}>
                      Shop the collection →
                    </button>
                  </div>
                ) : (
                  orders.map(order => (
                    <div className="order-card" key={order.id}>
                      <div className="order-header">
                        <div>
                          <div className="order-num">#{order.orderNumber}</div>
                          <div className="order-date">{fmt(order.processedAt)}</div>
                        </div>
                        <div className={`order-status ${order.financialStatus?.toLowerCase()}`}>
                          {order.financialStatus}
                        </div>
                        <div className="order-total">
                          {order.currentTotalPrice.currencyCode} ${parseFloat(order.currentTotalPrice.amount).toFixed(2)}
                        </div>
                      </div>
                      <div className="order-items">
                        {order.lineItems.edges.map(e => (
                          <div className="order-item-row" key={e.node.title}>
                            {e.node.title} × {e.node.quantity}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
