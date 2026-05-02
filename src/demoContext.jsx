/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { createDemoState } from './demoData'
import {
  buildCartLines,
  buildSummary,
  createLineItem,
  formatSequence,
  generateId,
  getCartOwnerKey,
  getDisplayPrice,
  getInventorySnapshot,
  getNextOrderStatus,
  parseNumber,
  playSoftBeep,
} from './demoHelpers'

const STATE_KEY = 'terranegra_demo_state_v1'
const SESSION_KEY = 'terranegra_demo_session_v1'
const DemoContext = createContext(null)

function readInitialStore() {
  const fallback = createDemoState()

  if (typeof window === 'undefined') {
    return {
      state: fallback,
      session: null,
    }
  }

  let state = fallback

  try {
    const storedState = window.localStorage.getItem(STATE_KEY)
    if (storedState) {
      state = JSON.parse(storedState)
    } else {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(fallback))
    }
  } catch {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(fallback))
  }

  let session = null

  try {
    const storedSession = window.localStorage.getItem(SESSION_KEY)
    if (storedSession) {
      const parsed = JSON.parse(storedSession)
      const isValid = state.users.some((user) => user.id === parsed.userId && user.role === parsed.role)
      if (isValid) {
        session = parsed
      }
    }
  } catch {
    session = null
  }

  return { state, session }
}

function cloneState(value) {
  return structuredClone(value)
}

function resolveUserName(session, state) {
  if (!session) {
    return 'Sistema demo'
  }

  const user = state.users.find((item) => item.id === session.userId)
  return user?.name ?? 'Sistema demo'
}

function allocateStock(draft, item, reference, userName, note) {
  const product = draft.products.find((entry) => entry.id === item.productId)
  if (!product) {
    throw new Error('Producto no encontrado.')
  }

  if (product.stock < item.quantity) {
    throw new Error(`Stock insuficiente para ${item.name}.`)
  }

  const productLots = draft.lots
    .filter((lot) => lot.productId === item.productId && lot.quantity > 0)
    .sort((first, second) => new Date(first.expiresAt) - new Date(second.expiresAt))

  let quantityLeft = item.quantity

  for (const lot of productLots) {
    if (quantityLeft <= 0) {
      break
    }

    const taken = Math.min(quantityLeft, lot.quantity)
    const stockBefore = product.stock

    product.stock -= taken
    lot.quantity -= taken
    quantityLeft -= taken

    draft.kardex.unshift({
      id: `mov-${draft.meta.kardexSequence}`,
      date: new Date().toISOString(),
      productId: item.productId,
      lot: lot.code,
      type: 'Salida',
      reason: 'Venta',
      quantity: taken,
      stockBefore,
      stockAfter: product.stock,
      reference,
      userName,
      note,
    })
    draft.meta.kardexSequence += 1
  }

  if (quantityLeft > 0) {
    throw new Error(`No hay lotes suficientes para ${item.name}.`)
  }
}

function ensureCartEntry(draft, cartKey, productId) {
  if (!draft.carts[cartKey]) {
    draft.carts[cartKey] = []
  }

  let entry = draft.carts[cartKey].find((item) => item.productId === productId)

  if (!entry) {
    entry = { productId, quantity: 0 }
    draft.carts[cartKey].push(entry)
  }

  return entry
}

