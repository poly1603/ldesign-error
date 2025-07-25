# 类型定义 API

## 核心类型

### StoreClass

Store 类的基础接口。

```typescript
interface StoreClass {
  readonly $id: string // Store 的唯一标识符
  readonly $store: Store // 原始 Pinia Store
  $reset: () => void // 重置状态
  $subscribe: (callback: StateSubscriber) => () => void // 订阅状态变化
  $dispose: () => void // 销毁 Store
}
```

### StoreInstance

Store 实例类型，包含扩展属性。

```typescript
type StoreInstance<T extends StoreClass> = T & {
  $loading: Ref<LoadingState> // 加载状态
  $errors: Ref<ErrorState> // 错误状态
}
```

### StoreFactory

Store 工厂函数类型。

```typescript
type StoreFactory<T extends StoreClass> = () => StoreDefinition<
  string,
  any,
  any,
  any
>
```

## 配置类型

### StoreClassOptions

Store 类装饰器的配置选项。

```typescript
interface StoreClassOptions {
  id: string // 必需：Store 的唯一标识符
  persist?: PersistConfig | boolean // 可选：持久化配置
  cache?: CacheConfig // 可选：缓存配置
  devtools?: boolean // 可选：是否启用开发工具
  strict?: boolean // 可选：是否启用严格模式
}
```

### StateOptions

状态装饰器的配置选项。

```typescript
interface StateOptions {
  default?: any // 默认值
  reactive?: boolean // 是否为响应式（默认 true）
  validator?: (value: any) => boolean // 验证函数
}
```

### ActionOptions

动作装饰器的配置选项。

```typescript
interface ActionOptions {
  debounce?: DebounceConfig // 防抖配置
  cache?: boolean | CacheConfig // 缓存配置
  loading?: boolean // 是否启用加载状态
}
```

### GetterOptions

计算属性装饰器的配置选项。

```typescript
interface GetterOptions {
  cache?: boolean | CacheConfig // 缓存配置
  deps?: string[] // 依赖项（暂未实现）
}
```

## 持久化类型

### PersistConfig

持久化配置接口。

```typescript
interface PersistConfig {
  key?: string // 存储键名
  storage?: StorageType // 存储类型
  paths?: string[] // 需要持久化的状态路径
  serializer?: { // 序列化器
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  ssr?: boolean // 是否在 SSR 中启用
}
```

### StorageType

存储类型枚举。

```typescript
type StorageType = 'localStorage' | 'sessionStorage' | 'none'
```

## 缓存类型

### CacheConfig

缓存配置接口。

```typescript
interface CacheConfig {
  ttl?: number // 缓存时间（毫秒）
  max?: number // 最大缓存数量
  lru?: boolean // 是否启用 LRU 策略
}
```

## 性能优化类型

### DebounceConfig

防抖配置接口。

```typescript
interface DebounceConfig {
  delay: number // 延迟时间（毫秒）
  immediate?: boolean // 是否立即执行（默认 false）
}
```

### BatchConfig

批量更新配置接口。

```typescript
interface BatchConfig {
  size?: number // 批量大小
  delay?: number // 延迟时间（毫秒）
}
```

## 状态管理类型

### LoadingState

加载状态接口。

```typescript
interface LoadingState {
  [actionName: string]: boolean
}
```

### ErrorState

错误状态接口。

```typescript
interface ErrorState {
  [actionName: string]: Error | null
}
```

### StateSubscriber

状态订阅回调函数类型。

```typescript
type StateSubscriber<T = any> = (
  mutation: StateMutation<T>,
  state: T
) => void
```

### StateMutation

状态变更信息接口。

```typescript
interface StateMutation<T = any> {
  type: string // 变更类型
  payload?: any // 变更的载荷
  oldState: T // 变更前的状态
  newState: T // 变更后的状态
  timestamp: number // 时间戳
}
```

## 装饰器元数据类型

### DecoratorMetadata

装饰器元数据接口。

```typescript
interface DecoratorMetadata {
  type: 'state' | 'getter' | 'action' // 装饰器类型
  key: string // 属性/方法名
  options?: any // 装饰器选项
}
```

## 插件类型

### StorePlugin

插件接口。

```typescript
interface StorePlugin {
  name: string // 插件名称
  install: (store: Store, options?: any) => void // 插件安装函数
  options?: any // 插件选项
}
```

## 工具类型

### DeepPartial

