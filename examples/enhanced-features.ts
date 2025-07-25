// import { createApp } from 'vue'
import {
  Action,
  AsyncAction,
  AsyncState,
  BaseStore,
  createLDesignStore,
  createStoreClass,
  Getter,
  Performance,
  State,
  Store,
  useAsyncState,
  useStoreHelpers
} from '../src'

// 1. 增强的用户管理 Store
@Store({
  id: 'user',
  persist: { paths: ['currentUser', 'preferences'] },
  timeTravel: { maxHistorySize: 20 },
  performance: { threshold: 100 }
})
class UserStore extends BaseStore {
  @State({ default: null })
  currentUser!: User | null

  @State({ default: [] })
  users!: User[]

  @State({ default: { theme: 'light', language: 'zh-CN' } })
  preferences!: UserPreferences

  // 使用性能监控装饰器
  @Performance({ threshold: 200, trackMemory: true })
  @AsyncState({
    retry: { attempts: 3, delay: 1000 },
    timeout: 5000,
    cache: { ttl: 60000 }
  })
  @AsyncAction()
  async fetchUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }
    const user = await response.json()
    this.currentUser = user
    return user
  }

  @AsyncState({
    retry: { attempts: 2 },
    cache: { ttl: 30000 }
  })
  @AsyncAction()
  async fetchUsers(): Promise<User[]> {
    const response = await fetch('/api/users')
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    const users = await response.json()
    this.users = users
    return users
  }

  @Performance({ threshold: 50 })
  @AsyncAction()
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to update user')
    }

    const updatedUser = await response.json()

    // 更新当前用户
    if (this.currentUser?.id === id) {
      this.currentUser = updatedUser
    }

    // 更新用户列表
    const index = this.users.findIndex(u => u.id === id)
    if (index !== -1) {
      this.users[index] = updatedUser
    }

    return updatedUser
  }

  @Action()
  updatePreferences(preferences: Partial<UserPreferences>) {
    this.preferences = { ...this.preferences, ...preferences }
  }

  @Action()
  logout() {
    this.currentUser = null
      // 创建手动快照用于时间旅行
      ; (this as any).$createSnapshot?.('User logged out')
  }

  @Getter()
  get isLoggedIn(): boolean {
    return this.currentUser !== null
  }

  @Getter()
  get userCount(): number {
    return this.users.length
  }

  @Getter()
  get adminUsers(): User[] {
    return this.users.filter(user => user.role === 'admin')
  }
}

// 2. 购物车 Store 示例
@Store({
  id: 'cart',
  persist: true,
  timeTravel: true,
  performance: true
})
class CartStore extends BaseStore {
  @State({ default: [] })
  items!: CartItem[]

  @State({ default: false })
  isCheckingOut!: boolean

  @AsyncState({
    retry: { attempts: 2, delay: 1000 },
    timeout: 10000,
    onSuccess: (result) => console.log('Checkout successful:', result),
    onError: (error) => console.error('Checkout failed:', error)
  })
  @AsyncAction()
  async checkout(): Promise<Order> {
    this.isCheckingOut = true

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: this.items })
      })

      if (!response.ok) {
        throw new Error('Checkout failed')
      }

      const order = await response.json()
      this.items = [] // 清空购物车
      return order
    } finally {
      this.isCheckingOut = false
    }
  }

  @Action()
  addItem(product: Product, quantity: number = 1) {
    const existingItem = this.items.find(item => item.productId === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      this.items.push({
        productId: product.id,
        product,
        quantity,
        price: product.price
      })
    }
  }

  @Action()
  removeItem(productId: string) {
    const index = this.items.findIndex(item => item.productId === productId)
    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }

  @Action()
  updateQuantity(productId: string, quantity: number) {
    const item = this.items.find(item => item.productId === productId)
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId)
      } else {
        item.quantity = quantity
      }
    }
  }

  @Getter()
  get totalPrice(): number {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  @Getter()
  get itemCount(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0)
  }

  @Getter()
  get isEmpty(): boolean {
    return this.items.length === 0
  }
}

// 3. 类型定义
interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatar?: string
}

interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
}

interface Product {
  id: string
  name: string
  price: number
  description: string
}

interface CartItem {
  productId: string
  product: Product
  quantity: number
  price: number
}

interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
}

// 4. 创建 Store 实例
export const useUserStore = createStoreClass(UserStore)
export const useCartStore = createStoreClass(CartStore)

// 5. Vue 应用设置
export function setupApp() {
  // 动态导入 Vue 以避免类型错误
  const createApp = (globalThis as any).Vue?.createApp || (() => {
    throw new Error('Vue createApp not found')
  })

  const app = createApp({})

  // 使用增强的 LDesign Store
  const store = createLDesignStore({
    devtools: true,
    persist: true,
    timeTravel: true,
    performance: {
      threshold: 100,
      trackMemory: true,
      enableLogging: true
    }
  })

  app.use(store)

  return { app, store }
}

// 6. 组合式函数示例
export function useUserManagement() {
  const userStore = useUserStore()
  const helpers = useStoreHelpers(userStore)

  // 使用异步状态管理
  const {
    data: searchResults,
    loading: isSearching,
    execute: search
  } = useAsyncState(async () => {
    const response = await fetch('/api/users/search')
    return response.json()
  }, {
    cache: { ttl: 30000 },
    debounce: 300
  })

  return {
    // Store 状态
    currentUser: userStore.currentUser,
    users: userStore.users,
    isLoggedIn: userStore.isLoggedIn,

    // Store 操作
    fetchUser: userStore.fetchUser,
    updateUser: userStore.updateUser,
    logout: userStore.logout,

    // 辅助函数
    isLoading: helpers.isLoading,
    getError: helpers.getError,
    clearError: helpers.clearError,

    // 异步搜索
    searchResults,
    isSearching,
    search,

    // 时间旅行
    undo: (userStore as any).$undo,
    redo: (userStore as any).$redo,
    canUndo: (userStore as any).$canUndo,
    canRedo: (userStore as any).$canRedo,

    // 性能监控
    getPerformanceReport: (userStore as any).$getPerformanceReport,
    clearPerformanceData: (userStore as any).$clearPerformanceData
  }
}
