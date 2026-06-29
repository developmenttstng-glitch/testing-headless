import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
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
import { useProducts }       from './hooks/useProducts'
import { useCart }           from './hooks/useCart'
import { useWishlist }       from './hooks/useWishlist'
import { useRecentlyViewed } from './hooks/useRecentlyViewed'
import { useCustomer }       from './hooks/useCustomer'

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

export default function App() {
  const navigate  = useNavigate()
  const location  = useLocation()
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

  // Scroll to top on route change (except callback)
  useEffect(() => {
    if (!location.pathname.includes('/account/callback')) {
      window.scrollTo({ top: 0 })
    }
  }, [location.pathname])

  function nav(p) {
    if (p === 'music') setMusicOn(true)
    setCartOpen(false)
    // Map page ids to routes
    const routes = {
      home:     '/',
      shop:     '/shop',
      lookbook: '/lookbook',
      arcade:   '/arcade',
      music:    '/music',
      about:    '/about',
      wishlist: '/wishlist',
      alarm:    '/alarm',
      account:  '/account',
    }
    navigate(routes[p] || '/')
  }

  function handleViewDetail(product) {
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

  // Current page id for Navbar active state
  const pathToPage = {
    '/':         'home',
    '/shop':     'shop',
    '/lookbook': 'lookbook',
    '/arcade':   'arcade',
    '/music':    'music',
    '/about':    'about',
    '/wishlist': 'wishlist',
    '/alarm':    'alarm',
    '/account':  'account',
  }
  const currentPage = pathToPage[location.pathname] || 'home'

  const isCallback = location.pathname.includes('/account/callback')

  return (
    <div style={{ paddingBottom: musicOn && currentPage !== 'music' ? '56px' : 0 }}>
      <Navbar
        page={currentPage}
        onNav={nav}
        totalItems={totalItems}
        wishCount={wishCount}
        onCartOpen={() => setCartOpen(true)}
        customer={customer}
        onLogin={login}
        onAccount={() => nav('account')}
      />

      <main>
        <Routes>
          <Route path="/" element={
            <HomePage products={products} loading={loading} onNav={nav} {...sharedProps}/>
          }/>
          <Route path="/shop" element={
            <ShopPage products={products} loading={loading} {...sharedProps}/>
          }/>
          <Route path="/lookbook" element={<LookbookPage onNav={nav}/>}/>
          <Route path="/arcade"   element={<ArcadePage/>}/>
          <Route path="/music"    element={<MusicPage/>}/>
          <Route path="/about"    element={<AboutPage onNav={nav}/>}/>
          <Route path="/wishlist" element={
            <WishlistPage items={wishlist} onNav={nav} {...sharedProps}/>
          }/>
          <Route path="/alarm"    element={<AlarmPage/>}/>

          {/* Auth */}
          <Route path="/account/callback" element={
            <CallbackPage handleCallback={handleCallback} onNav={nav}/>
          }/>
          <Route path="/account" element={
            (() => {
              const c = customer || (() => { try { return JSON.parse(localStorage.getItem('neon_customer')) } catch { return null } })()
              const t = localStorage.getItem('neon_customer_token')
              return c && t
                ? <AccountPage
                    customer={c}
                    onLogout={() => { logout(); navigate('/') }}
                    fetchOrders={fetchOrders}
                    onNav={nav}
                  />
                : <LoginPage onLogin={login} authError={authError}/>
            })()
          }/>

          {/* Fallback */}
          <Route path="*" element={
            <HomePage products={products} loading={loading} onNav={nav} {...sharedProps}/>
          }/>
        </Routes>
      </main>

      {!isCallback && <Footer onNav={nav}/>}

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

      {musicOn && currentPage !== 'music' && <MiniPlayer onNav={nav}/>}
    </div>
  )
}