深度可选类型。

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
```

### DeepReadonly

深度只读类型。

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
```

### ExtractState

提取状态类型。

```typescript
type ExtractState<T> = {
  [K in keyof T]: T[K] extends Ref<infer U> ? U : T[K]
}
```

### ExtractGetters

提取计算属性类型。

```typescript
type ExtractGetters<T> = {
  [K in keyof T]: T[K] extends ComputedRef<infer U> ? U : never
}
```

### ExtractActions

提取动作类型。

```typescript
type ExtractActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never
}
```

## 类型守卫

### isStore

检查是否为 Store 实例。

```typescript
function isStore(value: any): value is StoreClass {
  return value
    && typeof value.$id === 'string'
    && typeof value.$reset === 'function'
    && typeof value.$subscribe === 'function'
}
```

### isAsyncAction

检查是否为异步动作。

```typescript
function isAsyncAction(fn: any): fn is (...args: any[]) => Promise<any> {
  return typeof fn === 'function'
    && fn.constructor.name === 'AsyncFunction'
}
```

## 类型使用示例

### 强类型 Store 定义

```typescript
// 定义用户接口
interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

// 定义用户偏好接口
interface UserPreferences {
  theme: 'light' | 'dark'
  language: string
  notifications: boolean
}

// 强类型 Store
@Store({
  id: 'typed-user',
  persist: {
    paths: ['currentUser', 'preferences']
  }
})
class TypedUserStore extends BaseStore {
  @State({ default: null })
  currentUser!: User | null

  @State({ default: [] })
  users!: User[]

  @State({
    default: {
      theme: 'light' as const,
      language: 'en',
      notifications: true
    }
  })
  preferences!: UserPreferences

  @Action()
  setCurrentUser(user: User): void {
    this.currentUser = user
  }

  @AsyncAction()
  async fetchUser(id: number): Promise<User> {
    const user = await api.getUser(id)
    this.currentUser = user
    return user
  }

  @Getter()
  get isLoggedIn(): boolean {
    return this.currentUser !== null
  }

  @Getter()
  get currentUserName(): string {
    return this.currentUser?.name || 'Guest'
  }
}

// 类型推导
const store = useTypedUserStore()
store.currentUser // User | null
store.users // User[]
store.preferences // UserPreferences
store.isLoggedIn // boolean
store.currentUserName // string

// 方法类型检查
store.setCurrentUser({ id: 1, name: 'John', email: 'john@example.com' })
store.fetchUser(123) // Promise<User>
```

### 泛型 Store

```typescript
// 泛型数据 Store
interface DataStore<T> {
  items: T[]
  selectedItem: T | null
  loading: boolean
}

@Store({ id: 'generic-data' })
class GenericDataStore<T extends { id: number }> extends BaseStore implements DataStore<T> {
  @State({ default: [] })
  items!: T[]

  @State({ default: null })
  selectedItem!: T | null

  @State({ default: false })
  loading!: boolean

  @Action()
  setItems(items: T[]): void {
    this.items = items
  }

  @Action()
  selectItem(item: T): void {
    this.selectedItem = item
  }

  @Getter()
  get selectedItemId(): number | null {
    return this.selectedItem?.id || null
  }
}

// 使用泛型 Store
interface Product {
  id: number
  name: string
  price: number
}

const useProductStore = createStoreClass(GenericDataStore<Product>)
const productStore = useProductStore()

productStore.items // Product[]
productStore.selectedItem // Product | null
```

### 条件类型

```typescript
// 根据配置决定返回类型
type StoreWithPersist<T, P extends boolean> = P extends true
  ? T & { $persist: PersistConfig }
  : T

type StoreWithCache<T, C extends boolean> = C extends true
  ? T & { $cache: CacheConfig }
  : T

// 复合条件类型
type EnhancedStore<
  T extends StoreClass,
  P extends boolean = false,
  C extends boolean = false
> = StoreWithCache<StoreWithPersist<T, P>, C>
```

### 映射类型

```typescript
// 将所有属性转为可选
type PartialStore<T extends StoreClass> = {
  [K in keyof T]?: T[K]
}

// 将所有方法转为异步
type AsyncStore<T extends StoreClass> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K]
}

// 提取状态属性
type StateKeys<T> = {
  [K in keyof T]: T[K] extends Ref<any> ? K : never
}[keyof T]

type StoreState<T extends StoreClass> = Pick<T, StateKeys<T>>
```
