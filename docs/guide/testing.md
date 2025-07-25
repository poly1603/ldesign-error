# 测试指南

@ldesign/store 设计时充分考虑了测试友好性，提供了简洁的 API 和良好的可测试性。本章将介绍如何有效地测试你的 Store。

## 基础测试设置

### 测试环境配置

```typescript
// test-setup.ts
import { beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  // 每个测试前创建新的 Pinia 实例
  setActivePinia(createPinia())
})
```

### 基础测试示例

```typescript
// counter.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCounterStore } from './counter'

describe('CounterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default state', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })

  it('should increment count', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
  })

  it('should increment by specific amount', () => {
    const store = useCounterStore()
    store.incrementBy(5)
    expect(store.count).toBe(5)
  })

  it('should calculate double count correctly', () => {
    const store = useCounterStore()
    store.incrementBy(3)
    expect(store.doubleCount).toBe(6)
  })
})
```

## 测试状态管理

### 状态初始化测试

```typescript
@Store({ id: 'user-test' })
class UserStore extends BaseStore {
  @State({ default: null })
  currentUser!: User | null

  @State({ default: [] })
  users!: User[]

  @State({ default: { theme: 'light', language: 'en' } })
  preferences!: { theme: string, language: string }
}

describe('UserStore State', () => {
  it('should initialize with correct default values', () => {
    const store = useUserStore()

    expect(store.currentUser).toBeNull()
    expect(store.users).toEqual([])
    expect(store.preferences).toEqual({
      theme: 'light',
      language: 'en'
    })
  })

  it('should update state correctly', () => {
    const store = useUserStore()
    const user = { id: 1, name: 'John', email: 'john@example.com' }

    store.currentUser = user
    expect(store.currentUser).toEqual(user)
  })
})
```

### 复杂状态测试

```typescript
describe('Complex State Management', () => {
  it('should handle nested state updates', () => {
    const store = useUserStore()

    // 测试嵌套对象更新
    store.preferences.theme = 'dark'
    expect(store.preferences.theme).toBe('dark')
    expect(store.preferences.language).toBe('en') // 其他属性不变
  })

  it('should handle array operations', () => {
    const store = useUserStore()
    const users = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' }
    ]

    store.users = users
    expect(store.users).toHaveLength(2)
    expect(store.users[0].name).toBe('John')
  })
})
```

## 测试 Actions

### 同步 Actions 测试

```typescript
@Store({ id: 'cart-test' })
class CartStore extends BaseStore {
  @State({ default: [] })
  items!: CartItem[]

  @Action()
  addItem(item: CartItem) {
    const existingItem = this.items.find(i => i.id === item.id)
    if (existingItem) {
      existingItem.quantity += item.quantity
    }
 else {
      this.items.push(item)
    }
  }

  @Action()
  removeItem(itemId: number) {
    const index = this.items.findIndex(i => i.id === itemId)
    if (index > -1) {
      this.items.splice(index, 1)
    }
  }

  @Action()
  clearCart() {
    this.items = []
  }
}

describe('CartStore Actions', () => {
  it('should add new item to cart', () => {
    const store = useCartStore()
    const item = { id: 1, name: 'Product 1', price: 10, quantity: 2 }

    store.addItem(item)

    expect(store.items).toHaveLength(1)
    expect(store.items[0]).toEqual(item)
  })

  it('should update quantity for existing item', () => {
    const store = useCartStore()
    const item = { id: 1, name: 'Product 1', price: 10, quantity: 2 }

    store.addItem(item)
    store.addItem({ ...item, quantity: 3 })

    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(5)
  })

  it('should remove item from cart', () => {
    const store = useCartStore()
    const item = { id: 1, name: 'Product 1', price: 10, quantity: 2 }

    store.addItem(item)
    store.removeItem(1)

    expect(store.items).toHaveLength(0)
  })

  it('should clear all items', () => {
    const store = useCartStore()
    store.addItem({ id: 1, name: 'Product 1', price: 10, quantity: 2 })
    store.addItem({ id: 2, name: 'Product 2', price: 20, quantity: 1 })

    store.clearCart()

    expect(store.items).toHaveLength(0)
  })
})
```

### 异步 Actions 测试

