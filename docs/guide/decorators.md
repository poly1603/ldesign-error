# 装饰器详解

@ldesign/store 提供了丰富的装饰器来简化状态管理的定义和使用。本章将详细介绍每个装饰器的用法和配置选项。

## @Store 装饰器

`@Store` 装饰器用于标记一个类为 Store 类，并提供配置选项。

### 基本语法

```typescript
@Store(options: StoreClassOptions)
class MyStore extends BaseStore {
  // ...
}
```

### 配置选项

```typescript
interface StoreClassOptions {
  id: string // 必需：Store 的唯一标识符
  persist?: PersistConfig // 可选：持久化配置
  cache?: CacheConfig // 可选：缓存配置
  devtools?: boolean // 可选：是否启用开发工具
  strict?: boolean // 可选：是否启用严格模式
}
```

### 使用示例

```typescript
// 基础配置
@Store({ id: 'simple' })
class SimpleStore extends BaseStore {
  // ...
}

// 完整配置
@Store({
  id: 'advanced',
  persist: {
    key: 'my-store',
    storage: 'localStorage',
    paths: ['importantData']
  },
  cache: {
    ttl: 5000,
    max: 100
  },
  devtools: true,
  strict: true
})
class AdvancedStore extends BaseStore {
  // ...
}
```

## @State 装饰器

`@State` 装饰器用于定义响应式状态属性。

### 基本语法

```typescript
@State(options?: StateOptions)
propertyName!: PropertyType
```

### 配置选项

```typescript
interface StateOptions {
  default?: any // 默认值
  reactive?: boolean // 是否为响应式（默认 true）
  validator?: (value: any) => boolean // 验证函数
}
```

### 使用示例

```typescript
@Store({ id: 'state-examples' })
class StateExamplesStore extends BaseStore {
  // 基础状态
  @State({ default: 0 })
  count!: number

  // 字符串状态
  @State({ default: 'hello' })
  message!: string

  // 数组状态
  @State({ default: [] })
  items!: string[]

  // 对象状态
  @State({ default: { name: '', age: 0 } })
  user!: { name: string, age: number }

  // 带验证的状态
  @State({
    default: 0,
    validator: value => typeof value === 'number' && value >= 0
  })
  positiveNumber!: number

  // 非响应式状态（用于常量或配置）
  @State({
    default: 'constant',
    reactive: false
  })
  constant!: string
}
```

## @Action 装饰器

`@Action` 装饰器用于定义修改状态的方法。

### 基本语法

```typescript
@Action(options?: ActionOptions)
methodName(params) {
  // 修改状态的逻辑
}
```

### 配置选项

```typescript
interface ActionOptions {
  debounce?: DebounceConfig // 防抖配置
  cache?: boolean | CacheConfig // 缓存配置
  loading?: boolean // 是否启用加载状态
}
```

### 使用示例

```typescript
@Store({ id: 'action-examples' })
class ActionExamplesStore extends BaseStore {
  @State({ default: 0 })
  count!: number

  @State({ default: '' })
  searchQuery!: string

  @State({ default: [] })
  results!: any[]

  // 基础 Action
  @Action()
  increment() {
    this.count++
  }

  // 带参数的 Action
  @Action()
  incrementBy(amount: number) {
    this.count += amount
  }

  // 防抖 Action
  @Action({
    debounce: { delay: 300, immediate: false }
  })
  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  // 缓存 Action
  @Action({
    cache: { ttl: 5000 }
  })
  expensiveOperation(input: number) {
    // 复杂计算
    return input * Math.random()
  }

  // 批量更新
  @Action()
  batchUpdate(data: any) {
    this.$patch({
      count: data.count,
      searchQuery: data.query,
      results: data.results
    })
  }
}
```

## @AsyncAction 装饰器

`@AsyncAction` 装饰器是 `@Action` 的特殊版本，专门用于异步操作，自动管理加载状态。

### 基本语法

```typescript
@AsyncAction(options?: ActionOptions)
async methodName(params): Promise<ReturnType> {
  // 异步操作逻辑
}
```

### 使用示例

```typescript
@Store({ id: 'async-examples' })
class AsyncExamplesStore extends BaseStore {
  @State({ default: null })
  user!: User | null

  @State({ default: [] })
  posts!: Post[]

  // 基础异步 Action
  @AsyncAction()
  async fetchUser(id: number) {
    const user = await api.getUser(id)
    this.user = user
    return user
  }

  // 带错误处理的异步 Action
  @AsyncAction()
  async fetchPosts() {
    try {
      const posts = await api.getPosts()
      this.posts = posts
      return posts
    }
 catch (error) {
      console.error('Failed to fetch posts:', error)
      this.posts = []
      throw error
    }
  }

  // 缓存异步结果
  @AsyncAction({
    cache: { ttl: 60000 } // 缓存 1 分钟
  })
  async fetchExpensiveData(params: any) {
    const data = await api.getExpensiveData(params)
    return data
  }

  // 检查加载状态
  @Getter()
  get isLoadingUser() {
    return this.$isLoading('fetchUser')
  }

  @Getter()
  get userError() {
    return this.$getError('fetchUser')
  }
}
```

## @Getter 装饰器

`@Getter` 装饰器用于定义计算属性。

### 基本语法

```typescript
@Getter(options?: GetterOptions)
get propertyName() {
  return computedValue
}
```

### 配置选项

```typescript
interface GetterOptions {
  cache?: boolean | CacheConfig // 缓存配置
  deps?: string[] // 依赖项（暂未实现）
}
```

