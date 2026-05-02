import { useState } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import {
  BLOG_POSTS,
  DEMO_CREDENTIALS,
  PANEL_LINKS,
  PAYMENT_METHODS,
  PUBLIC_LINKS,
  SERVICE_ITEMS,
} from './demoData'
import { useDemo } from './demoContext'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getChannelLabel,
  getDisplayPrice,
  getInventorySnapshot,
  getNextOrderStatus,
  getRoleLabel,
  isPaidLikeStatus,
  isPendingLikeStatus,
  normalizeText,
  salesByProduct,
  sortByDateDesc,
  todayKey,
} from './demoHelpers'

const orderToneMap = {
  'Pendiente de pago': 'warning',
  'Pendiente de verificación': 'warning',
  'Pago recibido': 'success',
  'En preparación': 'info',
  'Listo para recoger': 'info',
  Enviado: 'info',
  Entregado: 'success',
  Completado: 'success',
  Cancelado: 'muted',
  Rechazado: 'danger',
  Expirado: 'muted',
}

function getRouteForRole(role) {
  return role === 'customer' ? '/mi-cuenta' : '/panel'
}

function buildQuickImage(title, categoryName) {
  const svg = `
    <svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#CDAE7F" />
          <stop offset="100%" stop-color="#1D4C3C" />
        </linearGradient>
      </defs>
      <rect width="800" height="520" rx="42" fill="url(#g)" />
      <circle cx="660" cy="120" r="96" fill="rgba(255,255,255,0.18)" />
      <text x="72" y="120" fill="#F7F0E1" font-family="Georgia, serif" font-size="28">Terranegra</text>
      <text x="72" y="294" fill="#F7F0E1" font-family="Georgia, serif" font-size="66" font-weight="700">${title}</text>
      <text x="72" y="350" fill="rgba(247,240,225,0.84)" font-family="Arial, sans-serif" font-size="28">${categoryName}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function statusToTone(status) {
  return orderToneMap[status] ?? 'muted'
}

function countPendingOrders(orders) {
  return orders.filter((order) => isPendingLikeStatus(order.status)).length
}

function countPaymentsToVerify(orders) {
  return orders.filter((order) => order.status === 'Pendiente de verificación').length
}

function countLowStockProducts(products, lots, alertDays) {
  return products.filter((product) => {
    const snapshot = getInventorySnapshot(product, lots, alertDays)
    return ['Bajo', 'Crítico', 'Agotado'].includes(snapshot.status)
  }).length
}

function App() {
  return (
    <>
      <ToastViewport />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/tienda" element={<ShopPage />} />
          <Route path="/ofertas" element={<OffersPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/sobre-nosotros" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<CustomerGuard />}>
            <Route path="/mi-cuenta" element={<AccountPage />} />
            <Route path="/mis-pedidos" element={<AccountPage focusOrders />} />
          </Route>
        </Route>

        <Route element={<StaffGuard />}>
          <Route path="/panel" element={<PanelLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="pedidos" element={<PanelOrdersPage />} />
            <Route path="pagos-por-verificar" element={<PaymentsPage />} />
            <Route path="venta-presencial" element={<PosPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="kardex" element={<KardexPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="ofertas" element={<OffersManagerPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function CustomerGuard() {
  const { session } = useDemo()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (session.role !== 'customer') {
    return <Navigate to="/panel" replace />
  }

  return <Outlet />
}

function StaffGuard() {
  const { session } = useDemo()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (session.role === 'customer') {
    return <Navigate to="/mi-cuenta" replace />
  }

  return <Outlet />
}

function PublicLayout() {
  const { currentUser, session, cartItems, logout, state } = useDemo()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const cartCount = cartItems.reduce((accumulator, item) => accumulator + item.quantity, 0)
  const accountPath = session ? getRouteForRole(session.role) : '/login'
  const accountLabel = session
    ? session.role === 'customer'
      ? 'Mi cuenta'
      : 'Panel'
    : 'Login demo'

  function handleLogout() {
    setIsMobileMenuOpen(false)
    logout()
  }

  return (
    <div className="app-shell">
      <div className="top-banner">
        <div className="container top-banner__content">
          <span>Demo interactiva Terranegra</span>
          <span>Datos simulados con localStorage</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="brand-lockup brand-lockup--header">
            <div className="brand-mark">TN</div>
            <div className="brand-copy">
              <strong>{state.businessName}</strong>
              <span>Demo de tienda + panel vendedor</span>
            </div>
          </Link>

          <nav className="site-nav">
            {PUBLIC_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className="nav-link" end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-actions">
            <Link to="/carrito" className="button ghost">
              Carrito
              <span className="counter-badge">{cartCount}</span>
            </Link>

            {session ? (
              <>
                <Link to={getRouteForRole(session.role)} className="button secondary">
                  {session.role === 'customer' ? 'Mi cuenta' : 'Panel'}
                </Link>
                <button type="button" className="button ghost" onClick={handleLogout}>
                  Cerrar sesion
                </button>
              </>
            ) : (
              <Link to="/login" className="button secondary">
                Login demo
              </Link>
            )}
          </div>

          <div className="site-mobile-actions">
            <Link to="/carrito" className="button ghost small site-cart-button">
              <span>Carrito</span>
              <span className="counter-badge">{cartCount}</span>
            </Link>
            <button
              type="button"
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="site-mobile-menu">
            <div className="container">
              <div className="site-mobile-menu__panel">
                <nav className="site-mobile-menu__nav">
                  {PUBLIC_LINKS.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      className="site-mobile-link"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}

                  <NavLink
                    to="/carrito"
                    className="site-mobile-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>Carrito</span>
                    <span className="counter-badge">{cartCount}</span>
                  </NavLink>

                  <NavLink
                    to={accountPath}
                    className="site-mobile-link site-mobile-link--accent"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {accountLabel}
                  </NavLink>
                </nav>

                {session ? (
                  <div className="site-mobile-menu__footer">
                    <div className="site-mobile-menu__session">
                      <strong>{currentUser?.name}</strong>
                      <span>{getRoleLabel(currentUser?.role ?? 'customer')}</span>
                    </div>
                    <button type="button" className="button ghost small" onClick={handleLogout}>
                      Cerrar sesion
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {currentUser ? (
        <div className="container">
          <div className="welcome-strip">
            <span>
              Sesion activa: <strong>{currentUser.name}</strong>
            </span>
            <span>{getRoleLabel(currentUser.role)}</span>
          </div>
        </div>
      ) : null}

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="brand-lockup footer-brand">
              <div className="brand-mark">TN</div>
              <div>
                <strong>{state.config.businessName}</strong>
                <span>Demo comercial sin backend real</span>
              </div>
            </div>
            <p>
              Esta version es una maqueta navegable para validar flujos de tienda web, pedidos,
              inventario, kardex y panel vendedor.
            </p>
          </div>

          <div>
            <h3>Canales demo</h3>
            <p>WhatsApp: +{state.config.whatsapp}</p>
            <p>Yape: {state.config.yapeNumber}</p>
            <p>Direccion: {state.config.address}</p>
          </div>

          <div>
            <h3>Usuarios</h3>
            {DEMO_CREDENTIALS.map((credential) => (
              <p key={credential.email}>
                {credential.role}: {credential.email}
              </p>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

function HomePage() {
  const { state } = useDemo()
  const featuredProducts = state.products.filter((product) => product.featured && product.active).slice(0, 6)

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Terranegra Demo</span>
            <h1>Terranegra</h1>
            <p className="hero-tagline">Tienda demo + inventario + kardex</p>
            <p className="hero-description">
              Explora la tienda, inicia sesion como cliente o vendedor y prueba pedidos,
              inventario, lotes y kardex con datos simulados.
            </p>
            <div className="hero-actions">
              <Link to="/tienda" className="button">
                Ver tienda
              </Link>
              <Link to="/login" className="button secondary">
                Login demo
              </Link>
            </div>

            <div className="hero-metrics">
              <MetricMini label="Productos demo" value={state.products.length} />
              <MetricMini label="Módulos" value="11+" />
              <MetricMini label="Pedidos mock" value={state.orders.length} />
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card__surface">
              <span className="pill">Flujo destacado</span>
              <h2>Compra web + validación manual + descuento de stock al confirmar pago</h2>
              <ol className="timeline-list">
                <li>Cliente agrega productos y genera orden por WhatsApp.</li>
                <li>El pago queda en verificación sin afectar inventario.</li>
                <li>El vendedor confirma, se descuenta stock y se registra kardex.</li>
                <li>El pedido avanza hasta entregado o completado.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <SectionHeading
            title="Lo que la dueña puede validar en esta demo"
            subtitle="Cada click simula un flujo real sin depender de Laravel, PHP o MySQL."
          />
          <div className="feature-grid">
            {SERVICE_ITEMS.map((item) => (
              <article key={item.title} className="surface-card">
                <span className="pill pill--soft">Operación</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProductShowcase
        title="Productos destacados"
        subtitle="Catálogo demo con ofertas, stock visible y recomendaciones automáticas."
        products={featuredProducts}
      />
    </>
  )
}

function ShopPage() {
  const { state } = useDemo()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const visibleProducts = state.products.filter((product) => {
    if (!product.active) {
      return false
    }

    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter
    const searchValue = normalizeText(search)
    const matchesSearch =
      !searchValue ||
      normalizeText(product.name).includes(searchValue) ||
      normalizeText(product.description).includes(searchValue)

    return matchesCategory && matchesSearch
  })

  return (
    <section className="section-block">
      <div className="container">
        <SectionHeading
          title="Tienda demo"
          subtitle="Catálogo navegable con stock, precios regulares y precios de oferta."
        />

        <div className="toolbar surface-inline">
          <input
            className="input"
            placeholder="Buscar productos"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="filter-chip-row">
            <button
              type="button"
              className={`filter-chip ${categoryFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              Todos
            </button>
            {state.categories.filter((category) => category.active).map((category) => (
              <button
                key={category.id}
                type="button"
                className={`filter-chip ${categoryFilter === category.id ? 'is-active' : ''}`}
                onClick={() => setCategoryFilter(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <ProductShowcase products={visibleProducts} compact />
      </div>
    </section>
  )
}

function OffersPage() {
  const { state } = useDemo()
  const offerProducts = state.products.filter((product) => product.offer?.enabled && product.active)

  return (
    <section className="section-block">
      <div className="container">
        <SectionHeading
          title="Ofertas activas"
          subtitle="Las ofertas se gestionan desde el panel vendedor y cambian el precio visible en la tienda."
        />

        {offerProducts.length ? (
          <ProductShowcase products={offerProducts} compact />
        ) : (
          <EmptyState
            title="No hay ofertas activas"
            description="Activa una desde el panel vendedor para verla aquí."
          />
        )}
      </div>
    </section>
  )
}

function ServicesPage() {
  return (
    <section className="section-block">
      <div className="container">
        <SectionHeading
          title="Servicios incluidos en la demo"
          subtitle="Terranegra puede mostrarse como una experiencia de venta y operación, no solo como catálogo."
        />

        <div className="feature-grid">
          <article className="surface-card">
            <h3>Tienda pública responsive</h3>
            <p>Inicio, tienda, ofertas, servicios, blog, carrito, checkout, mi cuenta y pedidos.</p>
          </article>
          <article className="surface-card">
            <h3>Panel vendedor con alertas</h3>
            <p>Dashboard, pedidos, pagos por verificar, venta presencial, inventario y reportes.</p>
          </article>
          <article className="surface-card">
            <h3>Flujos demo accionables</h3>
            <p>Agregar productos, registrar entradas, confirmar pagos, mover estados y restablecer datos.</p>
          </article>
        </div>
      </div>
    </section>
  )
}

function AboutPage() {
  return (
    <section className="section-block">
      <div className="container two-column">
        <div className="surface-card">
          <span className="pill">Marca</span>
          <h2>Terranegra como experiencia digital</h2>
          <p>
            La demo busca mostrar una marca artesanal con presencia premium, operación ordenada y
            una transición natural entre venta online, despacho y venta presencial.
          </p>
        </div>

        <div className="surface-card">
          <span className="pill pill--soft">Qué se simula</span>
          <ul className="plain-list">
            <li>Sesiones de cliente, vendedor y admin.</li>
            <li>Stock por producto y lotes con vencimiento.</li>
            <li>Pedidos con estados y confirmación manual de pago.</li>
            <li>Kardex actualizado por compras y ventas.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function BlogPage() {
  return (
    <section className="section-block">
      <div className="container">
        <SectionHeading
          title="Blog demo"
          subtitle="Contenido mock para mostrar que la tienda también podría incorporar storytelling de marca."
        />

        <div className="blog-grid">
          {BLOG_POSTS.map((post) => (
            <article key={post.id} className="surface-card">
              <span className="pill">{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <button type="button" className="button ghost">
                Leer artículo demo
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CartPage() {
  const { cartItems, cartSummary, updateCartQuantity, clearCart } = useDemo()

  if (!cartItems.length) {
    return (
      <section className="section-block">
        <div className="container">
          <EmptyState
            title="Tu carrito está vacío"
            description="Agrega productos desde la tienda para probar el modal de carrito y el checkout demo."
            action={<Link to="/tienda" className="button">Ir a la tienda</Link>}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section-block">
      <div className="container cart-layout">
        <div className="surface-card">
          <SectionHeading
            title="Carrito demo"
            subtitle="Puedes cambiar cantidades, quitar productos o seguir hacia el checkout."
          />

          <div className="stack-list">
            {cartItems.map((line) => (
              <div key={line.product.id} className="cart-line">
                <img src={line.product.image} alt={line.product.name} className="thumb" />
                <div className="cart-line__content">
                  <strong>{line.product.name}</strong>
                  <span>{line.product.stock} disponibles</span>
                </div>
                <QuantityPicker
                  value={line.quantity}
                  onChange={(value) => updateCartQuantity(line.product.id, value)}
                />
                <strong>{formatCurrency(line.subtotal)}</strong>
              </div>
            ))}
          </div>

          <div className="section-actions">
            <button type="button" className="button ghost" onClick={clearCart}>
              Vaciar carrito
            </button>
            <Link to="/tienda" className="button ghost">
              Seguir comprando
            </Link>
          </div>
        </div>

        <aside className="summary-card">
          <h3>Resumen</h3>
          <SummaryRow label="Subtotal" value={formatCurrency(cartSummary.subtotal)} />
          <SummaryRow label="Envío" value="Se calcula en checkout" />
          <SummaryRow label="Total referencial" value={formatCurrency(cartSummary.total)} emphasis />
          <Link to="/checkout" className="button">
            Continuar al checkout
          </Link>
        </aside>
      </div>
    </section>
  )
}

function CheckoutPage() {
  const {
    cartItems,
    cartSummary,
    createWhatsAppOrder,
    currentUser,
    markOrderPaid,
    simulateWhatsApp,
    state,
  } = useDemo()
  const [deliveryType, setDeliveryType] = useState('Recojo en tienda')
  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState('')

  const order = state.orders.find((item) => item.id === createdOrderId) ?? null
  const shipping = deliveryType === 'Delivery' ? state.config.shippingCost : 0
  const total = cartSummary.subtotal + shipping

  function handleSubmit(event) {
    event.preventDefault()
    const created = createWhatsAppOrder({ deliveryType, address, reference })
    if (created) {
      setCreatedOrderId(created.id)
    }
  }

  if (!cartItems.length && !order) {
    return (
      <section className="section-block">
        <div className="container">
          <EmptyState
            title="No hay productos para procesar"
            description="Agrega productos al carrito antes de probar el checkout demo."
            action={<Link to="/tienda" className="button">Explorar tienda</Link>}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section-block">
      <div className="container checkout-layout">
        <div className="surface-card">
          <SectionHeading
            title="Checkout demo"
            subtitle="El flujo de pago real está desactivado. La compra operativa se simula por WhatsApp."
          />

          <div className="disabled-payment-grid">
            {['Tarjeta', 'Yape', 'Transferencia'].map((method) => (
              <div key={method} className="disabled-payment">
                <strong>{method}</strong>
                <p>Próximamente: disponible cuando se active la pasarela de pago.</p>
              </div>
            ))}
          </div>

          {!currentUser || currentUser.role !== 'customer' ? (
            <div className="surface-inline info-banner">
              <div>
                <strong>Inicia sesión para generar tu pedido por WhatsApp.</strong>
                <p>La orden demo solo se guarda si ingresas como cliente.</p>
              </div>
              <Link to="/login" className="button secondary">
                Login
              </Link>
            </div>
          ) : order ? (
            <div className="confirmation-panel">
              <span className="pill pill--success">{order.status}</span>
              <h3>Orden {order.number} generada</h3>
              <p>
                Método: {order.paymentMethod} · Entrega: {order.deliveryType}
              </p>
              <SummaryRow label="Total" value={formatCurrency(order.total)} emphasis />
              <div className="section-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    simulateWhatsApp(`Se abriría WhatsApp con el detalle del pedido ${order.number}.`)
                  }
                >
                  Enviar por WhatsApp
                </button>
                {order.status === 'Pendiente de pago' ? (
                  <button
                    type="button"
                    className="button"
                    onClick={() => markOrderPaid(order.id)}
                  >
                    Ya pagué
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="field">
                <label>Tipo de entrega</label>
                <select
                  className="select"
                  value={deliveryType}
                  onChange={(event) => setDeliveryType(event.target.value)}
                >
                  <option>Recojo en tienda</option>
                  <option>Delivery</option>
                </select>
              </div>

              {deliveryType === 'Delivery' ? (
                <>
                  <div className="field">
                    <label>Dirección</label>
                    <input
                      className="input"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Referencia</label>
                    <input
                      className="input"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                    />
                  </div>
                </>
              ) : null}

              <button type="submit" className="button">
                Generar orden demo
              </button>
            </form>
          )}
        </div>

        <aside className="summary-card">
          <h3>Resumen de compra</h3>
          {cartItems.map((line) => (
            <SummaryRow
              key={line.product.id}
              label={`${line.product.name} x${line.quantity}`}
              value={formatCurrency(line.subtotal)}
            />
          ))}
          <SummaryRow label="Subtotal" value={formatCurrency(cartSummary.subtotal)} />
          <SummaryRow
            label="Envío"
            value={deliveryType === 'Delivery' ? formatCurrency(shipping) : 'Gratis'}
          />
          <SummaryRow label="Total" value={formatCurrency(total)} emphasis />
        </aside>
      </div>
    </section>
  )
}

function LoginPage() {
  const { login, session } = useDemo()
  const navigate = useNavigate()
  const [email, setEmail] = useState('cliente@cliente.com')
  const [password, setPassword] = useState('password')

  if (session) {
    return <Navigate to={getRouteForRole(session.role)} replace />
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = login(email, password)
    if (result.ok) {
      navigate(getRouteForRole(result.role), { replace: true })
    }
  }

  function handleQuickAccess(credential) {
    setEmail(credential.email)
    setPassword(credential.password)

    const result = login(credential.email, credential.password)
    if (result.ok) {
      navigate(getRouteForRole(result.role), { replace: true })
    }
  }

  return (
    <section className="section-block">
      <div className="container login-layout">
        <div className="surface-card login-card">
          <SectionHeading
            title="Login simulado"
            subtitle="La autenticacion es local y se guarda en localStorage."
          />
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button type="submit" className="button">
              Ingresar a la demo
            </button>
          </form>

          <div className="login-quick-actions">
            <span className="login-quick-actions__label">Accesos rapidos</span>
            <div className="login-quick-actions__grid">
              {DEMO_CREDENTIALS.map((credential) => (
                <button
                  key={credential.email}
                  type="button"
                  className="button ghost small login-quick-actions__button"
                  onClick={() => handleQuickAccess(credential)}
                >
                  {`Entrar como ${credential.role.toLowerCase()}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="credential-grid">
          <article className="surface-card login-info-card">
            <span className="pill">Usuarios demo</span>
            <p className="login-info-card__copy">
              Puedes iniciar sesion con cualquiera de estos perfiles para probar la tienda o el
              panel vendedor.
            </p>
            <div className="credential-list">
              {DEMO_CREDENTIALS.map((credential) => (
                <article key={credential.email} className="credential-line">
                  <div>
                    <strong>{credential.role}</strong>
                    <p>{credential.email}</p>
                  </div>
                  <span>{credential.password}</span>
                </article>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function AccountPage({ focusOrders = false }) {
  const { customerOrders, markOrderPaid, simulateWhatsApp, currentUser } = useDemo()
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const sortedOrders = sortByDateDesc(customerOrders)
  const selectedOrder = sortedOrders.find((order) => order.id === selectedOrderId) ?? null

  const summary = {
    pending: sortedOrders.filter((order) => order.status === 'Pendiente de pago').length,
    verification: sortedOrders.filter((order) => order.status === 'Pendiente de verificación').length,
    preparation: sortedOrders.filter((order) => order.status === 'En preparación').length,
    completed: sortedOrders.filter((order) =>
      ['Entregado', 'Completado'].includes(order.status),
    ).length,
  }

  return (
    <section className="section-block">
      <div className="container">
        <SectionHeading
          title={`Hola, ${currentUser?.name ?? 'Cliente'}`}
          subtitle="Aquí ves tus pedidos demo y puedes informar pagos pendientes."
        />

        <div className="metric-grid">
          <MetricCard title="Pendientes" value={summary.pending} tone="warning" />
          <MetricCard title="En verificación" value={summary.verification} tone="warning" />
          <MetricCard title="En preparación" value={summary.preparation} tone="info" />
          <MetricCard title="Entregados" value={summary.completed} tone="success" />
        </div>

        <div className="surface-card">
          <div className="section-headline">
            <h3>{focusOrders ? 'Mis pedidos' : 'Resumen de pedidos'}</h3>
            <Link to="/tienda" className="button ghost">
              Volver a comprar
            </Link>
          </div>

          {sortedOrders.length ? (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Método</th>
                    <th>Entrega</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.number}</td>
                      <td>{formatDate(order.date)}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>{order.paymentMethod}</td>
                      <td>{order.deliveryType}</td>
                      <td>
                        <StatusBadge tone={statusToTone(order.status)}>{order.status}</StatusBadge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="button ghost small" onClick={() => setSelectedOrderId(order.id)}>
                            Ver detalle
                          </button>
                          {order.status === 'Pendiente de pago' ? (
                            <button type="button" className="button small" onClick={() => markOrderPaid(order.id)}>
                              Ya pagué
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="button ghost small"
                            onClick={() =>
                              simulateWhatsApp(`Se avisaría por WhatsApp sobre el pedido ${order.number}.`)
                            }
                          >
                            Avisar por WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Todavía no tienes pedidos"
              description="Genera uno desde el checkout para verlo reflejado aquí."
            />
          )}
        </div>

        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrderId('')} />
      </div>
    </section>
  )
}

function PanelLayout() {
  const { state, currentUser, logout } = useDemo()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pendingOrders = countPendingOrders(state.orders)
  const paymentsToVerify = countPaymentsToVerify(state.orders)
  const lowStock = countLowStockProducts(
    state.products,
    state.lots,
    state.config.expiryAlertDays,
  )

  const badges = {
    orders: pendingOrders,
    payments: paymentsToVerify,
    inventory: lowStock,
  }

  function handleLogout() {
    setIsSidebarOpen(false)
    logout()
  }

  return (
    <div className="panel-shell">
      <aside className={`panel-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="panel-sidebar__top">
          <div className="brand-lockup">
            <div className="brand-mark">TN</div>
            <div>
              <strong>Panel Terranegra</strong>
              <span>{getRoleLabel(currentUser?.role ?? 'seller')}</span>
            </div>
          </div>
          <button
            type="button"
            className="panel-close-button"
            aria-label="Cerrar menu del panel"
            onClick={() => setIsSidebarOpen(false)}
          >
            Cerrar
          </button>
        </div>

        <nav className="panel-nav">
          {PANEL_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/panel'}
              className="panel-link"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span>{link.label}</span>
              {link.badge ? <span className="counter-badge">{badges[link.badge]}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="panel-sidebar__footer">
          <p>Ruta actual: {location.pathname}</p>
          <div className="section-actions">
            <Link to="/" className="button ghost small" onClick={() => setIsSidebarOpen(false)}>
              Ver tienda
            </Link>
            <button type="button" className="button ghost small" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen ? (
        <button
          type="button"
          className="panel-backdrop"
          aria-label="Cerrar menu lateral"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <main className="panel-main">
        <div className="panel-mobile-bar">
          <button
            type="button"
            className="button ghost small"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((current) => !current)}
          >
            Menu
          </button>
          <div className="panel-mobile-bar__copy">
            <strong>Panel Terranegra</strong>
            <span>{getRoleLabel(currentUser?.role ?? 'seller')}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

function DashboardPage() {
  const { state, simulateNewOrder } = useDemo()
  const salesToday = state.orders
    .filter((order) => order.date.slice(0, 10) === todayKey() && isPaidLikeStatus(order.status))
    .reduce((total, order) => total + order.total, 0)

  const lowStockProducts = state.products
    .map((product) => ({
      product,
      snapshot: getInventorySnapshot(product, state.lots, state.config.expiryAlertDays),
    }))
    .filter((row) => ['Bajo', 'Crítico', 'Agotado', 'Próximo a vencer', 'Vencido'].includes(row.snapshot.status))

  return (
    <div className="panel-page">
      <PageHeader
        title="Dashboard"
        description="Vista general de ventas, pedidos, pagos por verificar y movimientos de inventario."
        action={
          <button type="button" className="button" onClick={simulateNewOrder}>
            Simular nuevo pedido
          </button>
        }
      />

      <div className="metric-grid">
        <MetricCard title="Ventas de hoy" value={formatCurrency(salesToday)} tone="success" />
        <MetricCard title="Pedidos pendientes" value={countPendingOrders(state.orders)} tone="warning" />
        <MetricCard title="Pagos por verificar" value={countPaymentsToVerify(state.orders)} tone="warning" />
        <MetricCard title="Stock bajo" value={lowStockProducts.length} tone="danger" />
      </div>

      <div className="two-column">
        <div className="surface-card">
          <div className="section-headline">
            <h3>Pedidos recientes</h3>
          </div>
          <div className="stack-list">
            {sortByDateDesc(state.orders).slice(0, 5).map((order) => (
              <article key={order.id} className="list-row">
                <div>
                  <strong>{order.number}</strong>
                  <p>{order.customerName}</p>
                </div>
                <div>
                  <StatusBadge tone={statusToTone(order.status)}>{order.status}</StatusBadge>
                  <p>{formatCurrency(order.total)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="surface-card">
          <div className="section-headline">
            <h3>Últimos movimientos de kardex</h3>
          </div>
          <div className="stack-list">
            {sortByDateDesc(state.kardex, (item) => item.date).slice(0, 5).map((movement) => (
              <article key={movement.id} className="list-row">
                <div>
                  <strong>{movement.reference}</strong>
                  <p>{movement.type} · {movement.reason}</p>
                </div>
                <div>
                  <StatusBadge tone={movement.type === 'Entrada' ? 'success' : 'danger'}>
                    {movement.type}
                  </StatusBadge>
                  <p>{formatDateTime(movement.date)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card">
        <div className="section-headline">
          <h3>Alertas de inventario</h3>
        </div>
        <div className="stack-list">
          {lowStockProducts.slice(0, 6).map(({ product, snapshot }) => (
            <article key={product.id} className="list-row">
              <div>
                <strong>{product.name}</strong>
                <p>Stock actual: {product.stock} · Mínimo: {product.minStock}</p>
              </div>
              <StatusBadge tone={snapshot.tone}>{snapshot.status}</StatusBadge>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function PanelOrdersPage() {
  const { state } = useDemo()
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState('')

  const orders = sortByDateDesc(state.orders).filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesChannel = channelFilter === 'all' || order.channel === channelFilter
    return matchesStatus && matchesChannel
  })

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null

  return (
    <div className="panel-page">
      <PageHeader
        title="Pedidos"
        description="Confirma pagos, rechaza, avanza estados y revisa pedidos online o presenciales."
      />

      <div className="toolbar surface-inline">
        <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Todos los estados</option>
          {Object.keys(orderToneMap).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select className="select" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
          <option value="all">Todos los canales</option>
          <option value="online">Tienda web</option>
          <option value="presencial">Venta presencial</option>
        </select>
      </div>

      <div className="surface-card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Canal</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <OrderTableRow key={order.id} order={order} onOpen={() => setSelectedOrderId(order.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrderId('')} />
    </div>
  )
}

function PaymentsPage() {
  const { state, confirmOrderPayment, rejectOrderPayment } = useDemo()
  const paymentOrders = sortByDateDesc(state.orders).filter(
    (order) => order.status === 'Pendiente de verificación',
  )

  return (
    <div className="panel-page">
      <PageHeader
        title="Pagos por verificar"
        description="Aquí el vendedor valida los pagos manuales antes de descontar stock."
      />

      {paymentOrders.length ? (
        <div className="card-grid">
          {paymentOrders.map((order) => (
            <article key={order.id} className="surface-card">
              <StatusBadge tone="warning">{order.status}</StatusBadge>
              <h3>{order.number}</h3>
              <p>{order.customerName}</p>
              <p>{formatCurrency(order.total)}</p>
              <p>{formatDateTime(order.paymentReportedAt || order.date)}</p>
              <div className="section-actions">
                <button type="button" className="button" onClick={() => confirmOrderPayment(order.id)}>
                  Confirmar pago
                </button>
                <button type="button" className="button alert" onClick={() => rejectOrderPayment(order.id)}>
                  Rechazar pago
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay pagos pendientes"
          description="Cuando un cliente marque Ya pagué, aparecerá aquí para validación."
        />
      )}
    </div>
  )
}

function PosPage() {
  const { state, createPosSale } = useDemo()
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [customerName, setCustomerName] = useState('')
  const [posCart, setPosCart] = useState([])
  const [sale, setSale] = useState(null)

  const visibleProducts = state.products.filter((product) => {
    const term = normalizeText(search)
    return (
      product.active &&
      product.stock > 0 &&
      (!term || normalizeText(product.name).includes(term))
    )
  })

  const cartLines = posCart
    .map((entry) => {
      const product = state.products.find((item) => item.id === entry.productId)
      if (!product) {
        return null
      }

      return {
        ...entry,
        product,
        subtotal: getDisplayPrice(product) * entry.quantity,
      }
    })
    .filter(Boolean)

  const total = cartLines.reduce((accumulator, line) => accumulator + line.subtotal, 0)

  function changePosQuantity(productId, nextQuantity) {
    setPosCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (!existing && nextQuantity > 0) {
        return [...current, { productId, quantity: nextQuantity }]
      }

      return current
        .map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
        .filter((item) => item.quantity > 0)
    })
  }

  function handleConfirmSale() {
    const created = createPosSale({ items: posCart, paymentMethod, customerName })
    if (created) {
      setSale(created)
      setPosCart([])
      setCustomerName('')
      setPaymentMethod('efectivo')
    }
  }

  return (
    <div className="panel-page">
      <PageHeader
        title="Venta presencial"
        description="Mini POS demo con descuento automático de stock y kardex de salida."
      />

      <div className="pos-layout">
        <div className="surface-card">
          <div className="toolbar">
            <input
              className="input"
              placeholder="Buscar producto"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="product-grid compact-grid">
            {visibleProducts.map((product) => (
              <article key={product.id} className="product-card product-card--compact">
                <img src={product.image} alt={product.name} className="product-card__media" />
                <div className="product-card__body">
                  <h3>{product.name}</h3>
                  <p>{formatCurrency(getDisplayPrice(product))}</p>
                  <button
                    type="button"
                    className="button small"
                    onClick={() => {
                      const currentQuantity =
                        posCart.find((entry) => entry.productId === product.id)?.quantity ?? 0
                      changePosQuantity(product.id, currentQuantity + 1)
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="summary-card">
          <h3>Carrito POS</h3>
          <div className="stack-list">
            {cartLines.map((line) => (
              <div key={line.productId} className="cart-line cart-line--compact">
                <div className="cart-line__content">
                  <strong>{line.product.name}</strong>
                  <span>{formatCurrency(getDisplayPrice(line.product))}</span>
                </div>
                <QuantityPicker value={line.quantity} onChange={(value) => changePosQuantity(line.productId, value)} />
              </div>
            ))}
          </div>

          <div className="field">
            <label>Método de pago</label>
            <select className="select" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Cliente opcional</label>
            <input
              className="input"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </div>

          <SummaryRow label="Total" value={formatCurrency(total)} emphasis />
          <button type="button" className="button" onClick={handleConfirmSale}>
            Confirmar venta
          </button>

          {sale ? (
            <div className="surface-inline success-banner">
              <strong>{sale.number}</strong>
              <p>Comprobante interno sin validez tributaria.</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function InventoryPage() {
  const { state, registerInventoryEntry } = useDemo()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [lotsProductId, setLotsProductId] = useState('')
  const [form, setForm] = useState({
    productId: state.products[0]?.id ?? '',
    quantity: 10,
    lotCode: '',
    expiresAt: '',
    cost: 0,
    note: '',
  })

  const inventoryRows = state.products.map((product) => ({
    product,
    snapshot: getInventorySnapshot(product, state.lots, state.config.expiryAlertDays),
  }))

  const visibleLots = state.lots.filter((lot) => lot.productId === lotsProductId && lot.quantity > 0)

  function handleSubmit(event) {
    event.preventDefault()
    registerInventoryEntry(form)
    setIsOpen(false)
    setForm({
      productId: state.products[0]?.id ?? '',
      quantity: 10,
      lotCode: '',
      expiresAt: '',
      cost: 0,
      note: '',
    })
  }

  return (
    <div className="panel-page">
      <PageHeader
        title="Inventario"
        description="Stock actual, mínimos, vencimientos y acceso a lotes y kardex."
        action={
          <button type="button" className="button" onClick={() => setIsOpen(true)}>
            Registrar entrada
          </button>
        }
      />

      <div className="surface-card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
                <th>Próximo vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRows.map(({ product, snapshot }) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.stock}</td>
                  <td>{product.minStock}</td>
                  <td>{snapshot.nextExpiry ? formatDate(snapshot.nextExpiry) : 'Sin lotes'}</td>
                  <td>
                    <StatusBadge tone={snapshot.tone}>{snapshot.status}</StatusBadge>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="button ghost small" onClick={() => setLotsProductId(product.id)}>
                        Ver lotes
                      </button>
                      <button
                        type="button"
                        className="button ghost small"
                        onClick={() => navigate(`/panel/kardex?product=${product.id}`)}
                      >
                        Ver kardex
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={isOpen} title="Registrar entrada" onClose={() => setIsOpen(false)}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Producto</label>
            <select
              className="select"
              value={form.productId}
              onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
            >
              {state.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cantidad</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
            />
          </div>
          <div className="field">
            <label>Lote</label>
            <input
              className="input"
              value={form.lotCode}
              onChange={(event) => setForm((current) => ({ ...current, lotCode: event.target.value }))}
            />
          </div>
          <div className="field">
            <label>Fecha de vencimiento</label>
            <input
              className="input"
              type="date"
              value={form.expiresAt}
              onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label>Costo unitario</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(event) => setForm((current) => ({ ...current, cost: Number(event.target.value) }))}
            />
          </div>
          <div className="field field--full">
            <label>Nota</label>
            <textarea
              className="textarea"
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </div>
          <button type="submit" className="button">
            Guardar entrada
          </button>
        </form>
      </Modal>

      <Modal
        open={Boolean(lotsProductId)}
        title="Lotes del producto"
        onClose={() => setLotsProductId('')}
      >
        <div className="stack-list">
          {visibleLots.map((lot) => (
            <article key={lot.id} className="list-row">
              <div>
                <strong>{lot.code}</strong>
                <p>Vence: {formatDate(lot.expiresAt)}</p>
              </div>
              <div>
                <p>Cantidad: {lot.quantity}</p>
                <p>Costo: {formatCurrency(lot.cost)}</p>
              </div>
            </article>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function KardexPage() {
  const { state } = useDemo()
  const [searchParams] = useSearchParams()
  const [productFilter, setProductFilter] = useState(searchParams.get('product') ?? '')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [referenceFilter, setReferenceFilter] = useState('')

  const movements = sortByDateDesc(state.kardex, (item) => item.date).filter((movement) => {
    const matchesProduct = !productFilter || movement.productId === productFilter
    const matchesType = !typeFilter || movement.type === typeFilter
    const matchesDate = !dateFilter || movement.date.slice(0, 10) === dateFilter
    const matchesReference =
      !referenceFilter || normalizeText(movement.reference).includes(normalizeText(referenceFilter))

    return matchesProduct && matchesType && matchesDate && matchesReference
  })

  return (
    <div className="panel-page">
      <PageHeader
        title="Kardex"
        description="Entradas, salidas y ajustes con filtros por producto, tipo, fecha y referencia."
      />

      <div className="toolbar surface-inline">
        <select className="select" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
          <option value="">Todos los productos</option>
          {state.products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <select className="select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="Entrada">Entrada</option>
          <option value="Salida">Salida</option>
          <option value="Ajuste">Ajuste</option>
        </select>
        <input className="input" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        <input
          className="input"
          placeholder="Buscar referencia"
          value={referenceFilter}
          onChange={(event) => setReferenceFilter(event.target.value)}
        />
      </div>

      <div className="surface-card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Lote</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Cantidad</th>
                <th>Antes</th>
                <th>Después</th>
                <th>Referencia</th>
                <th>Usuario</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => {
                const product = state.products.find((item) => item.id === movement.productId)
                return (
                  <tr key={movement.id}>
                    <td>{formatDateTime(movement.date)}</td>
                    <td>{product?.name ?? movement.productId}</td>
                    <td>{movement.lot}</td>
                    <td>
                      <StatusBadge tone={movement.type === 'Entrada' ? 'success' : 'danger'}>
                        {movement.type}
                      </StatusBadge>
                    </td>
                    <td>{movement.reason}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.stockBefore}</td>
                    <td>{movement.stockAfter}</td>
                    <td>{movement.reference}</td>
                    <td>{movement.userName}</td>
                    <td>{movement.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ProductsPage() {
  const { state, saveProduct, toggleProduct } = useDemo()
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState({
    id: '',
    name: '',
    categoryId: state.categories[0]?.id ?? '',
    price: 0,
    minStock: 0,
    description: '',
    sku: '',
    featured: false,
  })

  function openNewProduct() {
    setEditingProduct({})
    setForm({
      id: '',
      name: '',
      categoryId: state.categories[0]?.id ?? '',
      price: 0,
      minStock: 0,
      description: '',
      sku: '',
      featured: false,
    })
  }

  function openEditProduct(product) {
    setEditingProduct(product)
    setForm({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      minStock: product.minStock,
      description: product.description,
      sku: product.sku,
      featured: product.featured,
    })
  }

  function handleSave(event) {
    event.preventDefault()
    const category = state.categories.find((item) => item.id === form.categoryId)
    saveProduct({
      ...form,
      image: editingProduct?.image || buildQuickImage(form.name, category?.name ?? 'Producto'),
    })
    setEditingProduct(null)
  }

  return (
    <div className="panel-page">
      <PageHeader
        title="Productos"
        description="Crea, edita, activa o desactiva productos demo. Los cambios se guardan en localStorage."
        action={
          <button type="button" className="button" onClick={openNewProduct}>
            Crear producto demo
          </button>
        }
      />

      <div className="surface-card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Oferta</th>
                <th>Stock</th>
                <th>Stock mínimo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {state.products.map((product) => {
                const category = state.categories.find((item) => item.id === product.categoryId)
                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{category?.name}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.offer?.enabled ? formatCurrency(product.offer.price) : 'Sin oferta'}</td>
                    <td>{product.stock}</td>
                    <td>{product.minStock}</td>
                    <td>
                      <StatusBadge tone={product.active ? 'success' : 'muted'}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="button ghost small" onClick={() => openEditProduct(product)}>
                          Editar
                        </button>
                        <button type="button" className="button ghost small" onClick={() => toggleProduct(product.id)}>
                          {product.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(editingProduct)}
        title={form.id ? 'Editar producto' : 'Crear producto'}
        onClose={() => setEditingProduct(null)}
      >
        <form className="form-grid" onSubmit={handleSave}>
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </div>
          <div className="field">
            <label>Categoría</label>
            <select className="select" value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
              {state.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Precio</label>
            <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} />
          </div>
          <div className="field">
            <label>Stock mínimo</label>
            <input className="input" type="number" min="0" value={form.minStock} onChange={(event) => setForm((current) => ({ ...current, minStock: Number(event.target.value) }))} />
          </div>
          <div className="field">
            <label>SKU</label>
            <input className="input" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} />
          </div>
          <div className="field checkbox-field">
            <label>
              <input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} />
              Destacado
            </label>
          </div>
          <div className="field field--full">
            <label>Descripción</label>
            <textarea className="textarea" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <button type="submit" className="button">
            Guardar producto
          </button>
        </form>
      </Modal>
    </div>
  )
}

function CategoriesPage() {
  const { state, saveCategory, toggleCategory } = useDemo()
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState({ id: '', name: '', description: '' })

  function openNewCategory() {
    setEditingCategory({})
    setForm({ id: '', name: '', description: '' })
  }

  function openEditCategory(category) {
    setEditingCategory(category)
    setForm({ id: category.id, name: category.name, description: category.description })
  }

  function handleSubmit(event) {
    event.preventDefault()
    saveCategory(form)
    setEditingCategory(null)
  }

  return (
    <div className="panel-page">
      <PageHeader
        title="Categorías"
        description="Crea, edita y activa o desactiva categorías demo."
        action={
          <button type="button" className="button" onClick={openNewCategory}>
            Crear categoría
          </button>
        }
      />

      <div className="surface-card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {state.categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description}</td>
                  <td>
                    <StatusBadge tone={category.active ? 'success' : 'muted'}>
                      {category.active ? 'Activa' : 'Inactiva'}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="button ghost small" onClick={() => openEditCategory(category)}>
                        Editar
                      </button>
                      <button type="button" className="button ghost small" onClick={() => toggleCategory(category.id)}>
                        {category.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(editingCategory)}
        title={form.id ? 'Editar categoría' : 'Crear categoría'}
        onClose={() => setEditingCategory(null)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </div>
          <div className="field field--full">
            <label>Descripción</label>
            <textarea className="textarea" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <button type="submit" className="button">
            Guardar categoría
          </button>
        </form>
      </Modal>
    </div>
  )
}

function OffersManagerPage() {
  const { state, saveOffer } = useDemo()
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      state.products.map((product) => [
        product.id,
        {
          enabled: Boolean(product.offer?.enabled),
          price: product.offer?.price ?? '',
          startDate: product.offer?.startDate ?? '',
          endDate: product.offer?.endDate ?? '',
        },
      ]),
    ),
  )

  return (
    <div className="panel-page">
      <PageHeader
        title="Ofertas"
        description="Activa o desactiva ofertas por producto y cambia sus fechas."
      />

      <div className="card-grid">
        {state.products.map((product) => {
          const draft = drafts[product.id] ?? {
            enabled: false,
            price: '',
            startDate: '',
            endDate: '',
          }

          return (
            <article key={product.id} className="surface-card">
              <h3>{product.name}</h3>
              <div className="field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [product.id]: { ...draft, enabled: event.target.checked },
                      }))
                    }
                  />
                  Oferta activa
                </label>
              </div>
              <div className="field">
                <label>Precio oferta</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [product.id]: { ...draft, price: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="field">
                <label>Fecha inicio</label>
                <input
                  className="input"
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [product.id]: { ...draft, startDate: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="field">
                <label>Fecha fin</label>
                <input
                  className="input"
                  type="date"
                  value={draft.endDate}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [product.id]: { ...draft, endDate: event.target.value },
                    }))
                  }
                />
              </div>
              <button
                type="button"
                className="button"
                onClick={() => saveOffer({ productId: product.id, ...draft })}
              >
                Guardar oferta
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ReportsPage() {
  const { state } = useDemo()
  const onlineSales = state.orders
    .filter((order) => order.channel === 'online' && isPaidLikeStatus(order.status))
    .reduce((total, order) => total + order.total, 0)
  const posSales = state.orders
    .filter((order) => order.channel === 'presencial' && isPaidLikeStatus(order.status))
    .reduce((total, order) => total + order.total, 0)
  const lowStockProducts = state.products.filter((product) => {
    const snapshot = getInventorySnapshot(product, state.lots, state.config.expiryAlertDays)
    return ['Bajo', 'Crítico', 'Agotado'].includes(snapshot.status)
  })
  const expiringSoon = state.products.filter((product) => {
    const snapshot = getInventorySnapshot(product, state.lots, state.config.expiryAlertDays)
    return ['Próximo a vencer', 'Vencido'].includes(snapshot.status)
  })
  const topProducts = salesByProduct(state.orders).slice(0, 5)

  return (
    <div className="panel-page">
      <PageHeader
        title="Reportes"
        description="Indicadores simulados calculados sobre los datos guardados en localStorage."
      />

      <div className="metric-grid">
        <MetricCard title="Ventas de hoy" value={formatCurrency(state.orders.filter((order) => order.date.slice(0, 10) === todayKey() && isPaidLikeStatus(order.status)).reduce((total, order) => total + order.total, 0))} tone="success" />
        <MetricCard title="Ventas online" value={formatCurrency(onlineSales)} tone="info" />
        <MetricCard title="Ventas presenciales" value={formatCurrency(posSales)} tone="info" />
        <MetricCard title="Pagos rechazados" value={state.orders.filter((order) => order.status === 'Rechazado').length} tone="danger" />
      </div>

      <div className="two-column">
        <div className="surface-card">
          <h3>Productos más vendidos</h3>
          <div className="stack-list">
            {topProducts.map((product) => (
              <article key={product.productId} className="list-row">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.quantity} unidades</p>
                </div>
                <strong>{formatCurrency(product.revenue)}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="surface-card">
          <h3>Alertas de operación</h3>
          <div className="stack-list">
            <article className="list-row">
              <div>
                <strong>Stock bajo</strong>
                <p>{lowStockProducts.length} productos</p>
              </div>
            </article>
            <article className="list-row">
              <div>
                <strong>Próximos a vencer</strong>
                <p>{expiringSoon.length} productos</p>
              </div>
            </article>
            <article className="list-row">
              <div>
                <strong>Pedidos pendientes</strong>
                <p>{countPendingOrders(state.orders)}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsPage() {
  const { state, updateConfig, resetDemoData } = useDemo()

  function handleSubmit(event, form) {
    event.preventDefault()
    updateConfig(form)
  }

  return (
    <div className="panel-page">
      <PageHeader
        title="Configuración"
        description="Parámetros demo del negocio visibles en la tienda, checkout y panel operativo."
      />

      <div className="two-column">
        <SettingsFormCard
          key={JSON.stringify(state.config)}
          initialConfig={state.config}
          onSubmit={handleSubmit}
        />

        <div className="surface-card">
          <h3>Herramientas de demo</h3>
          <p>Este botón vuelve a crear los productos, lotes, pedidos y configuración iniciales.</p>
          <button type="button" className="button alert" onClick={resetDemoData}>
            Restablecer datos demo
          </button>

          <div className="spacer-block">
            <h3>Usuarios disponibles</h3>
            <div className="stack-list">
              {DEMO_CREDENTIALS.map((credential) => (
                <article key={credential.email} className="list-row">
                  <div>
                    <strong>{credential.role}</strong>
                    <p>{credential.email}</p>
                  </div>
                  <span>{credential.password}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsFormCard({ initialConfig, onSubmit }) {
  const [form, setForm] = useState(initialConfig)

  return (
    <div className="surface-card">
      <form className="form-grid" onSubmit={(event) => onSubmit(event, form)}>
        <div className="field">
          <label>Nombre del negocio</label>
          <input className="input" value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} />
        </div>
        <div className="field">
          <label>WhatsApp</label>
          <input className="input" value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} />
        </div>
        <div className="field">
          <label>Número Yape</label>
          <input className="input" value={form.yapeNumber} onChange={(event) => setForm((current) => ({ ...current, yapeNumber: event.target.value }))} />
        </div>
        <div className="field">
          <label>Titular Yape</label>
          <input className="input" value={form.yapeHolder} onChange={(event) => setForm((current) => ({ ...current, yapeHolder: event.target.value }))} />
        </div>
        <div className="field">
          <label>Costo de envío</label>
          <input className="input" type="number" min="0" step="0.01" value={form.shippingCost} onChange={(event) => setForm((current) => ({ ...current, shippingCost: Number(event.target.value) }))} />
        </div>
        <div className="field">
          <label>Máximo pedidos pendientes</label>
          <input className="input" type="number" min="1" value={form.maxPendingOrders} onChange={(event) => setForm((current) => ({ ...current, maxPendingOrders: Number(event.target.value) }))} />
        </div>
        <div className="field">
          <label>Días alerta vencimiento</label>
          <input className="input" type="number" min="1" value={form.expiryAlertDays} onChange={(event) => setForm((current) => ({ ...current, expiryAlertDays: Number(event.target.value) }))} />
        </div>
        <div className="field field--full">
          <label>Dirección</label>
          <textarea className="textarea" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
        </div>
        <button type="submit" className="button">
          Guardar configuración
        </button>
      </form>
    </div>
  )
}

function ProductShowcase({ title, subtitle, products, compact = false }) {
  const { state, addToCart, cartItems, updateCartQuantity } = useDemo()
  const [selectedProductId, setSelectedProductId] = useState('')
  const selectedProduct = state.products.find((product) => product.id === selectedProductId) ?? null
  const cartLine =
    cartItems.find((line) => line.product.id === selectedProductId) ??
    (selectedProduct
      ? {
          product: selectedProduct,
          quantity: 0,
          unitPrice: getDisplayPrice(selectedProduct),
          subtotal: 0,
        }
      : null)

  const recommendations = selectedProduct
    ? state.products
        .filter(
          (product) =>
            product.id !== selectedProduct.id &&
            product.active &&
            (product.categoryId === selectedProduct.categoryId || product.featured),
        )
        .slice(0, 3)
    : []

  function handleAdd(product) {
    const result = addToCart(product.id, 1)
    if (result.ok) {
      setSelectedProductId(product.id)
    }
  }

  return (
    <section className="section-block">
      <div className="container">
        {title ? <SectionHeading title={title} subtitle={subtitle} /> : null}

        {products.length ? (
          <div className={`product-grid ${compact ? 'compact-grid' : ''}`}>
            {products.map((product) => {
              const category = state.categories.find((item) => item.id === product.categoryId)
              const offerPrice = product.offer?.enabled ? product.offer.price : null

              return (
                <article key={product.id} className="product-card">
                  <img src={product.image} alt={product.name} className="product-card__media" />
                  <div className="product-card__body">
                    <span className="pill pill--soft">{category?.name}</span>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="price-block">
                      <strong>{formatCurrency(getDisplayPrice(product))}</strong>
                      {offerPrice ? <span>{formatCurrency(product.price)}</span> : null}
                    </div>
                    <div className="product-card__meta">
                      <span>Stock: {product.stock}</span>
                      {offerPrice ? <span className="offer-tag">Oferta activa</span> : null}
                    </div>
                    <button type="button" className="button" onClick={() => handleAdd(product)}>
                      Agregar al carrito
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="No encontramos productos"
            description="Ajusta los filtros o agrega más productos desde el panel demo."
          />
        )}
      </div>

      <Modal open={Boolean(selectedProduct)} title="Producto agregado a tu carrito" onClose={() => setSelectedProductId('')}>
        {cartLine ? (
          <div className="modal-product">
            <img src={cartLine.product.image} alt={cartLine.product.name} className="modal-product__image" />
            <div className="modal-product__content">
              <strong>{cartLine.product.name}</strong>
              <p>Cantidad en carrito: {cartLine.quantity}</p>
              <p>{formatCurrency(cartLine.unitPrice)}</p>
              <QuantityPicker value={cartLine.quantity} onChange={(value) => updateCartQuantity(cartLine.product.id, value)} />
              <div className="section-actions">
                <button type="button" className="button ghost" onClick={() => setSelectedProductId('')}>
                  Seguir comprando
                </button>
                <Link to="/carrito" className="button secondary" onClick={() => setSelectedProductId('')}>
                  Ir al carrito
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {recommendations.length ? (
          <div className="recommendation-block">
            <h3>Quizá te interese también</h3>
            <div className="recommendation-grid">
              {recommendations.map((product) => (
                <article key={product.id} className="mini-product">
                  <img src={product.image} alt={product.name} className="mini-product__image" />
                  <div>
                    <strong>{product.name}</strong>
                    <p>{formatCurrency(getDisplayPrice(product))}</p>
                  </div>
                  <button type="button" className="button small" onClick={() => handleAdd(product)}>
                    Agregar
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}

function OrderTableRow({ order, onOpen }) {
  const { confirmOrderPayment, rejectOrderPayment, advanceOrder, simulateWhatsApp } = useDemo()
  const nextStatus = getNextOrderStatus(order)

  return (
    <tr>
      <td>{order.number}</td>
      <td>{getChannelLabel(order.channel)}</td>
      <td>{order.customerName}</td>
      <td>{formatDateTime(order.date)}</td>
      <td>{formatCurrency(order.total)}</td>
      <td>
        <StatusBadge tone={statusToTone(order.status)}>{order.status}</StatusBadge>
      </td>
      <td>
        <div className="table-actions">
          <button type="button" className="button ghost small" onClick={onOpen}>
            Ver detalle
          </button>
          {['Pendiente de pago', 'Pendiente de verificación'].includes(order.status) ? (
            <>
              <button type="button" className="button small" onClick={() => confirmOrderPayment(order.id)}>
                Confirmar pago
              </button>
              <button type="button" className="button alert small" onClick={() => rejectOrderPayment(order.id)}>
                Rechazar
              </button>
            </>
          ) : null}
          {nextStatus ? (
            <button type="button" className="button secondary small" onClick={() => advanceOrder(order.id)}>
              Avanzar estado
            </button>
          ) : null}
          {order.status === 'Pago recibido' ? (
            <button
              type="button"
              className="button ghost small"
              onClick={() =>
                simulateWhatsApp(`Se avisaría por WhatsApp: pago recibido para ${order.number}.`)
              }
            >
              WhatsApp: pago recibido
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}

function ToastViewport() {
  const { toasts } = useDemo()

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}

function Modal({ open, title, children, onClose }) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <h2>{title}</h2>
          <button type="button" className="button ghost small" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="modal-card__body">{children}</div>
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose }) {
  if (!order) {
    return null
  }

  return (
    <Modal open={Boolean(order)} title={`Detalle ${order.number}`} onClose={onClose}>
      <div className="stack-list">
        <div className="detail-grid">
          <SummaryRow label="Fecha" value={formatDateTime(order.date)} />
          <SummaryRow label="Cliente" value={order.customerName} />
          <SummaryRow label="Método" value={order.paymentMethod} />
          <SummaryRow label="Entrega" value={order.deliveryType} />
          <SummaryRow label="Estado" value={order.status} />
          <SummaryRow label="Total" value={formatCurrency(order.total)} emphasis />
        </div>

        <div className="surface-inline">
          <strong>Items</strong>
          {order.items.map((item) => (
            <SummaryRow key={`${order.id}-${item.productId}`} label={`${item.name} x${item.quantity}`} value={formatCurrency(item.subtotal)} />
          ))}
        </div>

        {order.address ? (
          <div className="surface-inline">
            <strong>Delivery</strong>
            <p>{order.address}</p>
            <p>{order.reference}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

function StatusBadge({ tone = 'muted', children }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  )
}

function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function MetricCard({ title, value, tone = 'info' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  )
}

function MetricMini({ label, value }) {
  return (
    <div className="metric-mini">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

function QuantityPicker({ value, onChange }) {
  return (
    <div className="quantity-picker">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>
        -
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}

function SummaryRow({ label, value, emphasis = false }) {
  return (
    <div className={`summary-row ${emphasis ? 'summary-row--emphasis' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
