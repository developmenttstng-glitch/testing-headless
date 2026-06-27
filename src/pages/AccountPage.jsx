import { useState, useEffect } from 'react'

export default function AccountPage({ customer, onLogout, fetchOrders, onNav }) {
  const [tab,         setTab]         = useState('profile')
  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)

  useEffect(() => {
    if (tab === 'orders' && orders.length === 0) {
      setLoading(true)
      fetchOrders().then(o => { setOrders(o); setLoading(false) })
    }
  }, [tab])

  function fmt(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  function money(obj) {
    if (!obj) return '—'
    return `${obj.currencyCode} ${parseFloat(obj.amount).toFixed(2)}`
  }

  function statusColor(status) {
    if (!status) return 'var(--muted)'
    const s = status.toLowerCase()
    if (s.includes('paid') || s.includes('fulfilled') || s.includes('delivered')) return '#00ffc8'
    if (s.includes('pending') || s.includes('partial')) return '#ffcc00'
    if (s.includes('refund') || s.includes('cancel')) return '#ff003c'
    return 'var(--muted)'
  }

  return (
    <>
      <style>{`
        .account-page { padding-top: 80px; min-height: 100vh; }
        .account-hero {
          padding: 36px 0 24px; border-bottom: 1px solid var(--border);
          background: radial-gradient(ellipse at 100% 0%, rgba(0,255,200,0.04) 0%, transparent 60%);
        }
        .account-ey { font-family:var(--mono); font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(0,255,200,0.5); margin-bottom:6px; }
        .account-title { font-family:var(--mono); font-size:clamp(22px,4vw,40px); font-weight:bold; color:var(--text); letter-spacing:0.06em; }
        .account-email { font-family:var(--mono); font-size:11px; color:var(--muted); margin-top:4px; }

        .account-layout { display:grid; grid-template-columns:200px 1fr; min-height:60vh; }
        .account-sidebar { border-right:1px solid var(--border); padding:20px 0; }
        .sidebar-btn {
          display:block; width:100%; text-align:left;
          font-family:var(--mono); font-size:11px; letter-spacing:0.1em;
          text-transform:uppercase; padding:11px 20px;
          background:none; border:none; color:var(--muted); cursor:pointer;
          transition:all 0.15s; border-left:2px solid transparent;
        }
        .sidebar-btn:hover { color:var(--accent); }
        .sidebar-btn.active { color:var(--accent); border-left-color:var(--accent); background:rgba(0,255,200,0.04); }
        .sidebar-divider { border:none; border-top:1px solid var(--border); margin:14px 0; }
        .sidebar-logout {
          display:block; width:100%; text-align:left;
          font-family:var(--mono); font-size:11px; letter-spacing:0.1em;
          text-transform:uppercase; padding:11px 20px;
          background:none; border:none; color:var(--muted); cursor:pointer; transition:color 0.15s;
        }
        .sidebar-logout:hover { color:#ff003c; }

        .account-content { padding:28px 36px; }
        .loading-state { padding:48px 0; text-align:center; font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:0.15em; }

        /* Profile */
        .profile-avatar {
          width:56px; height:56px; border-radius:50%;
          background:rgba(0,255,200,0.08); border:2px solid rgba(0,255,200,0.25);
          display:flex; align-items:center; justify-content:center;
          font-family:var(--mono); font-size:22px; font-weight:bold;
          color:var(--accent); margin-bottom:14px;
        }
        .profile-name  { font-size:20px; color:var(--text); font-weight:600; margin-bottom:3px; }
        .profile-email { font-family:var(--mono); font-size:11px; color:var(--muted); margin-bottom:20px; }
        .profile-card  { background:var(--surface); border:1px solid var(--border); padding:0; max-width:460px; margin-bottom:16px; }
        .profile-row   { display:flex; justify-content:space-between; align-items:center; padding:11px 16px; border-bottom:1px solid var(--border); }
        .profile-row:last-child { border-bottom:none; }
        .profile-lbl   { font-family:var(--mono); font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); }
        .profile-val   { font-family:var(--mono); font-size:12px; color:var(--text); }

        /* Orders list */
        .orders-empty { padding:52px 0; text-align:center; }
        .orders-empty-icon { font-size:36px; opacity:0.15; margin-bottom:12px; }
        .orders-empty-text { font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:0.12em; margin-bottom:20px; }
        .shop-btn { font-family:var(--mono); font-size:11px; letter-spacing:0.15em; text-transform:uppercase; padding:12px 24px; background:var(--accent); color:var(--bg); border:none; cursor:pointer; font-weight:bold; }

        .order-card { border:1px solid var(--border); margin-bottom:8px; background:var(--surface); transition:border-color 0.15s; }
        .order-card:hover { border-color:rgba(0,255,200,0.3); }
        .order-header { display:flex; align-items:center; gap:14px; padding:14px 16px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .order-num  { font-family:var(--mono); font-size:15px; color:var(--accent); font-weight:bold; }
        .order-date { font-family:var(--mono); font-size:10px; color:var(--muted); }
        .order-badge {
          font-family:var(--mono); font-size:9px; letter-spacing:0.1em; text-transform:uppercase;
          padding:3px 9px; border-radius:2px; border:1px solid;
        }
        .order-total { font-family:var(--mono); font-size:14px; color:var(--text); font-weight:bold; margin-left:auto; }
        .order-items-preview { padding:10px 16px; }
        .order-item-row { font-size:12px; color:var(--muted); padding:2px 0; font-family:var(--mono); }
        .order-actions { padding:10px 16px; border-top:1px solid var(--border); display:flex; gap:8px; }
        .order-detail-btn {
          font-family:var(--mono); font-size:9px; letter-spacing:0.12em; text-transform:uppercase;
          padding:6px 14px; border:1px solid var(--accent); background:transparent;
          color:var(--accent); cursor:pointer; transition:all 0.15s;
        }
        .order-detail-btn:hover { background:rgba(0,255,200,0.08); }

        /* Order detail modal */
        .order-detail-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.85);
          z-index:400; display:flex; align-items:center; justify-content:center; padding:20px;
          animation:odFade 0.2s ease;
        }
        @keyframes odFade { from{opacity:0} to{opacity:1} }
        .order-detail-modal {
          background:var(--surface2); border:1px solid var(--border);
          width:100%; max-width:720px; max-height:90vh; overflow-y:auto;
          animation:odSlide 0.2s ease; position:relative;
        }
        @keyframes odSlide { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .od-close {
          position:absolute; top:14px; right:14px;
          background:rgba(3,5,10,0.8); border:1px solid var(--border);
          color:var(--muted); font-size:20px; width:34px; height:34px;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all 0.15s; z-index:2;
        }
        .od-close:hover { color:var(--text); border-color:var(--accent); }
        .od-header { padding:24px 24px 16px; border-bottom:1px solid var(--border); }
        .od-title { font-family:var(--mono); font-size:18px; font-weight:bold; color:var(--accent); margin-bottom:4px; }
        .od-date  { font-family:var(--mono); font-size:11px; color:var(--muted); }
        .od-badges { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
        .od-body  { padding:20px 24px; display:flex; flex-direction:column; gap:20px; }
        .od-section-title {
          font-family:var(--mono); font-size:8px; letter-spacing:0.2em;
          text-transform:uppercase; color:rgba(0,255,200,0.4);
          margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border);
        }

        /* Line items table */
        .od-items { width:100%; border-collapse:collapse; }
        .od-items th { font-family:var(--mono); font-size:9px; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); padding:6px 10px; text-align:left; border-bottom:1px solid var(--border); background:var(--surface); }
        .od-items td { font-size:12px; color:var(--text); padding:10px 10px; border-bottom:1px solid rgba(0,255,200,0.04); vertical-align:top; }
        .od-item-name { font-weight:500; }
        .od-item-variant { font-size:10px; color:var(--muted); font-family:var(--mono); margin-top:2px; }

        /* Totals */
        .od-totals { background:var(--surface); border:1px solid var(--border); padding:14px 16px; }
        .od-total-row { display:flex; justify-content:space-between; padding:4px 0; font-size:12px; }
        .od-total-lbl { color:var(--muted); font-family:var(--mono); }
        .od-total-val { color:var(--text); font-family:var(--mono); }
        .od-total-row.grand { border-top:1px solid var(--border); margin-top:8px; padding-top:10px; }
        .od-total-row.grand .od-total-lbl { color:var(--accent); font-weight:bold; font-size:13px; }
        .od-total-row.grand .od-total-val { color:var(--accent); font-weight:bold; font-size:15px; }

        /* Shipping */
        .od-address { font-size:12px; color:var(--text); line-height:1.8; font-family:var(--mono); }

        /* Fulfillment / tracking */
        .od-fulfillment { background:var(--surface); border:1px solid var(--border); padding:14px 16px; }
        .od-fulfillment-status { font-family:var(--mono); font-size:12px; font-weight:bold; margin-bottom:8px; }
        .od-tracking { display:flex; align-items:center; gap:10px; margin-top:8px; }
        .od-tracking-lbl { font-family:var(--mono); font-size:10px; color:var(--muted); }
        .od-tracking-num { font-family:var(--mono); font-size:11px; color:var(--accent); }
        .od-track-link {
          font-family:var(--mono); font-size:9px; letter-spacing:0.1em;
          text-transform:uppercase; padding:4px 10px;
          border:1px solid rgba(0,255,200,0.3); background:transparent;
          color:var(--accent); cursor:pointer; text-decoration:none; transition:all 0.15s;
        }
        .od-track-link:hover { background:rgba(0,255,200,0.08); }
        .od-no-tracking { font-family:var(--mono); font-size:11px; color:var(--muted); }

        /* Grid for shipping + fulfillment */
        .od-two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

        @media (max-width:768px) {
          .account-layout { grid-template-columns:1fr; }
          .account-sidebar { border-right:none; border-bottom:1px solid var(--border); padding:10px 0; display:flex; flex-wrap:wrap; }
          .sidebar-btn { width:auto; padding:8px 14px; border-left:none; border-bottom:2px solid transparent; }
          .sidebar-btn.active { border-bottom-color:var(--accent); border-left-color:transparent; }
          .account-content { padding:20px; }
          .od-two-col { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="account-page">
        <div className="account-hero">
          <div className="container">
            <div className="account-ey">// Customer account</div>
            <div className="account-title">Welcome back, {customer.firstName || customer.name}</div>
            <div className="account-email">{customer.email}</div>
          </div>
        </div>

        <div className="account-layout">
          {/* Sidebar */}
          <div className="account-sidebar">
            <button className={`sidebar-btn ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>Profile</button>
            <button className={`sidebar-btn ${tab==='orders'?'active':''}`}  onClick={()=>setTab('orders')}>Orders</button>
            <button className="sidebar-btn" onClick={()=>onNav('wishlist')}>Wishlist</button>
            <hr className="sidebar-divider"/>
            <button className="sidebar-logout" onClick={onLogout}>Sign out</button>
          </div>

          {/* Content */}
          <div className="account-content">

            {/* ── PROFILE ── */}
            {tab === 'profile' && (
              <div>
                <div className="profile-avatar">
                  {(customer.firstName || customer.email || '?')[0].toUpperCase()}
                </div>
                <div className="profile-name">
                  {customer.firstName && customer.lastName
                    ? `${customer.firstName} ${customer.lastName}`
                    : customer.name || customer.email}
                </div>
                <div className="profile-email">{customer.email}</div>
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

            {/* ── ORDERS ── */}
            {tab === 'orders' && (
              <div>
                {loading ? (
                  <div className="loading-state">LOADING ORDERS...</div>
                ) : orders.length === 0 ? (
                  <div className="orders-empty">
                    <div className="orders-empty-icon">📦</div>
                    <div className="orders-empty-text">No orders yet</div>
                    <button className="shop-btn" onClick={()=>onNav('shop')}>Shop the collection →</button>
                  </div>
                ) : (
                  orders.map(order => (
                    <div className="order-card" key={order.id}>
                      <div className="order-header">
                        <div>
                          <div className="order-num">{order.name}</div>
                          <div className="order-date">{fmt(order.processedAt)}</div>
                        </div>
                        <div className="od-badges">
                          <span className="order-badge" style={{
                            color: statusColor(order.financialStatus),
                            borderColor: statusColor(order.financialStatus),
                            background: `${statusColor(order.financialStatus)}15`
                          }}>
                            {order.financialStatus}
                          </span>
                          <span className="order-badge" style={{
                            color: statusColor(order.fulfillmentStatus),
                            borderColor: statusColor(order.fulfillmentStatus),
                            background: `${statusColor(order.fulfillmentStatus)}15`
                          }}>
                            {order.fulfillmentStatus}
                          </span>
                        </div>
                        <div className="order-total">{money(order.totalPrice)}</div>
                      </div>

                      <div className="order-items-preview">
                        {(order.lineItems?.nodes || []).slice(0,2).map((item,i) => (
                          <div className="order-item-row" key={i}>
                            {item.title} × {item.quantity}
                          </div>
                        ))}
                        {(order.lineItems?.nodes||[]).length > 2 && (
                          <div className="order-item-row" style={{color:'rgba(0,255,200,0.4)'}}>
                            +{(order.lineItems.nodes.length - 2)} more item{(order.lineItems.nodes.length - 2) !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div className="order-actions">
                        <button className="order-detail-btn" onClick={()=>setActiveOrder(order)}>
                          View details →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ORDER DETAIL MODAL ── */}
      {activeOrder && (
        <div className="order-detail-overlay" onClick={()=>setActiveOrder(null)}>
          <div className="order-detail-modal" onClick={e=>e.stopPropagation()}>
            <button className="od-close" onClick={()=>setActiveOrder(null)}>×</button>

            {/* Header */}
            <div className="od-header">
              <div className="od-title">Order {activeOrder.name}</div>
              <div className="od-date">Placed on {fmt(activeOrder.processedAt)}</div>
              <div className="od-badges">
                <span className="order-badge" style={{
                  color: statusColor(activeOrder.financialStatus),
                  borderColor: statusColor(activeOrder.financialStatus),
                  background: `${statusColor(activeOrder.financialStatus)}15`,
                }}>
                  {activeOrder.financialStatus}
                </span>
                <span className="order-badge" style={{
                  color: statusColor(activeOrder.fulfillmentStatus),
                  borderColor: statusColor(activeOrder.fulfillmentStatus),
                  background: `${statusColor(activeOrder.fulfillmentStatus)}15`,
                }}>
                  {activeOrder.fulfillmentStatus}
                </span>
              </div>
            </div>

            <div className="od-body">

              {/* Line items */}
              <div>
                <div className="od-section-title">// Items ordered</div>
                <table className="od-items">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{textAlign:'center'}}>Qty</th>

                    </tr>
                  </thead>
                  <tbody>
                    {(activeOrder.lineItems?.nodes || []).map((item, i) => (
                      <tr key={i}>
                        <td>
                          <div className="od-item-name">{item.title}</div>
                          {item.variantTitle && item.variantTitle !== 'Default Title' && (
                            <div className="od-item-variant">{item.variantTitle}</div>
                          )}
                        </td>
                        <td style={{textAlign:'center',fontFamily:'var(--mono)',fontSize:'12px'}}>
                          {item.quantity}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div>
                <div className="od-section-title">// Order total</div>
                <div className="od-totals">

                  {activeOrder.totalShipping && (
                    <div className="od-total-row">
                      <span className="od-total-lbl">Shipping</span>
                      <span className="od-total-val">{money(activeOrder.totalShipping)}</span>
                    </div>
                  )}
                  {activeOrder.totalTax && parseFloat(activeOrder.totalTax.amount) > 0 && (
                    <div className="od-total-row">
                      <span className="od-total-lbl">Tax</span>
                      <span className="od-total-val">{money(activeOrder.totalTax)}</span>
                    </div>
                  )}
                  <div className="od-total-row grand">
                    <span className="od-total-lbl">Total</span>
                    <span className="od-total-val">{money(activeOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping + Fulfillment */}
              <div className="od-two-col">

                {/* Shipping address */}
                {activeOrder.shippingAddress && (
                  <div>
                    <div className="od-section-title">// Shipping address</div>
                    <div className="od-address">
                      {activeOrder.shippingAddress.firstName} {activeOrder.shippingAddress.lastName}<br/>
                      {activeOrder.shippingAddress.address1}<br/>
                      {activeOrder.shippingAddress.address2 && <>{activeOrder.shippingAddress.address2}<br/></>}
                      {activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.province} {activeOrder.shippingAddress.zip}<br/>
                      {activeOrder.shippingAddress.country}
                      {activeOrder.shippingAddress.phone && <><br/>{activeOrder.shippingAddress.phone}</>}
                    </div>
                  </div>
                )}

                {/* Fulfillment / tracking */}
                <div>
                  <div className="od-section-title">// Fulfillment</div>
                  {(activeOrder.fulfillments?.nodes || []).length === 0 ? (
                    <div className="od-no-tracking">Not yet fulfilled</div>
                  ) : (
                    (activeOrder.fulfillments.nodes).map((f, i) => (
                      <div className="od-fulfillment" key={i}>
                        <div className="od-fulfillment-status" style={{color: statusColor(f.displayStatus)}}>
                          {f.displayStatus}
                        </div>
                        {f.estimatedDeliveryAt && (
                          <div style={{fontSize:'11px',color:'var(--muted)',fontFamily:'var(--mono)',marginBottom:'6px'}}>
                            Est. delivery: {fmt(f.estimatedDeliveryAt)}
                          </div>
                        )}
                        {(f.trackingInfo || []).map((t, j) => (
                          <div className="od-tracking" key={j}>
                            <span className="od-tracking-lbl">{t.company}</span>
                            <span className="od-tracking-num">{t.number}</span>
                            {t.url && (
                              <a href={t.url} target="_blank" rel="noreferrer"
                                className="od-track-link">
                                Track →
                              </a>
                            )}
                          </div>
                        ))}
                        {(!f.trackingInfo || f.trackingInfo.length === 0) && (
                          <div className="od-no-tracking">No tracking info yet</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
