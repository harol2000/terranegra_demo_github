import { formatSequence, generateId, slugify } from './demoHelpers'

function shiftDate(days, hours = 10) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hours, 30, 0, 0)
  return date.toISOString()
}

function shiftDay(days) {
  return shiftDate(days).slice(0, 10)
}

function buildProductImage(title, accent, accentSoft) {
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')

  const svg = `
    <svg width="800" height="520" viewBox="0 0 800 520" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accentSoft}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="800" height="520" rx="48" fill="url(#bg)" />
      <circle cx="640" cy="110" r="96" fill="rgba(255,255,255,0.18)" />
      <circle cx="130" cy="400" r="120" fill="rgba(255,255,255,0.12)" />
      <path d="M114 132C225 84 371 78 477 137C584 195 645 315 637 422" stroke="rgba(255,255,255,0.25)" stroke-width="16" stroke-linecap="round"/>
      <rect x="80" y="86" width="144" height="44" rx="22" fill="rgba(11,33,28,0.72)" />
      <text x="152" y="114" text-anchor="middle" fill="#F7F0E1" font-family="Georgia, serif" font-size="24" font-weight="700">Terranegra</text>
      <text x="80" y="322" fill="#F7F0E1" font-family="Georgia, serif" font-size="64" font-weight="700">${title}</text>
      <text x="80" y="382" fill="rgba(247,240,225,0.86)" font-family="Arial, sans-serif" font-size="26">Producto demo · inventario simulado</text>
      <text x="638" y="332" text-anchor="middle" fill="#0B211C" font-family="Arial, sans-serif" font-size="120" font-weight="900">${initials}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const DEMO_CREDENTIALS = [
  {
    role: 'Cliente',
    email: 'cliente@cliente.com',
    password: 'password',
    route: '/mi-cuenta',
  },
  {
    role: 'Vendedor',
    email: 'vendedor@gmail.com',
    password: 'password',
    route: '/panel',
  },
  {
    role: 'Admin',
    email: 'admin@terranegra.com',
    password: 'password',
    route: '/panel',
  },
]

export const PUBLIC_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Tienda', to: '/tienda' },
  { label: 'Ofertas', to: '/ofertas' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Sobre nosotros', to: '/sobre-nosotros' },
  { label: 'Blog', to: '/blog' },
]

export const PANEL_LINKS = [
  { label: 'Dashboard', to: '/panel', key: 'dashboard' },
  { label: 'Pedidos', to: '/panel/pedidos', key: 'orders', badge: 'orders' },
  { label: 'Pagos por verificar', to: '/panel/pagos-por-verificar', key: 'payments', badge: 'payments' },
  { label: 'Venta presencial', to: '/panel/venta-presencial', key: 'pos' },
  { label: 'Inventario', to: '/panel/inventario', key: 'inventory', badge: 'inventory' },
  { label: 'Kardex', to: '/panel/kardex', key: 'kardex' },
  { label: 'Productos', to: '/panel/productos', key: 'products' },
  { label: 'Categorías', to: '/panel/categorias', key: 'categories' },
  { label: 'Ofertas', to: '/panel/ofertas', key: 'offers' },
  { label: 'Reportes', to: '/panel/reportes', key: 'reports' },
  { label: 'Configuración', to: '/panel/configuracion', key: 'settings' },
]

export const SERVICE_ITEMS = [
  {
    title: 'Venta web guiada',
    description: 'Catálogo, carrito, checkout por WhatsApp y panel cliente para ver estados del pedido.',
  },
  {
    title: 'Inventario por lotes',
    description: 'Stock mínimo, alertas de vencimiento, entradas de compra y salidas automáticas por venta.',
  },
  {
    title: 'Kardex trazable',
    description: 'Cada movimiento deja referencia, usuario, lote y stock antes/después para la demo comercial.',
  },
]

export const BLOG_POSTS = [
  {
    id: 'blog-1',
    title: 'Cómo mostrar una tienda artesanal sin backend real',
    excerpt: 'Una demo estática bien diseñada puede validar experiencia, flujo de compra y panel operativo antes del desarrollo final.',
    category: 'Demo comercial',
  },
  {
    id: 'blog-2',
    title: 'Inventario y kardex: la parte que la clienta sí necesita ver',
    excerpt: 'Visualizar entradas, salidas y alertas genera confianza sobre cómo funcionará la operación diaria.',
    category: 'Operaciones',
  },
  {
    id: 'blog-3',
    title: 'Pedidos por WhatsApp con validación manual de pago',
    excerpt: 'Ideal para una primera etapa: el cliente compra, reporta el pago y el vendedor confirma cuando corresponde.',
    category: 'Ventas',
  },
]

export const PAYMENT_METHODS = ['efectivo', 'Yape', 'transferencia', 'tarjeta externa']

export const ORDER_STATUSES = [
  'Pendiente de pago',
  'Pendiente de verificación',
  'Pago recibido',
  'En preparación',
  'Listo para recoger',
  'Enviado',
  'Entregado',
  'Completado',
  'Cancelado',
  'Rechazado',
  'Expirado',
]

export function createDemoState() {
  const customerId = 'user-customer'
  const sellerId = 'user-seller'
  const adminId = 'user-admin'

  const categories = [
    {
      id: 'cat-cafe',
      name: 'Cafés',
      slug: 'cafes',
      description: 'Café de especialidad molido listo para tu ritual diario.',
      active: true,
    },
    {
      id: 'cat-chocolate',
      name: 'Chocolates',
      slug: 'chocolates',
      description: 'Tabletas con cacao de origen y mezclas de autor.',
      active: true,
    },
    {
      id: 'cat-cacao',
      name: 'Cacao y nibs',
      slug: 'cacao-y-nibs',
      description: 'Snacks funcionales y cacao puro para repostería o topping.',
      active: true,
    },
    {
      id: 'cat-estacional',
      name: 'Ediciones especiales',
      slug: 'ediciones-especiales',
      description: 'Lanzamientos por temporada y lotes cortos para campañas.',
      active: true,
    },
  ]

  const palette = {
    'cat-cafe': ['#52311E', '#9A6B44'],
    'cat-chocolate': ['#7B3F1D', '#D48537'],
    'cat-cacao': ['#1B5B46', '#90B48B'],
    'cat-estacional': ['#7A4B2A', '#D56F2B'],
  }

  const createProduct = ({
    id,
    name,
    categoryId,
    price,
    stock,
    minStock,
    featured = false,
    offer = null,
    description,
    sku,
  }) => {
    const [accent, accentSoft] = palette[categoryId]

    return {
      id,
      name,
      slug: slugify(name),
      categoryId,
      price,
      stock,
      minStock,
      featured,
      active: true,
      description,
      sku,
      offer: offer
        ? {
            enabled: true,
            price: offer.price,
            startDate: offer.startDate,
            endDate: offer.endDate,
          }
        : {
            enabled: false,
            price: '',
            startDate: '',
            endDate: '',
          },
      image: buildProductImage(name, accent, accentSoft),
    }
  }

  const products = [
    createProduct({
      id: 'prod-cafe-250',
      name: 'Café molido 250g',
      categoryId: 'cat-cafe',
      price: 18.5,
      stock: 42,
      minStock: 12,
      featured: true,
      offer: { price: 16.9, startDate: shiftDay(-2), endDate: shiftDay(12) },
      description: 'Tueste medio con notas a cacao y frutos secos.',
      sku: 'TN-CAF-250',
    }),
    createProduct({
      id: 'prod-cafe-500',
      name: 'Café molido 500g',
      categoryId: 'cat-cafe',
      price: 31.9,
      stock: 18,
      minStock: 8,
      featured: true,
      description: 'Formato familiar para cafetería o consumo intenso.',
      sku: 'TN-CAF-500',
    }),
    createProduct({
      id: 'prod-choco-naranja',
      name: 'Chocolate naranja 70%',
      categoryId: 'cat-chocolate',
      price: 14.5,
      stock: 30,
      minStock: 10,
      featured: true,
      offer: { price: 12.9, startDate: shiftDay(-1), endDate: shiftDay(20) },
      description: 'Cítrico aromático y final largo de cacao.',
      sku: 'TN-CHO-NAR',
    }),
    createProduct({
      id: 'prod-choco-pasas',
      name: 'Chocolate con pasas 70%',
      categoryId: 'cat-chocolate',
      price: 13.9,
      stock: 22,
      minStock: 8,
      description: 'Textura suave con contraste dulce natural.',
      sku: 'TN-CHO-PAS',
    }),
    createProduct({
      id: 'prod-choco-negro',
      name: 'Chocolate negro 70%',
      categoryId: 'cat-chocolate',
      price: 12.9,
      stock: 40,
      minStock: 10,
      description: 'La barra insignia de la marca para consumo diario.',
      sku: 'TN-CHO-NEG',
    }),
    createProduct({
      id: 'prod-choco-mani',
      name: 'Chocolate con maní 70%',
      categoryId: 'cat-chocolate',
      price: 13.5,
      stock: 16,
      minStock: 10,
      offer: { price: 11.8, startDate: shiftDay(-3), endDate: shiftDay(8) },
      description: 'Crujiente, intenso y perfecto para impulso en caja.',
      sku: 'TN-CHO-MAN',
    }),
    createProduct({
      id: 'prod-choco-kiwicha',
      name: 'Chocolate con kiwicha',
      categoryId: 'cat-chocolate',
      price: 14.2,
      stock: 12,
      minStock: 8,
      description: 'Chocolate con cereal andino tostado y textura liviana.',
      sku: 'TN-CHO-KIW',
    }),
    createProduct({
      id: 'prod-nibs-250',
      name: 'Nibs de cacao 250g',
      categoryId: 'cat-cacao',
      price: 19.9,
      stock: 20,
      minStock: 8,
      featured: true,
      description: 'Snack puro, crocante y alto en cacao.',
      sku: 'TN-NIB-250',
    }),
    createProduct({
      id: 'prod-nibs-500',
      name: 'Nibs de cacao 500g',
      categoryId: 'cat-cacao',
      price: 34.9,
      stock: 7,
      minStock: 6,
      description: 'Formato para cocina, cafés y toppings de alto giro.',
      sku: 'TN-NIB-500',
    }),
  ]

  const lots = [
    { id: 'lot-001', productId: 'prod-cafe-250', code: 'CAF250-A1', quantity: 20, expiresAt: shiftDay(170), cost: 9.6 },
    { id: 'lot-002', productId: 'prod-cafe-250', code: 'CAF250-B1', quantity: 22, expiresAt: shiftDay(215), cost: 9.8 },
    { id: 'lot-003', productId: 'prod-cafe-500', code: 'CAF500-A1', quantity: 18, expiresAt: shiftDay(190), cost: 17.2 },
    { id: 'lot-004', productId: 'prod-choco-naranja', code: 'CHNAR-A1', quantity: 12, expiresAt: shiftDay(95), cost: 7.1 },
    { id: 'lot-005', productId: 'prod-choco-naranja', code: 'CHNAR-B1', quantity: 18, expiresAt: shiftDay(120), cost: 7.0 },
    { id: 'lot-006', productId: 'prod-choco-pasas', code: 'CHPAS-A1', quantity: 22, expiresAt: shiftDay(84), cost: 6.6 },
    { id: 'lot-007', productId: 'prod-choco-negro', code: 'CHNEG-A1', quantity: 24, expiresAt: shiftDay(110), cost: 5.9 },
    { id: 'lot-008', productId: 'prod-choco-negro', code: 'CHNEG-B1', quantity: 16, expiresAt: shiftDay(134), cost: 6.0 },
    { id: 'lot-009', productId: 'prod-choco-mani', code: 'CHMAN-A1', quantity: 16, expiresAt: shiftDay(70), cost: 6.1 },
    { id: 'lot-010', productId: 'prod-choco-kiwicha', code: 'CHKIW-A1', quantity: 12, expiresAt: shiftDay(18), cost: 6.4 },
    { id: 'lot-011', productId: 'prod-nibs-250', code: 'NIB250-A1', quantity: 20, expiresAt: shiftDay(160), cost: 10.1 },
    { id: 'lot-012', productId: 'prod-nibs-500', code: 'NIB500-A1', quantity: 7, expiresAt: shiftDay(9), cost: 17.6 },
  ]

  const users = [
    {
      id: customerId,
      name: 'Cliente Demo',
      role: 'customer',
      email: 'cliente@cliente.com',
      password: 'password',
      whatsapp: '999123456',
    },
    {
      id: sellerId,
      name: 'Vendedor Demo',
      role: 'seller',
      email: 'vendedor@gmail.com',
      password: 'password',
      whatsapp: '988222111',
    },
    {
      id: adminId,
      name: 'Admin Terranegra',
      role: 'admin',
      email: 'admin@terranegra.com',
      password: 'password',
      whatsapp: '987654321',
    },
  ]

  const orders = [
    {
      id: generateId('order'),
      number: 'ORD-000152',
      date: shiftDate(-1, 11),
      channel: 'online',
      customerId,
      customerName: 'Cliente Demo',
      customerEmail: 'cliente@cliente.com',
      status: 'Completado',
      paymentMethod: 'WhatsApp',
      deliveryType: 'Delivery',
      address: 'Av. El Sol 215, Cusco',
      reference: 'Portón verde',
      subtotal: 58.9,
      shipping: 12,
      total: 70.9,
      stockDiscounted: true,
      paymentReportedAt: shiftDate(-1, 12),
      paymentConfirmedAt: shiftDate(-1, 13),
      items: [
        {
          productId: 'prod-cafe-500',
          name: 'Café molido 500g',
          categoryId: 'cat-cafe',
          quantity: 1,
          unitPrice: 31.9,
          subtotal: 31.9,
        },
        {
          productId: 'prod-choco-negro',
          name: 'Chocolate negro 70%',
          categoryId: 'cat-chocolate',
          quantity: 2,
          unitPrice: 12.9,
          subtotal: 25.8,
        },
        {
          productId: 'prod-nibs-250',
          name: 'Nibs de cacao 250g',
          categoryId: 'cat-cacao',
          quantity: 1,
          unitPrice: 19.9,
          subtotal: 19.9,
        },
      ],
      notes: 'Pedido de referencia para entregas completadas.',
    },
    {
      id: generateId('order'),
      number: 'ORD-000151',
      date: shiftDate(0, 9),
      channel: 'online',
      customerId,
      customerName: 'Cliente Demo',
      customerEmail: 'cliente@cliente.com',
      status: 'Pendiente de verificación',
      paymentMethod: 'WhatsApp',
      deliveryType: 'Recojo en tienda',
      address: '',
      reference: '',
      subtotal: 40.5,
      shipping: 0,
      total: 40.5,
      stockDiscounted: false,
      paymentReportedAt: shiftDate(0, 10),
      paymentConfirmedAt: '',
      items: [
        {
          productId: 'prod-cafe-250',
          name: 'Café molido 250g',
          categoryId: 'cat-cafe',
          quantity: 1,
          unitPrice: 16.9,
          subtotal: 16.9,
        },
        {
          productId: 'prod-choco-mani',
          name: 'Chocolate con maní 70%',
          categoryId: 'cat-chocolate',
          quantity: 2,
          unitPrice: 11.8,
          subtotal: 23.6,
        },
      ],
      notes: 'Cliente informó pago por Yape, pendiente de validación manual.',
    },
    {
      id: generateId('order'),
      number: 'ORD-000150',
      date: shiftDate(0, 8),
      channel: 'online',
      customerId,
      customerName: 'Cliente Demo',
      customerEmail: 'cliente@cliente.com',
      status: 'Pendiente de pago',
      paymentMethod: 'WhatsApp',
      deliveryType: 'Delivery',
      address: 'Pasaje Bellavista 129, Cusco',
      reference: 'Tocar timbre de madera',
      subtotal: 32.8,
      shipping: 12,
      total: 44.8,
      stockDiscounted: false,
      paymentReportedAt: '',
      paymentConfirmedAt: '',
      items: [
        {
          productId: 'prod-choco-naranja',
          name: 'Chocolate naranja 70%',
          categoryId: 'cat-chocolate',
          quantity: 1,
          unitPrice: 12.9,
          subtotal: 12.9,
        },
        {
          productId: 'prod-nibs-250',
          name: 'Nibs de cacao 250g',
          categoryId: 'cat-cacao',
          quantity: 1,
          unitPrice: 19.9,
          subtotal: 19.9,
        },
      ],
      notes: 'Esperando confirmación de pago por transferencia.',
    },
    {
      id: generateId('order'),
      number: 'POS-000149',
      date: shiftDate(0, 14),
      channel: 'presencial',
      customerId: null,
      customerName: 'Cliente mostrador',
      customerEmail: '',
      status: 'Completado',
      paymentMethod: 'efectivo',
      deliveryType: 'Venta presencial',
      address: '',
      reference: '',
      subtotal: 27.4,
      shipping: 0,
      total: 27.4,
      stockDiscounted: true,
      paymentReportedAt: shiftDate(0, 14),
      paymentConfirmedAt: shiftDate(0, 14),
      items: [
        {
          productId: 'prod-choco-pasas',
          name: 'Chocolate con pasas 70%',
          categoryId: 'cat-chocolate',
          quantity: 1,
          unitPrice: 13.9,
          subtotal: 13.9,
        },
        {
          productId: 'prod-choco-negro',
          name: 'Chocolate negro 70%',
          categoryId: 'cat-chocolate',
          quantity: 1,
          unitPrice: 12.9,
          subtotal: 12.9,
        },
      ],
      notes: 'Venta interna de referencia.',
    },
    {
      id: generateId('order'),
      number: 'ORD-000148',
      date: shiftDate(-2, 16),
      channel: 'online',
      customerId: null,
      customerName: 'Cliente de Instagram',
      customerEmail: 'instagram@example.com',
      status: 'Rechazado',
      paymentMethod: 'WhatsApp',
      deliveryType: 'Delivery',
      address: 'San Blas, Cusco',
      reference: 'Frente al mercado',
      subtotal: 29,
      shipping: 12,
      total: 41,
      stockDiscounted: false,
      paymentReportedAt: shiftDate(-2, 17),
      paymentConfirmedAt: '',
      items: [
        {
          productId: 'prod-choco-naranja',
          name: 'Chocolate naranja 70%',
          categoryId: 'cat-chocolate',
          quantity: 2,
          unitPrice: 14.5,
          subtotal: 29,
        },
      ],
      notes: 'Pago no identificado en cuentas.',
    },
  ]

  const kardex = [
    {
      id: 'mov-081',
      date: shiftDate(-8, 10),
      productId: 'prod-cafe-250',
      lot: 'CAF250-A1',
      type: 'Entrada',
      reason: 'Compra',
      quantity: 20,
      stockBefore: 22,
      stockAfter: 42,
      reference: formatSequence('ENTRADA', 39),
      userName: 'Admin Terranegra',
      note: 'Reposición de café molido 250g.',
    },
    {
      id: 'mov-082',
      date: shiftDate(-7, 9),
      productId: 'prod-choco-naranja',
      lot: 'CHNAR-B1',
      type: 'Entrada',
      reason: 'Compra',
      quantity: 18,
      stockBefore: 12,
      stockAfter: 30,
      reference: formatSequence('ENTRADA', 40),
      userName: 'Admin Terranegra',
      note: 'Lote nuevo para campaña de ofertas.',
    },
    {
      id: 'mov-083',
      date: shiftDate(-2, 16),
      productId: 'prod-choco-pasas',
      lot: 'CHPAS-A1',
      type: 'Salida',
      reason: 'Venta',
      quantity: 1,
      stockBefore: 23,
      stockAfter: 22,
      reference: 'POS-000149',
      userName: 'Vendedor Demo',
      note: 'Venta presencial de referencia.',
    },
    {
      id: 'mov-084',
      date: shiftDate(-2, 16),
      productId: 'prod-choco-negro',
      lot: 'CHNEG-A1',
      type: 'Salida',
      reason: 'Venta',
      quantity: 1,
      stockBefore: 41,
      stockAfter: 40,
      reference: 'POS-000149',
      userName: 'Vendedor Demo',
      note: 'Venta presencial de referencia.',
    },
    {
      id: 'mov-085',
      date: shiftDate(-1, 13),
      productId: 'prod-cafe-500',
      lot: 'CAF500-A1',
      type: 'Salida',
      reason: 'Venta',
      quantity: 1,
      stockBefore: 19,
      stockAfter: 18,
      reference: 'ORD-000152',
      userName: 'Vendedor Demo',
      note: 'Pago confirmado en pedido online.',
    },
    {
      id: 'mov-086',
      date: shiftDate(-1, 13),
      productId: 'prod-choco-negro',
      lot: 'CHNEG-A1',
      type: 'Salida',
      reason: 'Venta',
      quantity: 2,
      stockBefore: 42,
      stockAfter: 40,
      reference: 'ORD-000152',
      userName: 'Vendedor Demo',
      note: 'Pedido online entregado.',
    },
    {
      id: 'mov-087',
      date: shiftDate(-1, 13),
      productId: 'prod-nibs-250',
      lot: 'NIB250-A1',
      type: 'Salida',
      reason: 'Venta',
      quantity: 1,
      stockBefore: 21,
      stockAfter: 20,
      reference: 'ORD-000152',
      userName: 'Vendedor Demo',
      note: 'Pedido online entregado.',
    },
  ]

  return {
    businessName: 'Terranegra',
    users,
    categories,
    products,
    lots,
    orders,
    kardex,
    carts: {
      guest: [],
      [customerId]: [],
    },
    config: {
      businessName: 'Terranegra',
      whatsapp: '51987654321',
      yapeNumber: '987654321',
      yapeHolder: 'Terranegra Demo SAC',
      shippingCost: 12,
      maxPendingOrders: 8,
      expiryAlertDays: 30,
      address: 'Calle Portal de Panes 145, Cusco',
    },
    meta: {
      orderSequence: 153,
      entrySequence: 41,
      productSequence: 10,
      categorySequence: 5,
      lotSequence: 13,
      kardexSequence: 88,
    },
  }
}