```typescript
// 模拟 API
const mockApi = {
  getUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn()
}

@Store({ id: 'async-test' })
class AsyncStore extends BaseStore {
  @State({ default: null })
  user!: User | null

  @AsyncAction()
  async fetchUser(id: number) {
    const user = await mockApi.getUser(id)
    this.user = user
    return user
  }

  @AsyncAction()
  async updateUser(userData: Partial<User>) {
    const updatedUser = await mockApi.updateUser(userData)
    this.user = updatedUser
    return updatedUser
  }
}

describe('Async Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user successfully', async () => {
    const store = useAsyncStore()
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' }

    mockApi.getUser.mockResolvedValue(mockUser)

    const result = await store.fetchUser(1)

    expect(mockApi.getUser).toHaveBeenCalledWith(1)
    expect(store.user).toEqual(mockUser)
    expect(result).toEqual(mockUser)
  })

  it('should handle fetch user error', async () => {
    const store = useAsyncStore()
    const error = new Error('User not found')

    mockApi.getUser.mockRejectedValue(error)

    await expect(store.fetchUser(999)).rejects.toThrow('User not found')
    expect(store.user).toBeNull()
  })

  it('should track loading state', async () => {
    const store = useAsyncStore()
    mockApi.getUser.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ id: 1, name: 'John' }), 100))
    )

    expect(store.$isLoading('fetchUser')).toBe(false)

    const promise = store.fetchUser(1)
    expect(store.$isLoading('fetchUser')).toBe(true)

    await promise
    expect(store.$isLoading('fetchUser')).toBe(false)
  })

  it('should track error state', async () => {
    const store = useAsyncStore()
    const error = new Error('Network error')

    mockApi.getUser.mockRejectedValue(error)

    try {
      await store.fetchUser(1)
    }
 catch (e) {
      // 忽略错误
    }

    expect(store.$getError('fetchUser')).toEqual(error)
  })
})
```

## 测试 Getters

### 基础 Getters 测试

```typescript
@Store({ id: 'getter-test' })
class GetterTestStore extends BaseStore {
  @State({ default: '' })
  firstName!: string

  @State({ default: '' })
  lastName!: string

  @State({ default: [] })
  items!: { price: number, quantity: number }[]

  @Getter()
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim()
  }

  @Getter()
  get totalPrice() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  @Getter()
  get hasItems() {
    return this.items.length > 0
  }
}

describe('Getters', () => {
  it('should compute full name correctly', () => {
    const store = useGetterTestStore()

    store.firstName = 'John'
    store.lastName = 'Doe'

    expect(store.fullName).toBe('John Doe')
  })

  it('should handle empty names', () => {
    const store = useGetterTestStore()

    expect(store.fullName).toBe('')

    store.firstName = 'John'
    expect(store.fullName).toBe('John')
  })

  it('should calculate total price', () => {
    const store = useGetterTestStore()

    store.items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ]

    expect(store.totalPrice).toBe(35)
  })

  it('should check if has items', () => {
    const store = useGetterTestStore()

    expect(store.hasItems).toBe(false)

    store.items = [{ price: 10, quantity: 1 }]
    expect(store.hasItems).toBe(true)
  })
})
```

### 缓存 Getters 测试

```typescript
describe('Cached Getters', () => {
  it('should cache expensive computations', () => {
    const store = useGetterTestStore()
    const computeSpy = vi.spyOn(console, 'log')

    // 假设 expensiveComputation 会打印日志
    store.expensiveComputation
    store.expensiveComputation

    // 应该只计算一次
    expect(computeSpy).toHaveBeenCalledTimes(1)
  })
})
```

## 测试装饰器功能

### 防抖测试

```typescript
describe('Debounce Decorator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce method calls', () => {
    const store = useDebounceStore()
    const spy = vi.spyOn(store, 'performSearch')

    // 快速连续调用
    store.setSearchQuery('a')
    store.setSearchQuery('ab')
    store.setSearchQuery('abc')

    // 还没有执行
    expect(spy).not.toHaveBeenCalled()

    // 等待防抖时间
    vi.advanceTimersByTime(300)

    // 只执行最后一次
    expect(spy).toHaveBeenCalledTimes(1)
    expect(store.searchQuery).toBe('abc')
  })
})
```

### 缓存测试

```typescript
describe('Cache Decorator', () => {
  it('should cache method results', () => {
    const store = useCacheStore()
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const result1 = store.expensiveMethod(10)
    const result2 = store.expensiveMethod(10)

    expect(result1).toBe(result2)
    expect(spy).toHaveBeenCalledTimes(1) // 只计算一次
  })

  it('should cache different inputs separately', () => {
    const store = useCacheStore()

    const result1 = store.expensiveMethod(10)
    const result2 = store.expensiveMethod(20)

    expect(result1).not.toBe(result2)
  })
})
```

## 测试持久化

### 持久化功能测试

