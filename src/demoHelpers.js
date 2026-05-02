const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const paidLikeStatuses = new Set([
  'Pago recibido',
  'En preparación',
  'Listo para recoger',
  'Enviado',
  'Entregado',
  'Completado',
])

const pendingLikeStatuses = new Set([
  'Pendiente de pago',
  'Pendiente de verificación',
  'Pago recibido',
  'En preparación',
  'Listo para recoger',
  'Enviado',
])

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value ?? 0))
}

export function formatDate(value) {
  if (!value) {
    return 'Sin fecha'
  }

  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) {
    return 'Sin fecha'
  }

  return dateTimeFormatter.format(new Date(value))
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function parseNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getOfferPrice(product) {
  if (!product?.offer?.enabled) {
    return null
  }

  return Number(product.offer.price)
}

export function getDisplayPrice(product) {
  return getOfferPrice(product) ?? Number(product.price)
}

export function getCartOwnerKey(session) {
  return session?.role === 'customer' ? session.userId : 'guest'
}

export function buildCartLines(rawCart, products) {
  return rawCart
    .map((entry) => {
      const product = products.find((item) => item.id === entry.productId)
      if (!product) {
        return null
      }

      const unitPrice = getDisplayPrice(product)
      const quantity = Number(entry.quantity)

      return {
        product,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
      }
    })
    .filter(Boolean)
}

export function buildSummary(lines, shipping = 0) {
  const subtotal = lines.reduce((accumulator, line) => accumulator + line.subtotal, 0)
  const total = subtotal + Number(shipping)

  return {
    subtotal,
    shipping: Number(shipping),
    total,
  }
}

export function createLineItem(product, quantity) {
  const unitPrice = getDisplayPrice(product)

  return {
    productId: product.id,
    name: product.name,
    categoryId: product.categoryId,
    quantity,
    unitPrice,
    subtotal: quantity * unitPrice,
    image: product.image,
  }
}

export function generateId(prefix) {
  const suffix = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${suffix}`
}

export function formatSequence(prefix, sequence) {
  return `${prefix}-${String(sequence).padStart(6, '0')}`
}

export function getNextOrderStatus(order) {
  if (order.channel === 'presencial') {
    return null
  }

  if (order.status === 'Pago recibido') {
    return 'En preparación'
  }

  if (order.status === 'En preparación') {
    return order.deliveryType === 'Recojo en tienda' ? 'Listo para recoger' : 'Enviado'
  }

  if (order.status === 'Listo para recoger' || order.status === 'Enviado') {
    return 'Entregado'
  }

  if (order.status === 'Entregado') {
    return 'Completado'
  }

  return null
}

export function getInventorySnapshot(product, lots, alertDays) {
  const productLots = lots
    .filter((lot) => lot.productId === product.id && lot.quantity > 0)
    .sort((first, second) => new Date(first.expiresAt) - new Date(second.expiresAt))

  const nextLot = productLots[0] ?? null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let status = 'OK'
  let tone = 'neutral'
  let daysToExpiry = null

  if (product.stock <= 0) {
    status = 'Agotado'
    tone = 'danger'
  } else if (nextLot) {
    const expiryDate = new Date(nextLot.expiresAt)
    expiryDate.setHours(0, 0, 0, 0)
    daysToExpiry = Math.round((expiryDate - today) / 86400000)

    if (daysToExpiry < 0) {
      status = 'Vencido'
      tone = 'danger'
    } else if (daysToExpiry <= Number(alertDays)) {
      status = 'Próximo a vencer'
      tone = 'warning'
    }
  }

  if (status === 'OK') {
    if (product.stock <= Math.max(1, Math.floor(product.minStock / 2))) {
      status = 'Crítico'
      tone = 'danger'
    } else if (product.stock <= product.minStock) {
      status = 'Bajo'
      tone = 'warning'
    }
  }

  return {
    nextLot,
    nextExpiry: nextLot?.expiresAt ?? null,
    status,
    tone,
    daysToExpiry,
  }
}

export function isPaidLikeStatus(status) {
  return paidLikeStatuses.has(status)
}

export function isPendingLikeStatus(status) {
  return pendingLikeStatuses.has(status)
}

export function getRoleLabel(role) {
  if (role === 'seller') {
    return 'Vendedor'
  }

  if (role === 'admin') {
    return 'Administrador'
  }

  return 'Cliente'
}

export function getChannelLabel(channel) {
  return channel === 'presencial' ? 'Venta presencial' : 'Tienda web'
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function sortByDateDesc(items, selector = (item) => item.date) {
  return [...items].sort((first, second) => new Date(selector(second)) - new Date(selector(first)))
}

export function salesByProduct(orders) {
  const registry = {}

  orders.forEach((order) => {
    if (!order.stockDiscounted) {
      return
    }

    order.items.forEach((item) => {
      if (!registry[item.productId]) {
        registry[item.productId] = {
          productId: item.productId,
          name: item.name,
          quantity: 0,
          revenue: 0,
        }
      }

      registry[item.productId].quantity += item.quantity
      registry[item.productId].revenue += item.subtotal
    })
  })

  return Object.values(registry).sort((first, second) => second.quantity - first.quantity)
}

export function playSoftBeep() {
  if (typeof window === 'undefined' || !window.AudioContext) {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  gainNode.gain.setValueAtTime(0.001, context.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.04, context.currentTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.23)
}
