// v14 — auth callback fix
import { useState, useEffect } from 'react'
import Navbar            from './components/Navbar'
import Footer            from './components/Footer'
import CartDrawer        from './components/CartDrawer'
import MiniPlayer        from './components/MiniPlayer'
import ProductDetailPage from './components/ProductDetailPage'
import HomePage          from './pages/HomePage'
import ShopPage          from './pages/ShopPage'
import LookbookPage      from './pages/LookbookPage'
import ArcadePage        from './pages/ArcadePage'
import AboutPage         from './pages/AboutPage'
import MusicPage         from './pages/MusicPage'
import WishlistPage      from './pages/WishlistPage'
import AlarmPage         from './pages/AlarmPage'
import AccountPage       from './pages/AccountPage'
import CallbackPage      from './pages/CallbackPage'
import { useProducts }   from './hooks/useProducts'
import { useCart }       from './hooks/useCart'
import { useWishlist }   from './hooks/useWishlist'
import { useRecentlyViewed } from './hooks/useRecentlyViewed'
import { useCustomer }   from './hooks/useCustomer'

export default function App() {
  const [page,       setPage]       = useState(() => {
    const path   = window.location.pathname
    const search = window.location.search
    // Detect OAuth callback — must have code AND state params
    if (path === '/account/callback' && search.includes('code=') && search.includes('state=')) return 'callback'
    // If token exists in localStorage, go to account page
    if (localStorage.getItem('neon_customer_token') && localStorage.getItem('neon_customer')) {
      return 'account'
    }
    return 'home'
  })
  const [cartOpen,   setCartOpen]   = useState(false)
  const [detailProd, setDetailProd] = useState(null)
  const [musicOn,    setMusicOn]    = useState(false)

  const { products, loading }       = useProducts(12)
  const { lines, totalItems, totalPrice, currency, loading: cartLoading, addToCart, goToCheckout: _goToCheckout } = useCart()

  // Wrap checkout to append customer token so Shopify pre-fills their details
  function goToCheckout() {
    const token = localStorage.getItem('neon_customer_token')
    if (token && window._cartCheckoutUrl) {
      // Append customer token to checkout URL for pre-fill
      const url = new URL(window._cartCheckoutUrl)
      url.searchParams.set('logged_in', 'true')
      window.location.href = url.toString()
    } else {
      _goToCheckout()
    }
  }
  const { items: wishlist, toggle: toggleWishlist, isWishlisted, count: wishCount } = useWishlist()
  const { items: recentlyViewed, add: addRecentlyViewed } = useRecentlyViewed()
  const { customer, token, isLoggedIn, loading: authLoading, error: authError,
          login, logout, handleCallback, fetchOrders } = useCustomer()

  useEffect(() => {
    if (page !== 'callback') window.scrollTo({ top: 0 })
  }, [page])

  function navigate(p) { setPage(p); setCartOpen(false) }

  function handleViewDetail(product) {
    addRecentlyViewed(product)
    setDetailProd(product)
  }

  function handleNav(p) {
    if (p === 'music') setMusicOn(true)
    navigate(p)
  }

  const sharedProps = {
    onAddToCart:      addToCart,
    cartLoading,
    isWishlisted,
    onToggleWishlist: toggleWishlist,
    onViewDetail:     handleViewDetail,
    recentlyViewed,
  }

  function renderPage() {
    switch (page) {
      case 'home':     return <HomePage     products={products} loading={loading} onNav={handleNav} {...sharedProps}/>
      case 'shop':     return <ShopPage     products={products} loading={loading} {...sharedProps}/>
      case 'lookbook': return <LookbookPage onNav={handleNav}/>
      case 'arcade':   return <ArcadePage/>
      case 'music':    return <MusicPage/>
      case 'about':    return <AboutPage    onNav={handleNav}/>
      case 'wishlist': return <WishlistPage items={wishlist} onNav={handleNav} {...sharedProps}/>
      case 'alarm':    return <AlarmPage/>
      case 'account':  {
        // Read customer directly from localStorage as fallback
        // in case React state hasn't updated yet after callback
        const storedCustomer = customer || (() => {
          try { return JSON.parse(localStorage.getItem('neon_customer')) } catch { return null }
        })()
        const storedToken = token || localStorage.getItem('neon_customer_token')
        return storedCustomer && storedToken
          ? <AccountPage customer={storedCustomer} onLogout={logout} fetchOrders={fetchOrders} onNav={handleNav}/>
          : <LoginPromptPage onLogin={login} authError={authError}/>
      }
      case 'callback': return <CallbackPage handleCallback={handleCallback} onNav={handleNav} isLoggedIn={isLoggedIn}/>
      default:         return <HomePage     products={products} loading={loading} onNav={handleNav} {...sharedProps}/>
    }
  }

  return (
    <div style={{ paddingBottom: musicOn && page !== 'music' ? '56px' : 0 }}>
      <Navbar
        page={page}
        onNav={handleNav}
        totalItems={totalItems}
        wishCount={wishCount}
        onCartOpen={() => setCartOpen(true)}
        customer={customer}
        onLogin={login}
        onAccount={() => handleNav('account')}
      />
      <main>{renderPage()}</main>
      <Footer onNav={handleNav}/>

      {cartOpen && (
        <CartDrawer
          lines={lines}
          totalPrice={totalPrice}
          currency={currency}
          onClose={() => setCartOpen(false)}
          onCheckout={goToCheckout}
          cartLoading={cartLoading}
          customer={customer}
          onLogin={() => { setCartOpen(false); login() }}
        />
      )}

      {detailProd && (
        <ProductDetailPage
          product={detailProd}
          onAddToCart={addToCart}
          cartLoading={cartLoading}
          onClose={() => setDetailProd(null)}
          isWishlisted={isWishlisted}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {musicOn && page !== 'music' && <MiniPlayer onNav={handleNav}/>}
    </div>
  )
}

// Simple login prompt shown when visiting /account while logged out
function LoginPromptPage({ onLogin, authError }) {
  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh; padding-top: 80px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-box {
          background: var(--surface); border: 1px solid var(--border);
          padding: 48px 40px; text-align: center; max-width: 400px; width: 100%;
        }
        .login-icon { font-size: 40px; margin-bottom: 16px; opacity: 0.4; }
        .login-title { font-family:var(--mono); font-size: 18px; font-weight: bold; color: var(--text); margin-bottom: 8px; letter-spacing: 0.08em; }
        .login-sub { font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 28px; }
        .login-btn {
          width: 100%; padding: 14px; background: var(--accent); color: var(--bg);
          border: none; font-family: var(--mono); font-size: 11px;
          letter-spacing: 0.18em; text-transform: uppercase; font-weight: bold;
          cursor: pointer; transition: all 0.15s;
          box-shadow: 0 0 20px rgba(0,255,200,0.25);
        }
        .login-btn:hover { box-shadow: 0 0 32px rgba(0,255,200,0.5); }
        .login-error { margin-top: 14px; font-family: var(--mono); font-size: 11px; color: #ff003c; }
        .login-note { margin-top: 14px; font-size: 11px; color: var(--muted); }
      `}</style>
      <div className="login-page">
        <div className="login-box">
          <div className="login-icon">◈</div>
          <div className="login-title">Sign in to your account</div>
          <p className="login-sub">
            Access your order history, saved addresses, and wishlist.
            You'll be taken to Shopify's secure login page.
          </p>
          <button className="login-btn" onClick={onLogin}>
            Sign in with Shopify →
          </button>
          {authError && <div className="login-error">{authError}</div>}
          <div className="login-note">
            New customer? You can create an account on the login page.
          </div>
        </div>
      </div>
    </>
  )
}