```typescript
describe('Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should persist state to localStorage', () => {
    const store = usePersistStore()

    store.count = 42
    store.name = 'test'

    // 检查是否保存到 localStorage
    const stored = localStorage.getItem('ldesign-store-persist-test')
    expect(stored).toBeTruthy()

    const data = JSON.parse(stored!)
    expect(data.count).toBe(42)
    expect(data.name).toBe('test')
  })

  it('should restore state from localStorage', () => {
    // 预设 localStorage 数据
    localStorage.setItem('ldesign-store-persist-test', JSON.stringify({
      count: 100,
      name: 'restored'
    }))

    const store = usePersistStore()

    expect(store.count).toBe(100)
    expect(store.name).toBe('restored')
  })

  it('should only persist specified paths', () => {
    const store = useSelectivePersistStore()

    store.persistedData = 'should be saved'
    store.temporaryData = 'should not be saved'

    const stored = localStorage.getItem('ldesign-store-selective')
    const data = JSON.parse(stored!)

    expect(data.persistedData).toBe('should be saved')
    expect(data.temporaryData).toBeUndefined()
  })
})
```

## 测试状态订阅

### 订阅测试

```typescript
describe('State Subscription', () => {
  it('should notify subscribers of state changes', () => {
    const store = useSubscriptionStore()
    const mutations: any[] = []

    const unsubscribe = store.$subscribe((mutation, state) => {
      mutations.push({ mutation, state })
    })

    store.setValue('new value')
    store.increment()

    expect(mutations).toHaveLength(2)
    expect(mutations[0].mutation.type).toBe('setValue')
    expect(mutations[1].mutation.type).toBe('increment')

    unsubscribe()
  })

  it('should stop notifications after unsubscribe', () => {
    const store = useSubscriptionStore()
    const mutations: any[] = []

    const unsubscribe = store.$subscribe((mutation, state) => {
      mutations.push({ mutation, state })
    })

    store.setValue('value 1')
    unsubscribe()
    store.setValue('value 2')

    expect(mutations).toHaveLength(1)
  })
})
```

## 集成测试

### 多 Store 协作测试

```typescript
describe('Multi-Store Integration', () => {
  it('should work with multiple stores', () => {
    const userStore = useUserStore()
    const cartStore = useCartStore()

    // 用户登录
    userStore.login({ id: 1, name: 'John', email: 'john@example.com' })

    // 添加商品到购物车
    cartStore.addItem({ id: 1, name: 'Product', price: 10, quantity: 1 })

    expect(userStore.isLoggedIn).toBe(true)
    expect(cartStore.totalPrice).toBe(10)
  })
})
```

### 组件集成测试

```typescript
// 使用 @vue/test-utils 测试组件
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

describe('Component Integration', () => {
  it('should work with Vue components', () => {
    const wrapper = mount(CounterComponent, {
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('Count: 0')

    wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Count: 1')
  })
})
```

## 测试工具和辅助函数

### 测试辅助函数

```typescript
// test-utils.ts
export function createTestStore<T extends BaseStore>(
  StoreClass: new () => T,
  initialState?: Partial<any>
): T {
  setActivePinia(createPinia())
  const useStore = createStoreClass(StoreClass)
  const store = useStore()

  if (initialState) {
    store.$patch(initialState)
  }

  return store
}

export function waitForAsync(fn: () => Promise<any>, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout)
    fn().then(() => {
      clearTimeout(timer)
      resolve()
    }).catch(reject)
  })
}
```

### Mock 工具

```typescript
// mocks.ts
export function createMockApi() {
  return {
    getUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    search: vi.fn()
  }
}

export function mockLocalStorage() {
  const storage = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear())
  }
}
```

## 最佳实践

### 1. 测试结构

```typescript
describe('StoreName', () => {
  describe('State', () => {
    // 状态相关测试
  })

  describe('Actions', () => {
    // 动作相关测试
  })

  describe('Getters', () => {
    // 计算属性相关测试
  })

  describe('Integration', () => {
    // 集成测试
  })
})
```

### 2. 测试覆盖率

确保测试覆盖以下方面：

- ✅ 状态初始化
- ✅ 状态更新
- ✅ 动作执行
- ✅ 计算属性
- ✅ 异步操作
- ✅ 错误处理
- ✅ 装饰器功能
- ✅ 持久化
- ✅ 状态订阅

### 3. 测试隔离

```typescript
// ✅ 每个测试都使用新的 Pinia 实例
beforeEach(() => {
  setActivePinia(createPinia())
})

// ✅ 清理模拟和定时器
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})
```

### 4. 异步测试

```typescript
// ✅ 正确处理异步操作
it('should handle async operations', async () => {
  const store = useAsyncStore()

  const promise = store.fetchData()
  expect(store.$isLoading('fetchData')).toBe(true)

  await promise
  expect(store.$isLoading('fetchData')).toBe(false)
})
```
