import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  Action,
  AsyncAction,
  BaseStore,
  Cache,
  Debounce,
  Getter,
  State,
  Store,
  createStoreClass,
} from '@ldesign/store'

// 1. 基础用法示例
@Store({ id: 'counter' })
class CounterStore extends BaseStore {
  @State({ default: 0 })
  count!: number

  @Action()
  increment() {
    this.count++
  }

  @Action()
  decrement() {
    this.count--
  }

  @Action()
  incrementBy(amount: number) {
    this.count += amount
  }

  @Getter()
  get doubleCount() {
    return this.count * 2
  }

  @Getter()
  get isEven() {
    return this.count % 2 === 0
  }
}

// 2. 用户管理示例
interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

@Store({
  id: 'user',
  persist: {
    paths: ['currentUser', 'preferences'],
  },
})
class UserStore extends BaseStore {
  @State({ default: null })
  currentUser!: User | null

  @State({ default: [] })
  users!: User[]

  @State({ default: { theme: 'light', language: 'en' } })
  preferences!: { theme: string, language: string }

  @AsyncAction()
  async login(email: string, password: string) {
    // 模拟 API 调用
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const user = await response.json()
    this.currentUser = user
    return user
  }

  @Action()
  logout() {
    this.currentUser = null
  }

  @AsyncAction()
  async fetchUsers() {
    const response = await fetch('/api/users')
    const users = await response.json()
    this.users = users
    return users
  }

  @Action()
  updatePreferences(preferences: Partial<{ theme: string, language: string }>) {
    this.preferences = { ...this.preferences, ...preferences }
  }

  @Getter()
  get isLoggedIn() {
    return this.currentUser !== null
  }

  @Getter()
  get userCount() {
    return this.users.length
  }

  @Cache(5000) // 缓存 5 秒
  @Getter()
  get activeUsers() {
    return this.users.filter(user => user.id !== this.currentUser?.id)
  }
}

// 3. 购物车示例
interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image?: string
}

@Store({
  id: 'cart',
  persist: true,
})
class CartStore extends BaseStore {
  @State({ default: [] })
  items!: CartItem[]

  @State({ default: 0 })
  discount!: number

  @Action()
  addItem(product: Omit<CartItem, 'quantity'>, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    }
 else {
      this.items.push({ ...product, quantity })
    }
  }

  @Action()
  removeItem(productId: number) {
    const index = this.items.findIndex(item => item.id === productId)
    if (index > -1) {
      this.items.splice(index, 1)
    }
  }

  @Action()
  updateQuantity(productId: number, quantity: number) {
    const item = this.items.find(item => item.id === productId)
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId)
      }
 else {
        item.quantity = quantity
      }
    }
  }

  @Action()
  clearCart() {
    this.items = []
    this.discount = 0
  }

  @Action()
  applyDiscount(amount: number) {
    this.discount = Math.max(0, amount)
  }

  @Getter()
  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  @Getter()
  get subtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  @Getter()
  get total() {
    return Math.max(0, this.subtotal - this.discount)
  }

  @Getter()
  get isEmpty() {
    return this.items.length === 0
  }
}

// 4. 通知系统示例
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  timestamp: number
}

@Store({ id: 'notifications' })
class NotificationStore extends BaseStore {
  @State({ default: [] })
  notifications!: Notification[]

  @Action()
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const id = Date.now().toString()
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    }

    this.notifications.push(newNotification)

    // 自动移除通知
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000
      setTimeout(() => {
        this.removeNotification(id)
      }, duration)
    }

    return id
  }

  @Action()
  removeNotification(id: string) {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.splice(index, 1)
    }
  }

  @Debounce(100)
  @Action()
  clearAll() {
    this.notifications = []
  }

  @Action()
  success(title: string, message: string, duration?: number) {
    return this.addNotification({ type: 'success', title, message, duration })
  }

  @Action()
  error(title: string, message: string, duration?: number) {
    return this.addNotification({ type: 'error', title, message, duration })
  }

  @Action()
  info(title: string, message: string, duration?: number) {
    return this.addNotification({ type: 'info', title, message, duration })
  }

  @Action()
  warning(title: string, message: string, duration?: number) {
    return this.addNotification({ type: 'warning', title, message, duration })
  }

  @Getter()
  get count() {
    return this.notifications.length
  }

  @Getter()
  get hasNotifications() {
    return this.notifications.length > 0
  }
}

// 创建 store 实例
export const useCounterStore = createStoreClass(CounterStore)
export const useUserStore = createStoreClass(UserStore)
export const useCartStore = createStoreClass(CartStore)
export const useNotificationStore = createStoreClass(NotificationStore)

// Vue 应用设置示例
export function setupApp() {
  const app = createApp({})
  const pinia = createPinia()

  app.use(pinia)

  return { app, pinia }
}

// 使用示例
export function exampleUsage() {
  const counterStore = useCounterStore()
  const userStore = useUserStore()
  const cartStore = useCartStore()
  const notificationStore = useNotificationStore()

  // 计数器操作
  console.log('Initial count:', counterStore.count) // 0
  counterStore.increment()
  console.log('After increment:', counterStore.count) // 1
  console.log('Double count:', counterStore.doubleCount) // 2

  // 用户操作
  userStore.login('user@example.com', 'password')
    .then((user) => {
      console.log('Logged in user:', user)
      notificationStore.success('Welcome!', `Hello ${user.name}`)
    })
    .catch((error) => {
      console.error('Login failed:', error)
      notificationStore.error('Login Failed', error.message)
    })

  // 购物车操作
  cartStore.addItem({ id: 1, name: 'Product 1', price: 29.99 }, 2)
  cartStore.addItem({ id: 2, name: 'Product 2', price: 19.99 }, 1)
  console.log('Cart total:', cartStore.total) // 79.97
  console.log('Total items:', cartStore.totalItems) // 3

  // 状态订阅
  const unsubscribe = cartStore.$subscribe((mutation, state) => {
    console.log('Cart changed:', mutation.type, state)

    if (cartStore.totalItems > 5) {
      notificationStore.warning('Cart Full', 'You have many items in your cart')
    }
  })

  // 清理
  return () => {
    unsubscribe()
  }
}
