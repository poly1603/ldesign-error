# 装饰器 API

## @Store

Store 类装饰器，用于标记和配置 Store 类。

### 语法

```typescript
@Store(options: StoreClassOptions)
```

### 参数

#### StoreClassOptions

```typescript
interface StoreClassOptions {
  id: string // 必需：Store 的唯一标识符
  persist?: PersistConfig // 可选：持久化配置
  cache?: CacheConfig // 可选：缓存配置
  devtools?: boolean // 可选：是否启用开发工具
  strict?: boolean // 可选：是否启用严格模式
}
```

### 示例

```typescript
@Store({
  id: 'user',
  persist: true,
  devtools: true
})
class UserStore extends BaseStore {
  // ...
}
```

## @State

状态装饰器，用于定义响应式状态属性。

### 语法

```typescript
@State(options?: StateOptions)
propertyName!: PropertyType
```

### 参数

#### StateOptions

```typescript
interface StateOptions {
  default?: any // 默认值
  reactive?: boolean // 是否为响应式（默认 true）
  validator?: (value: any) => boolean // 验证函数
}
```

### 示例

```typescript
@Store({ id: 'example' })
class ExampleStore extends BaseStore {
  // 基础状态
  @State({ default: 0 })
  count!: number

  // 带验证的状态
  @State({
    default: '',
    validator: value => typeof value === 'string' && value.length > 0
  })
  name!: string

  // 非响应式状态
  @State({
    default: 'constant',
    reactive: false
  })
  constant!: string
}
```

## @Action

动作装饰器，用于定义修改状态的方法。

### 语法

```typescript
@Action(options?: ActionOptions)
methodName(params) {
  // 修改状态的逻辑
}
```

### 参数

#### ActionOptions

```typescript
interface ActionOptions {
  debounce?: DebounceConfig // 防抖配置
  cache?: boolean | CacheConfig // 缓存配置
  loading?: boolean // 是否启用加载状态
}
```

#### DebounceConfig

```typescript
interface DebounceConfig {
  delay: number // 延迟时间（毫秒）
  immediate?: boolean // 是否立即执行（默认 false）
}
```

### 示例

```typescript
@Store({ id: 'action-demo' })
class ActionDemoStore extends BaseStore {
  @State({ default: 0 })
  count!: number

  @State({ default: '' })
  searchQuery!: string

  // 基础 Action
  @Action()
  increment() {
    this.count++
  }

  // 防抖 Action
  @Action({
    debounce: { delay: 300 }
  })
  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  // 缓存 Action
  @Action({
    cache: { ttl: 5000 }
  })
  expensiveOperation(input: number) {
    return input * Math.random()
  }
}
```

## @AsyncAction

异步动作装饰器，自动管理加载状态和错误处理。

### 语法

```typescript
@AsyncAction(options?: ActionOptions)
async methodName(params): Promise<ReturnType> {
  // 异步操作逻辑
}
```

### 特性

- 自动设置 `loading` 为 `true`
- 自动管理错误状态
- 支持所有 `@Action` 的选项

### 示例

```typescript
@Store({ id: 'async-demo' })
class AsyncDemoStore extends BaseStore {
  @State({ default: null })
  data!: any

  @AsyncAction()
  async fetchData() {
    const response = await api.getData()
    this.data = response.data
    return response.data
  }

  @AsyncAction({
    cache: { ttl: 60000 }
  })
  async fetchCachedData(params: any) {
    return await api.getData(params)
  }

  // 检查加载状态
  @Getter()
  get isLoading() {
    return this.$isLoading('fetchData')
  }
}
```

## @Getter

计算属性装饰器，用于定义基于状态的计算值。

### 语法

```typescript
@Getter(options?: GetterOptions)
get propertyName() {
  return computedValue
}
```

### 参数

#### GetterOptions

```typescript
interface GetterOptions {
  cache?: boolean | CacheConfig // 缓存配置
  deps?: string[] // 依赖项（暂未实现）
}
```

### 示例

```typescript
@Store({ id: 'getter-demo' })
class GetterDemoStore extends BaseStore {
  @State({ default: '' })
  firstName!: string

  @State({ default: '' })
  lastName!: string

  @State({ default: [] })
  items!: { price: number, quantity: number }[]

  // 基础 Getter
  @Getter()
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim()
  }

  // 缓存 Getter
  @Getter({ cache: true })
  get totalPrice() {
    console.log('Computing total price...')
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }
}
```

## @Computed

`@Getter` 的别名，提供更语义化的命名。

### 语法

```typescript
@Computed(options?: GetterOptions)
get propertyName() {
  return computedValue
}
```

### 示例

```typescript
@Store({ id: 'computed-demo' })
class ComputedDemoStore extends BaseStore {
  @State({ default: 10 })
  width!: number

  @State({ default: 20 })
  height!: number

  @Computed()
  get area() {
    return this.width * this.height
  }

  @Computed()
  get perimeter() {
    return 2 * (this.width + this.height)
  }
}
```

## 性能优化装饰器

### @Cache

方法缓存装饰器，缓存方法的返回值。

#### 语法

```typescript
@Cache(ttl?: number)
methodName(params) {
  // 方法逻辑
}
```

#### 参数

- `ttl`: 缓存时间（毫秒），默认为永久缓存

#### 示例

```typescript
@Store({ id: 'cache-demo' })
class CacheDemoStore extends BaseStore {
  @Cache(5000) // 缓存 5 秒
  expensiveCalculation(input: number) {
    console.log('Performing calculation...')
    return input * Math.random()
  }

  @Cache() // 永久缓存
  staticData() {
    return { version: '1.0.0' }
  }
}
```

### @Debounce