### 使用示例

```typescript
@Store({ id: 'getter-examples' })
class GetterExamplesStore extends BaseStore {
  @State({ default: '' })
  firstName!: string

  @State({ default: '' })
  lastName!: string

  @State({ default: [] })
  items!: { name: string, price: number, quantity: number }[]

  // 基础 Getter
  @Getter()
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim()
  }

  // 数组计算
  @Getter()
  get itemCount() {
    return this.items.length
  }

  // 复杂计算
  @Getter()
  get totalPrice() {
    return this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
  }

  // 缓存计算结果
  @Getter({ cache: true })
  get expensiveComputation() {
    // 模拟复杂计算
    console.log('Computing expensive value...')
    return this.items.map(item => ({
      ...item,
      total: item.price * item.quantity
    }))
  }

  // 条件计算
  @Getter()
  get hasItems() {
    return this.items.length > 0
  }

  @Getter()
  get isEmpty() {
    return this.items.length === 0
  }
}
```

## @Computed 装饰器

`@Computed` 是 `@Getter` 的别名，提供更语义化的命名。

```typescript
@Store({ id: 'computed-examples' })
class ComputedExamplesStore extends BaseStore {
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

### @Cache 装饰器

用于缓存方法的返回值。

```typescript
@Store({ id: 'cache-examples' })
class CacheExamplesStore extends BaseStore {
  @Cache(5000) // 缓存 5 秒
  expensiveMethod(input: number) {
    console.log('Executing expensive method...')
    return input * Math.random()
  }

  @Cache() // 使用默认缓存时间
  anotherMethod(a: number, b: number) {
    return a + b
  }
}
```

### @Debounce 装饰器

用于防抖处理。

```typescript
@Store({ id: 'debounce-examples' })
class DebounceExamplesStore extends BaseStore {
  @State({ default: '' })
  searchQuery!: string

  @Debounce(300) // 防抖 300ms
  @Action()
  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  @Debounce(500, true) // 防抖 500ms，立即执行第一次
  @Action()
  saveData() {
    console.log('Saving data...')
  }
}
```

### @Throttle 装饰器

用于节流处理。

```typescript
@Store({ id: 'throttle-examples' })
class ThrottleExamplesStore extends BaseStore {
  @State({ default: 0 })
  scrollPosition!: number

  @Throttle(100) // 节流 100ms
  @Action()
  updateScrollPosition(position: number) {
    this.scrollPosition = position
  }

  @Throttle(1000) // 节流 1 秒
  @Action()
  autoSave() {
    console.log('Auto saving...')
  }
}
```

## 验证装饰器

### @Validate 装饰器

用于状态值验证。

```typescript
@Store({ id: 'validate-examples' })
class ValidateExamplesStore extends BaseStore {
  @Validate(value => typeof value === 'string' && value.length > 0)
  @State({ default: 'default' })
  name!: string

  @Validate(value => typeof value === 'number' && value >= 0)
  @State({ default: 0 })
  age!: number

  @Action()
  setName(name: string) {
    // 验证会在设置值时自动执行
    this.name = name
  }
}
```

### @Readonly 装饰器

用于创建只读状态。

```typescript
@Store({ id: 'readonly-examples' })
class ReadonlyExamplesStore extends BaseStore {
  @Readonly
  @State({ default: 'constant' })
  constant!: string

  // 尝试修改只读状态会在开发模式下发出警告
}
```

## 装饰器组合使用

多个装饰器可以组合使用：

```typescript
@Store({ id: 'combined-examples' })
class CombinedExamplesStore extends BaseStore {
  @State({ default: '' })
  query!: string

  @State({ default: [] })
  results!: any[]

  // 组合使用多个装饰器
  @Cache(10000)
  @Debounce(300)
  @AsyncAction()
  async search(query: string) {
    this.query = query
    const results = await api.search(query)
    this.results = results
    return results
  }

  // 缓存 + 节流
  @Cache(5000)
  @Throttle(1000)
  @Action()
  expensiveUpdate(data: any) {
    // 复杂更新逻辑
    this.$patch(data)
  }
}
```

## 最佳实践

### 1. 装饰器顺序

当使用多个装饰器时，建议按以下顺序排列：

```typescript
@Cache(5000)        // 缓存装饰器
@Debounce(300)      // 防抖/节流装饰器
@AsyncAction()      // Action 装饰器
async myMethod() {
  // ...
}
```

### 2. 合理使用缓存

```typescript
// ✅ 好的做法：缓存计算密集型操作
@Cache(60000)
@Getter()
get complexCalculation() {
  return this.largeDataSet.reduce(/* complex logic */)
}

// ❌ 避免：缓存简单操作
@Cache(1000)
@Getter()
get simpleSum() {
  return this.a + this.b
}
```

### 3. 防抖和节流的选择

```typescript
// 搜索输入：使用防抖
@Debounce(300)
@Action()
setSearchQuery(query: string) {
  this.searchQuery = query
}

// 滚动事件：使用节流
@Throttle(100)
@Action()
updateScrollPosition(position: number) {
  this.scrollPosition = position
}
```

### 4. 异步操作错误处理

```typescript
@AsyncAction()
async fetchData() {
  try {
    const data = await api.getData()
    this.data = data
    return data
  } catch (error) {
    // 记录错误但不阻止应用运行
    console.error('Failed to fetch data:', error)
    throw error // 重新抛出以便调用者处理
  }
}
```
