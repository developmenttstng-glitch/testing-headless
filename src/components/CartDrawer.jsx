export default function CartDrawer({ lines, totalPrice, currency, onClose, onCheckout, cartLoading, customer, onLogin }) {
  return (
    <>
      <style>{`
        .cart-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:300; }
        .cart-drawer {
          position:fixed; right:0; top:0; bottom:0; width:380px;
          background:var(--surface2);
          border-left:1px solid var(--border);
          z-index:301; display:flex; flex-direction:column;
          animation:slideInRight 0.3s ease;
        }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        .cart-header {
          padding:1.25rem 1.5rem;
          border-bottom:1px solid var(--border);
          display:flex; justify-content:space-between; align-items:center;
        }
        .cart-title {
          font-family:var(--mono); font-size:12px; letter-spacing:0.2em;
          text-transform:uppercase; color:var(--accent);
        }
        .cart-close {
          background:none; border:none; color:var(--muted); font-size:22px; cursor:pointer;
          transition:color 0.15s;
        }
        .cart-close:hover { color:var(--text); }
        .cart-body { flex:1; overflow-y:auto; padding:1.5rem; }
        .cart-empty {
          text-align:center; padding:3rem 0;
          font-family:var(--mono); font-size:11px;
          letter-spacing:0.15em; color:var(--muted);
        }
        .cart-item {
          display:flex; gap:12px; padding:12px 0;
          border-bottom:1px solid rgba(0,255,200,0.06);
        }
        .cart-item-img {
          width:56px; height:56px; background:var(--surface);
          border:1px solid var(--border); flex-shrink:0; object-fit:cover;
        }
        .cart-item-name { font-size:13px; color:var(--text); margin-bottom:3px; }
        .cart-item-variant { font-size:11px; color:var(--muted); margin-bottom:4px; }
        .cart-item-price { font-family:var(--mono); font-size:12px; color:var(--accent); }
        .cart-footer {
          padding:1.5rem;
          border-top:1px solid var(--border);
        }
        .cart-total {
          display:flex; justify-content:space-between;
          margin-bottom:1rem;
        }
        .cart-total-label { font-family:var(--mono); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); }
        .cart-total-val { font-family:var(--mono); font-size:18px; color:var(--accent); font-weight:bold; }
        .checkout-btn {
          width:100%; padding:14px;
          background:var(--accent); color:var(--bg);
          border:none; font-family:var(--mono);
          font-size:11px; letter-spacing:0.2em; text-transform:uppercase;
          font-weight:bold; transition:all 0.15s;
          box-shadow:0 0 20px rgba(0,255,200,0.3);
        }
        .checkout-btn:hover { box-shadow:0 0 30px rgba(0,255,200,0.6); }
        .checkout-btn:disabled { opacity:0.5; }
      `}</style>

      <div className="cart-overlay" onClick={onClose}/>
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">// Cart</div>
          <button className="cart-close" onClick={onClose}>×</button>
        </div>

        <div className="cart-body">
          {lines.length === 0 ? (
            <div className="cart-empty">
              <div style={{fontSize:'32px',marginBottom:'12px'}}>◻</div>
              YOUR CART IS EMPTY
            </div>
          ) : (
            lines.map(line => (
              <div className="cart-item" key={line.id}>
                <div className="cart-item-img" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:'20px',opacity:0.3}}>◈</span>
                </div>
                <div style={{flex:1}}>
                  <div className="cart-item-name">{line.merchandise.product.title}</div>
                  <div className="cart-item-variant">{line.merchandise.title} × {line.quantity}</div>
                  <div className="cart-item-price">
                    {line.merchandise.price.currencyCode} ${parseFloat(line.merchandise.price.amount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">

          <div className="cart-total">
            <span className="cart-total-label">Total</span>
            <span className="cart-total-val">{currency} ${totalPrice}</span>
          </div>
          <button className="checkout-btn" onClick={onCheckout} disabled={lines.length === 0 || cartLoading}>
            {cartLoading ? 'Processing...' : 'Proceed to checkout →'}
          </button>
          {lines.length > 0 && (
            <button onClick={onLogin} style={{
              width:'100%', padding:'9px', marginTop:'8px',
              background:'transparent', border:'1px solid rgba(0,255,200,0.25)',
              color:'var(--muted)', fontFamily:'var(--mono)', fontSize:'10px',
              letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer',
              transition:'all 0.15s',
            }}
            onMouseOver={e=>e.target.style.color='var(--accent)'}
            onMouseOut={e=>e.target.style.color='var(--muted)'}
            >
              Sign in to pre-fill details
            </button>
          )}
        </div>
      </div>
    </>
  )
}