export function DemoProvider({ children }) {
  const initialStore = readInitialStore()
  const [state, setState] = useState(initialStore.state)
  const [session, setSession] = useState(initialStore.session)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(SESSION_KEY)
    }
  }, [session])

  function pushToast(message, tone = 'info') {
    const id = generateId('toast')
    setToasts((current) => [...current, { id, message, tone }])

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3600)
  }

  function updateState(recipe) {
    setState((current) => {
      const draft = cloneState(current)
      recipe(draft, current)
      return draft
    })
  }

  const currentUser = session ? state.users.find((user) => user.id === session.userId) ?? null : null
  const cartKey = getCartOwnerKey(session)
  const rawCart = state.carts[cartKey] ?? []
  const cartItems = buildCartLines(rawCart, state.products)
  const cartSummary = buildSummary(cartItems)
  const customerOrders = currentUser?.role === 'customer'
    ? state.orders.filter((order) => order.customerId === currentUser.id)
    : []

  function login(email, password) {
    const normalizedEmail = String(email).trim().toLowerCase()
    const user = state.users.find(
      (entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === password,
    )

    if (!user) {
      pushToast('Credenciales demo incorrectas.', 'danger')
      return { ok: false }
    }

    setSession({
      userId: user.id,
      role: user.role,
    })
    pushToast(`Bienvenido, ${user.name}.`, 'success')

    return {
      ok: true,
      role: user.role,
    }
  }

  function logout() {
    setSession(null)
    pushToast('Sesión demo cerrada.', 'info')
  }

  function addToCart(productId, quantity = 1) {
    const product = state.products.find((entry) => entry.id === productId)
    if (!product || !product.active) {
      pushToast('Este producto no está disponible.', 'danger')
      return { ok: false }
    }

    if (product.stock <= 0) {
      pushToast('Producto agotado en la demo.', 'danger')
      return { ok: false }
    }

    let finalQuantity = 0

    updateState((draft) => {
      const entry = ensureCartEntry(draft, cartKey, productId)
      const nextQuantity = Math.min(product.stock, entry.quantity + quantity)
      entry.quantity = nextQuantity
      finalQuantity = entry.quantity
    })

    pushToast('Producto agregado a tu carrito.', 'success')
    return { ok: true, product, quantity: finalQuantity }
  }

  function updateCartQuantity(productId, nextQuantity) {
    updateState((draft) => {
      const entries = draft.carts[cartKey] ?? []
      const product = draft.products.find((entry) => entry.id === productId)
      const safeQuantity = Math.max(0, Math.min(parseNumber(nextQuantity, 0), product?.stock ?? 0))
      const target = entries.find((entry) => entry.productId === productId)

      if (!target) {
        return
      }

      if (safeQuantity <= 0) {
        draft.carts[cartKey] = entries.filter((entry) => entry.productId !== productId)
      } else {
        target.quantity = safeQuantity
      }
    })
  }

  function clearCart() {
    updateState((draft) => {
      draft.carts[cartKey] = []
    })
  }

  function createWhatsAppOrder({ deliveryType, address, reference }) {
    if (currentUser?.role !== 'customer') {
      pushToast('Debes iniciar sesión como cliente para generar el pedido.', 'warning')
      return null
    }

    if (!cartItems.length) {
      pushToast('Tu carrito está vacío.', 'warning')
      return null
    }

    let createdOrder = null

    updateState((draft) => {
      const shipping = deliveryType === 'Delivery' ? draft.config.shippingCost : 0
      const items = cartItems.map((line) => createLineItem(line.product, line.quantity))
      const summary = buildSummary(items, shipping)
      const number = formatSequence('ORD', draft.meta.orderSequence)

      createdOrder = {
        id: generateId('order'),
        number,
        date: new Date().toISOString(),
        channel: 'online',
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        status: 'Pendiente de pago',
        paymentMethod: 'WhatsApp',
        deliveryType,
        address: deliveryType === 'Delivery' ? address : '',
        reference: deliveryType === 'Delivery' ? reference : '',
        subtotal: summary.subtotal,
        shipping: summary.shipping,
        total: summary.total,
        stockDiscounted: false,
        paymentReportedAt: '',
        paymentConfirmedAt: '',
        items,
        notes: 'Pedido creado desde checkout demo.',
      }

      draft.meta.orderSequence += 1
      draft.orders.unshift(createdOrder)
      draft.carts[currentUser.id] = []
    })

    pushToast(`Pedido ${createdOrder.number} generado en la demo.`, 'success')
    return createdOrder
  }

  function markOrderPaid(orderId) {
    let updatedOrder = null

    updateState((draft) => {
      const order = draft.orders.find((entry) => entry.id === orderId)
      if (!order || order.status !== 'Pendiente de pago') {
        return
      }

      order.status = 'Pendiente de verificación'
      order.paymentReportedAt = new Date().toISOString()
      updatedOrder = order
    })

    if (updatedOrder) {
      pushToast('Tu pago fue informado. El vendedor lo validará manualmente.', 'success')
    }
  }

  function confirmOrderPayment(orderId) {
    let confirmedOrder = null

    try {
      updateState((draft) => {
        const order = draft.orders.find((entry) => entry.id === orderId)
        if (!order) {
          return
        }

        const userName = resolveUserName(session, draft)

        if (!order.stockDiscounted) {
          order.items.forEach((item) => {
            allocateStock(draft, item, order.number, userName, 'Venta online confirmada')
          })
          order.stockDiscounted = true
        }

        order.status = 'Pago recibido'
        order.paymentConfirmedAt = new Date().toISOString()
        confirmedOrder = order
      })
    } catch (error) {
      pushToast(error.message, 'danger')
      return
    }

    if (confirmedOrder) {
      pushToast(`Pago confirmado para ${confirmedOrder.number}.`, 'success')
    }
  }

  function rejectOrderPayment(orderId) {
    let rejectedOrder = null

    updateState((draft) => {
      const order = draft.orders.find((entry) => entry.id === orderId)
      if (!order) {
        return
      }

      order.status = 'Rechazado'
      rejectedOrder = order
    })

    if (rejectedOrder) {
      pushToast(`Pago rechazado para ${rejectedOrder.number}.`, 'warning')
    }
  }

  function advanceOrder(orderId) {
    let movedOrder = null

    updateState((draft) => {
      const order = draft.orders.find((entry) => entry.id === orderId)
      if (!order) {
        return
      }

      const nextStatus = getNextOrderStatus(order)
      if (!nextStatus) {
        return
      }

      order.status = nextStatus
      movedOrder = order
    })

    if (movedOrder) {
      pushToast(`Pedido ${movedOrder.number} actualizado a ${movedOrder.status}.`, 'success')
    }
  }

  function simulateNewOrder() {
    const availableProducts = state.products.filter((product) => product.active && product.stock > 0)
    if (!availableProducts.length) {
      pushToast('No hay productos con stock para simular un pedido.', 'warning')
      return
    }

    const selected = availableProducts.slice(0, 2)
    let simulatedOrder = null

    updateState((draft) => {
      const items = selected.map((product, index) => createLineItem(product, index === 0 ? 2 : 1))
      const summary = buildSummary(items, draft.config.shippingCost)
      const number = formatSequence('ORD', draft.meta.orderSequence)

      simulatedOrder = {
        id: generateId('order'),
        number,
        date: new Date().toISOString(),
        channel: 'online',
        customerId: null,
        customerName: 'Cliente web demo',
        customerEmail: 'webdemo@cliente.com',
        status: 'Pendiente de pago',
        paymentMethod: 'WhatsApp',
        deliveryType: 'Delivery',
        address: 'Dirección simulada demo',
        reference: 'Pedido generado desde dashboard',
        subtotal: summary.subtotal,
        shipping: summary.shipping,
        total: summary.total,
        stockDiscounted: false,
        paymentReportedAt: '',
        paymentConfirmedAt: '',
        items,
        notes: 'Pedido generado desde el botón Simular nuevo pedido.',
      }

      draft.meta.orderSequence += 1
      draft.orders.unshift(simulatedOrder)
    })

    playSoftBeep()
    pushToast('Nuevo pedido recibido.', 'success')
    return simulatedOrder
  }

  function registerInventoryEntry({ productId, quantity, lotCode, expiresAt, cost, note }) {
    const safeQuantity = parseNumber(quantity, 0)
    const safeCost = parseNumber(cost, 0)

    if (safeQuantity <= 0) {
      pushToast('La cantidad debe ser mayor a cero.', 'warning')
      return
    }

    updateState((draft) => {
      const product = draft.products.find((entry) => entry.id === productId)
      if (!product) {
        return
      }

      const stockBefore = product.stock
      product.stock += safeQuantity

      draft.lots.push({
        id: `lot-${draft.meta.lotSequence}`,
        productId,
        code: lotCode || `LOTE-${draft.meta.lotSequence}`,
        quantity: safeQuantity,
        expiresAt,
        cost: safeCost,
      })

      draft.kardex.unshift({
        id: `mov-${draft.meta.kardexSequence}`,
        date: new Date().toISOString(),
        productId,
        lot: lotCode || `LOTE-${draft.meta.lotSequence}`,
        type: 'Entrada',
        reason: 'Compra',
        quantity: safeQuantity,
        stockBefore,
        stockAfter: product.stock,
        reference: formatSequence('ENTRADA', draft.meta.entrySequence),
        userName: resolveUserName(session, draft),
        note,
      })

      draft.meta.entrySequence += 1
      draft.meta.lotSequence += 1
      draft.meta.kardexSequence += 1
    })

    pushToast('Entrada registrada en inventario demo.', 'success')
  }

  function createPosSale({ items, paymentMethod, customerName }) {
    if (!items.length) {
      pushToast('Agrega productos al carrito POS.', 'warning')
      return null
    }

    let createdOrder = null

    try {
      updateState((draft) => {
        const orderItems = items.map(({ productId, quantity }) => {
          const product = draft.products.find((entry) => entry.id === productId)
          if (!product) {
            throw new Error('Producto no encontrado en POS.')
          }

          if (quantity > product.stock) {
            throw new Error(`Stock insuficiente para ${product.name}.`)
          }

          return createLineItem(product, quantity)
        })

        const summary = buildSummary(orderItems, 0)
        const number = formatSequence('POS', draft.meta.orderSequence)
        const userName = resolveUserName(session, draft)

        orderItems.forEach((item) => {
          allocateStock(draft, item, number, userName, 'Venta presencial confirmada')
        })

        createdOrder = {
          id: generateId('order'),
          number,
          date: new Date().toISOString(),
          channel: 'presencial',
          customerId: null,
          customerName: customerName || 'Cliente mostrador',
          customerEmail: '',
          status: 'Completado',
          paymentMethod,
          deliveryType: 'Venta presencial',
          address: '',
          reference: '',
          subtotal: summary.subtotal,
          shipping: 0,
          total: summary.total,
          stockDiscounted: true,
          paymentReportedAt: new Date().toISOString(),
          paymentConfirmedAt: new Date().toISOString(),
          items: orderItems,
          notes: 'Comprobante interno sin validez tributaria.',
        }

        draft.meta.orderSequence += 1
        draft.orders.unshift(createdOrder)
      })
    } catch (error) {
      pushToast(error.message, 'danger')
      return null
    }

    pushToast(`Venta presencial ${createdOrder.number} registrada.`, 'success')
    return createdOrder
  }

  function saveProduct(payload) {
    const price = parseNumber(payload.price, 0)
    const minStock = parseNumber(payload.minStock, 0)

    updateState((draft) => {
      const existing = draft.products.find((product) => product.id === payload.id)

      if (existing) {
        existing.name = payload.name
        existing.categoryId = payload.categoryId
        existing.price = price
        existing.minStock = minStock
        existing.description = payload.description
        existing.sku = payload.sku
        existing.featured = Boolean(payload.featured)
      } else {
        draft.products.unshift({
          id: `prod-${draft.meta.productSequence}`,
          name: payload.name,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
          categoryId: payload.categoryId,
          price,
          stock: 0,
          minStock,
          featured: Boolean(payload.featured),
          active: true,
          description: payload.description,
          sku: payload.sku,
          offer: {
            enabled: false,
            price: '',
            startDate: '',
            endDate: '',
          },
          image: payload.image,
        })

        draft.meta.productSequence += 1
      }
    })

    pushToast('Producto demo guardado.', 'success')
  }

  function toggleProduct(productId) {
    updateState((draft) => {
      const product = draft.products.find((entry) => entry.id === productId)
      if (product) {
        product.active = !product.active
      }
    })
  }

  function saveCategory(payload) {
    updateState((draft) => {
      const existing = draft.categories.find((category) => category.id === payload.id)

      if (existing) {
        existing.name = payload.name
        existing.description = payload.description
      } else {
        draft.categories.unshift({
          id: `cat-${draft.meta.categorySequence}`,
          name: payload.name,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
          description: payload.description,
          active: true,
        })

        draft.meta.categorySequence += 1
      }
    })

    pushToast('Categoría demo guardada.', 'success')
  }

  function toggleCategory(categoryId) {
    updateState((draft) => {
      const category = draft.categories.find((entry) => entry.id === categoryId)
      if (category) {
        category.active = !category.active
      }
    })
  }

  function saveOffer(payload) {
    updateState((draft) => {
      const product = draft.products.find((entry) => entry.id === payload.productId)
      if (!product) {
        return
      }

      product.offer = {
        enabled: Boolean(payload.enabled),
        price: parseNumber(payload.price, 0),
        startDate: payload.startDate,
        endDate: payload.endDate,
      }
    })

    pushToast('Oferta demo actualizada.', 'success')
  }

  function updateConfig(payload) {
    updateState((draft) => {
      draft.config = {
        ...draft.config,
        ...payload,
        shippingCost: parseNumber(payload.shippingCost, draft.config.shippingCost),
        maxPendingOrders: parseNumber(payload.maxPendingOrders, draft.config.maxPendingOrders),
        expiryAlertDays: parseNumber(payload.expiryAlertDays, draft.config.expiryAlertDays),
      }
    })

    pushToast('Configuración demo guardada.', 'success')
  }

  function resetDemoData() {
    const freshState = createDemoState()
    setState(freshState)

    if (session) {
      setSession({
        userId: session.userId,
        role: session.role,
      })
    }

    pushToast('Datos demo restablecidos.', 'success')
  }

  function simulateWhatsApp(message) {
    pushToast(message || 'Se generó el mensaje de WhatsApp de forma simulada.', 'info')
  }

  const inventorySnapshots = state.products.map((product) => ({
    productId: product.id,
    ...getInventorySnapshot(product, state.lots, state.config.expiryAlertDays),
  }))

  const value = {
    state,
    session,
    currentUser,
    cartItems,
    cartSummary,
    customerOrders,
    inventorySnapshots,
    toasts,
    pushToast,
    login,
    logout,
    addToCart,
    updateCartQuantity,
    clearCart,
    createWhatsAppOrder,
    markOrderPaid,
    confirmOrderPayment,
    rejectOrderPayment,
    advanceOrder,
    simulateNewOrder,
    registerInventoryEntry,
    createPosSale,
    saveProduct,
    toggleProduct,
    saveCategory,
    toggleCategory,
    saveOffer,
    updateConfig,
    resetDemoData,
    simulateWhatsApp,
    getDisplayPrice,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo debe usarse dentro de DemoProvider')
  }

  return context
}
