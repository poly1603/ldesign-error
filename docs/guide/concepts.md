# 核心概念

@ldesign/store 基于类装饰器模式，提供了一种声明式的状态管理方式。本章将深入介绍核心概念和设计理念。

## Store 类

Store 类是状态管理的核心，它继承自 `BaseStore` 并使用 `@Store` 装饰器进行标记。

### 基本结构

```typescript
import { Action, BaseStore, Getter, State, Store } from '@ldesign/store'

@Store({ id: 'example' })
class ExampleStore extends BaseStore {
  // 状态定义
  @State({ default: 'initial' })
  value!: string

  // 动作定义
  @Action()
  setValue(newValue: string) {
    this.value = newValue
  }

  // 计算属性定义
  @Getter()
  get upperValue() {
    return this.value.toUpperCase()
  }
}

export const useExampleStore = createStoreClass(ExampleStore)
```

### Store 配置选项

`@Store` 装饰器接受以下配置选项：

```typescript
interface StoreClassOptions {
  id: string // Store 的唯一标识符
  persist?: PersistConfig // 持久化配置
  cache?: CacheConfig // 缓存配置
  devtools?: boolean // 是否启用开发工具
  strict?: boolean // 是否启用严格模式
}
```

#### 示例配置

```typescript
@Store({
  id: 'user',
  persist: {
    key: 'user-store',
    storage: 'localStorage',
    paths: ['currentUser', 'preferences']
  },
  cache: {
    ttl: 5000,
    max: 100
  },
  devtools: true,
  strict: true
})
class UserStore extends BaseStore {
  // ...
}
```

## 状态 (State)

状态是 Store 中的响应式数据，使用 `@State` 装饰器定义。

### 基本用法

```typescript
@State({ default: 0 })
count!: number

@State({ default: [] })
items!: Item[]

@State({ default: { name: '', email: '' } })
user!: User
```

### 状态选项

```typescript
interface StateOptions {
  default?: any // 默认值
  reactive?: boolean // 是否为响应式（默认 true）
  validator?: (value: any) => boolean // 验证函数
}
```

### 复杂状态示例

```typescript
@Store({ id: 'complex' })
class ComplexStore extends BaseStore {
  // 基础类型
  @State({ default: 0 })
  count!: number

  // 对象类型
  @State({
    default: { name: '', age: 0 },
    validator: value => value && typeof value.name === 'string'
  })
  person!: { name: string, age: number }

  // 数组类型
  @State({ default: [] })
  items!: string[]

  // 可选状态
  @State({ default: null })
  optionalData!: any | null
}
```

## 动作 (Actions)

动作是修改状态的方法，使用 `@Action` 装饰器定义。

### 基本用法

```typescript
@Action()
increment() {
  this.count++
}

@Action()
setUser(user: User) {
  this.user = user
}

@Action()
addItem(item: string) {
  this.items.push(item)
}
```

### 异步动作

```typescript
@AsyncAction()
async fetchUser(id: number) {
  try {
    const user = await api.getUser(id)
    this.user = user
    return user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw error
  }
}
```

### 动作选项

```typescript
interface ActionOptions {
  debounce?: DebounceConfig // 防抖配置
  cache?: boolean | CacheConfig // 缓存配置
  loading?: boolean // 是否启用加载状态
}
```

### 高级动作示例

```typescript
@Store({ id: 'advanced' })
class AdvancedStore extends BaseStore {
  @State({ default: '' })
  searchQuery!: string

  @State({ default: [] })
  searchResults!: any[]

  // 防抖搜索
  @Action({
    debounce: { delay: 300 }
  })
  setSearchQuery(query: string) {
    this.searchQuery = query
    this.performSearch()
  }

  // 缓存搜索结果
  @AsyncAction({
    cache: { ttl: 60000 }, // 缓存 1 分钟
    loading: true
  })
  async performSearch() {
    if (!this.searchQuery) {
      this.searchResults = []
      return
    }

    const results = await api.search(this.searchQuery)
    this.searchResults = results
    return results
  }
}
```

## 计算属性 (Getters)

计算属性是基于状态计算得出的值，使用 `@Getter` 装饰器定义。

### 基本用法

```typescript
@Getter()
get fullName() {
  return `${this.firstName} ${this.lastName}`
}

@Getter()
get itemCount() {
  return this.items.length
}

@Getter()
get hasItems() {
  return this.items.length > 0
}
```

