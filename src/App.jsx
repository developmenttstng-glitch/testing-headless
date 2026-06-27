// v-docs — rebuilt following Shopify Customer Account API docs exactly
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

function getInitialPage() {
  const path   = window.location.pathname
  const search = window.location.search

  // If already logged in and landing on callback, skip to account
  const hasToken    = !!localStorage.getItem('neon_customer_token')
  const hasCustomer = !!localStorage.getItem('neon_customer')

  // Callback from Shopify — only treat as callback if NOT already logged in
  if (path.includes('/account/callback') && search.includes('code=') && search.includes('state=')) {
    if (hasToken && hasCustomer) {
      // Already logged in — back button hit, go to account instead
      window.history.replaceState({}, '', '/')
      return 'account'
    }
    return 'callback'
  }

  // Returned from callback with success flag
  if (search.includes('account=1')) {
    window.history.replaceState({}, '', '/')
    return 'account'
  }

  return 'home'
}

export default function App() {
  const [page,       setPage]       = useState(getInitialPage)
  const [cartOpen,   setCartOpen]   = useState(false)
  const [detailProd, setDetailProd] = useState(null)
  const [musicOn,    setMusicOn]    = useState(false)

  const { products, loading }       = useProducts(12)
  const { lines, totalItems, totalPrice, currency,
          loading: cartLoading, addToCart, updateQuantity, removeLine, goToCheckout } = useCart()
  const { items: wishlist, toggle: toggleWishlist,
          isWishlisted, count: wishCount } = useWishlist()
  const { items: recentlyViewed, add: addRecentlyViewed } = useRecentlyViewed()
  const { customer, isLoggedIn, error: authError,
          login, logout, handleCallback, fetchOrders } = useCustomer()

  useEffect(() => {
    if (page !== 'callback') window.scrollTo({ top: 0 })
  }, [page])

  function navigate(p) { setPage(p); setCartOpen(false) }
  function handleNav(p) { if (p === 'music') setMusicOn(true); navigate(p) }

  function handleViewDetail(product) {
    // Don't open if modal is already showing a product (prevents re-open on close click)
    setDetailProd(current => {
      if (current !== null) return current
      addRecentlyViewed(product)
      return product
    })
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
      case 'callback': return <CallbackPage handleCallback={handleCallback} onNav={handleNav}/>
      case 'account': {
        const c = customer || (() => { try { return JSON.parse(localStorage.getItem('neon_customer')) } catch { return null } })()
        const t = localStorage.getItem('neon_customer_token')
        return c && t
          ? <AccountPage customer={c} onLogout={() => { logout(); navigate('home') }} fetchOrders={fetchOrders} onNav={handleNav}/>
          : <LoginPage onLogin={login} authError={authError}/>
      }
      default: return <HomePage products={products} loading={loading} onNav={handleNav} {...sharedProps}/>
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
          lines={lines} totalPrice={totalPrice} currency={currency}
          onClose={() => setCartOpen(false)}
          onCheckout={goToCheckout}
          cartLoading={cartLoading}
          customer={customer}
          onUpdateQuantity={updateQuantity}
          onRemoveLine={removeLine}
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

function LoginPage({ onLogin, authError }) {
  return (
    <>
      <style>{`
        .login-page { min-height:100vh; padding-top:80px; display:flex; align-items:center; justify-content:center; }
        .login-box { background:var(--surface); border:1px solid var(--border); padding:48px 40px; text-align:center; max-width:400px; width:100%; }
        .login-icon { font-size:40px; margin-bottom:16px; opacity:0.3; }
        .login-title { font-family:var(--mono); font-size:18px; font-weight:bold; color:var(--text); margin-bottom:8px; letter-spacing:0.08em; }
        .login-sub { font-size:13px; color:var(--muted); line-height:1.6; margin-bottom:28px; }
        .login-btn { width:100%; padding:14px; background:var(--accent); color:var(--bg); border:none; font-family:var(--mono); font-size:11px; letter-spacing:0.18em; text-transform:uppercase; font-weight:bold; cursor:pointer; box-shadow:0 0 20px rgba(0,255,200,0.25); transition:all 0.15s; }
        .login-btn:hover { box-shadow:0 0 32px rgba(0,255,200,0.5); }
        .login-error { margin-top:14px; font-family:var(--mono); font-size:11px; color:#ff003c; }
        .login-note { margin-top:14px; font-size:11px; color:var(--muted); }
      `}</style>
      <div className="login-page">
        <div className="login-box">
          <div className="login-icon">◈</div>
          <div className="login-title">Sign in to your account</div>
          <p className="login-sub">Access your orders, addresses, and wishlist. You'll be taken to Shopify's secure login page.</p>
          <button className="login-btn" onClick={onLogin}>Sign in with Shopify →</button>
          {authError && <div className="login-error">{authError}</div>}
          <div className="login-note">New customer? You can create an account on the login page.</div>
        </div>
      </div>
    </>
  )
}