防抖装饰器，在指定时间内只执行最后一次调用。

#### 语法

```typescript
@Debounce(delay: number, immediate?: boolean)
methodName(params) {
  // 方法逻辑
}
```

#### 参数

- `delay`: 延迟时间（毫秒）
- `immediate`: 是否立即执行第一次调用（默认 false）

#### 示例

```typescript
@Store({ id: 'debounce-demo' })
class DebounceDemoStore extends BaseStore {
  @State({ default: '' })
  searchQuery!: string

  @Debounce(300)
  @Action()
  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  @Debounce(1000, true) // 立即执行第一次
  @Action()
  autoSave() {
    console.log('Auto saving...')
  }
}
```

### @Throttle

节流装饰器，限制方法的执行频率。

#### 语法

```typescript
@Throttle(delay: number)
methodName(params) {
  // 方法逻辑
}
```

#### 参数

- `delay`: 节流间隔（毫秒）

#### 示例

```typescript
@Store({ id: 'throttle-demo' })
class ThrottleDemoStore extends BaseStore {
  @State({ default: 0 })
  scrollPosition!: number

  @Throttle(100) // 每 100ms 最多执行一次
  @Action()
  updateScrollPosition(position: number) {
    this.scrollPosition = position
  }

  @Throttle(2000) // 每 2 秒最多执行一次
  @AsyncAction()
  sendAnalytics(data: any) {
    return api.sendAnalytics(data)
  }
}
```

## 验证装饰器

### @Validate

状态验证装饰器，为状态属性添加验证逻辑。

#### 语法

```typescript
@Validate(validator: (value: any) => boolean)
@State(options)
propertyName!: PropertyType
```

#### 参数

- `validator`: 验证函数，返回 `true` 表示验证通过

#### 示例

```typescript
@Store({ id: 'validate-demo' })
class ValidateDemoStore extends BaseStore {
  @Validate(value => typeof value === 'string' && value.length > 0)
  @State({ default: 'default' })
  name!: string

  @Validate(value => typeof value === 'number' && value >= 0 && value <= 120)
  @State({ default: 0 })
  age!: number

  @Validate(value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  @State({ default: '' })
  email!: string

  @Action()
  setUserInfo(name: string, age: number, email: string) {
    // 验证会在设置值时自动执行
    this.name = name // 如果验证失败，会在开发模式下发出警告
    this.age = age
    this.email = email
  }
}
```

### @Readonly

只读状态装饰器，创建只读状态属性。

#### 语法

```typescript
@Readonly
@State(options)
propertyName!: PropertyType
```

#### 示例

```typescript
@Store({ id: 'readonly-demo' })
class ReadonlyDemoStore extends BaseStore {
  @Readonly
  @State({ default: 'constant-value' })
  constant!: string

  @Readonly
  @State({ default: { version: '1.0.0', build: 123 } })
  buildInfo!: { version: string, build: number }

  // 尝试修改只读状态会在开发模式下发出警告
  @Action()
  tryModifyConstant() {
    // 这会在开发模式下发出警告
    this.constant = 'new-value'
  }
}
```

## 装饰器组合

多个装饰器可以组合使用，按照从下到上的顺序执行：

```typescript
@Store({ id: 'combined-demo' })
class CombinedDemoStore extends BaseStore {
  @State({ default: '' })
  query!: string

  @State({ default: [] })
  results!: any[]

  // 组合使用：缓存 + 防抖 + 异步
  @Cache(10000) // 缓存 10 秒
  @Debounce(300) // 防抖 300ms
  @AsyncAction() // 异步操作
  async search(query: string) {
    this.query = query
    const results = await api.search(query)
    this.results = results
    return results
  }

  // 组合使用：验证 + 状态
  @Validate(value => value.length <= 100)
  @State({ default: '' })
  description!: string

  // 组合使用：缓存 + 节流
  @Cache(5000)
  @Throttle(1000)
  @Action()
  expensiveUpdate(data: any) {
    // 复杂更新逻辑
    this.$patch(data)
  }
}
```

## 装饰器执行顺序

当使用多个装饰器时，执行顺序为：

1. **最外层装饰器先执行**（从上到下）
2. **方法调用时从内到外执行**

```typescript
@Cache(5000)        // 3. 最后执行缓存检查
@Debounce(300)      // 2. 然后执行防抖
@AsyncAction()      // 1. 首先执行异步处理
async myMethod() {
  // 方法体
}
```

## 类型安全

所有装饰器都提供完整的 TypeScript 类型支持：

```typescript
@Store({ id: 'typed-demo' })
class TypedDemoStore extends BaseStore {
  @State({ default: 0 })
  count!: number // TypeScript 会推导出 number 类型

  @Action()
  increment(): void { // 明确指定返回类型
    this.count++
  }

  @AsyncAction()
  async fetchData(): Promise<string> { // 异步方法的返回类型
    const data = await api.getData()
    return data
  }

  @Getter()
  get doubleCount(): number { // Getter 的返回类型
    return this.count * 2
  }
}
```

## 错误处理

装饰器会自动处理常见错误：

```typescript
@Store({ id: 'error-demo' })
class ErrorDemoStore extends BaseStore {
  @AsyncAction()
  async riskyOperation() {
    try {
      return await api.riskyCall()
    }
 catch (error) {
      // 错误会自动记录到 $errors 中
      console.error('Operation failed:', error)
      throw error // 重新抛出以便调用者处理
    }
  }

  @Validate(value => value > 0)
  @State({ default: 1 })
  positiveNumber!: number

  @Action()
  setNumber(value: number) {
    // 如果验证失败，会在开发模式下发出警告
    this.positiveNumber = value
  }
}
```