### 缓存计算属性

```typescript
@Getter({ cache: true })
get expensiveComputation() {
  // 复杂计算，结果会被缓存
  return this.items.reduce((sum, item) => {
    return sum + item.value * item.quantity
  }, 0)
}
```

### 依赖其他计算属性

```typescript
@Store({ id: 'math' })
class MathStore extends BaseStore {
  @State({ default: 10 })
  width!: number

  @State({ default: 20 })
  height!: number

  @Getter()
  get area() {
    return this.width * this.height
  }

  @Getter()
  get perimeter() {
    return 2 * (this.width + this.height)
  }

  @Getter()
  get aspectRatio() {
    return this.width / this.height
  }

  @Getter()
  get isSquare() {
    return this.width === this.height
  }
}
```

## 响应式系统

@ldesign/store 基于 Vue 3 的响应式系统，提供了细粒度的响应式更新。

### 状态订阅

```typescript
const store = useMyStore()

// 订阅状态变化
const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('State changed:', {
    type: mutation.type,
    payload: mutation.payload,
    newState: state
  })
})

// 清理订阅
onUnmounted(() => {
  unsubscribe()
})
```

### 批量更新

```typescript
@Action()
batchUpdate() {
  // 使用 $patch 进行批量更新，减少响应式触发次数
  this.$patch({
    count: 10,
    name: 'New Name',
    items: ['item1', 'item2']
  })
}
```

### 状态快照

```typescript
@Action()
saveSnapshot() {
  // 保存当前状态快照
  this.snapshot = this.$getSnapshot()
}

@Action()
restoreSnapshot() {
  // 恢复到之前的状态
  if (this.snapshot) {
    this.$restoreSnapshot(this.snapshot)
  }
}
```

## 类型安全

@ldesign/store 提供完整的 TypeScript 支持，确保类型安全。

### 强类型 Store

```typescript
interface User {
  id: number
  name: string
  email: string
}

@Store({ id: 'typed-user' })
class TypedUserStore extends BaseStore {
  @State({ default: null })
  currentUser!: User | null

  @State({ default: [] })
  users!: User[]

  @Action()
  setCurrentUser(user: User) {
    this.currentUser = user
  }

  @Getter()
  get currentUserName(): string {
    return this.currentUser?.name || 'Guest'
  }

  @AsyncAction()
  async fetchUser(id: number): Promise<User> {
    const user = await api.getUser(id)
    this.currentUser = user
    return user
  }
}
```

### 类型推导

```typescript
const store = useTypedUserStore()

// TypeScript 会自动推导类型
store.currentUser // User | null
store.users // User[]
store.currentUserName // string

// 方法调用也有类型检查
store.setCurrentUser({ id: 1, name: 'John', email: 'john@example.com' })
store.fetchUser(123) // Promise<User>
```

## 最佳实践

### 1. Store 拆分

将大型应用的状态拆分为多个小的 Store：

```typescript
// 用户相关状态
@Store({ id: 'user' })
class UserStore extends BaseStore {
  // 用户状态和操作
}

// 购物车相关状态
@Store({ id: 'cart' })
class CartStore extends BaseStore {
  // 购物车状态和操作
}

// 应用设置相关状态
@Store({ id: 'settings' })
class SettingsStore extends BaseStore {
  // 设置状态和操作
}
```

### 2. 状态规范化

对于复杂的嵌套数据，使用规范化结构：

```typescript
@Store({ id: 'normalized' })
class NormalizedStore extends BaseStore {
  @State({ default: {} })
  usersById!: Record<number, User>

  @State({ default: [] })
  userIds!: number[]

  @Getter()
  get users() {
    return this.userIds.map(id => this.usersById[id])
  }

  @Action()
  addUser(user: User) {
    this.usersById[user.id] = user
    if (!this.userIds.includes(user.id)) {
      this.userIds.push(user.id)
    }
  }
}
```

### 3. 错误处理

统一的错误处理模式：

```typescript
@Store({ id: 'error-handling' })
class ErrorHandlingStore extends BaseStore {
  @State({ default: null })
  error!: Error | null

  @AsyncAction()
  async safeOperation() {
    try {
      this.error = null
      const result = await riskyOperation()
      return result
    }
 catch (error) {
      this.error = error as Error
      throw error
    }
  }

  @Action()
  clearError() {
    this.error = null
  }
}
```
