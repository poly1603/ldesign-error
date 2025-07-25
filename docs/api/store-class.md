# Store 类 API

## BaseStore

所有 Store 类的基类，提供核心功能和方法。

### 类型定义

```typescript
abstract class BaseStore implements StoreClass {
  readonly $id: string
  readonly $store: Store

  $reset(): void
  $subscribe(callback: StateSubscriber): () => void
  $dispose(): void
  $patch(partialState: any): void
  $getSnapshot(): any
  $restoreSnapshot(snapshot: any): void
}
```

### 属性

#### $id

- **类型**: `string`
- **描述**: Store 的唯一标识符
- **只读**: 是

```typescript
const store = useMyStore()
console.log(store.$id) // 'my-store'
```

#### $store

- **类型**: `Store`
- **描述**: 底层的 Pinia Store 实例
- **只读**: 是

```typescript
const store = useMyStore()
console.log(store.$store) // Pinia Store 实例
```

### 方法

#### $reset()

重置 Store 状态到初始值。

```typescript
$reset(): void
```

**示例**:

```typescript
const store = useCounterStore()
store.count = 10
store.$reset()
console.log(store.count) // 0 (初始值)
```

#### $subscribe()

订阅状态变化。

```typescript
$subscribe(callback: StateSubscriber): () => void
```

**参数**:

- `callback`: 状态变化回调函数

**返回值**: 取消订阅的函数

**示例**:

```typescript
const store = useCounterStore()

const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('State changed:', mutation.type, state)
})

// 取消订阅
unsubscribe()
```

#### $dispose()

销毁 Store 实例，清理所有订阅和资源。

```typescript
$dispose(): void
```

**示例**:

```typescript
const store = useMyStore()
store.$dispose()
```

#### $patch()

批量更新状态。

```typescript
$patch(partialState: any): void
```

**参数**:

- `partialState`: 要更新的状态对象

**示例**:

```typescript
const store = useUserStore()
store.$patch({
  name: 'John',
  age: 30,
  email: 'john@example.com'
})
```

#### $getSnapshot()

获取当前状态的快照。

```typescript
$getSnapshot(): any
```

**返回值**: 状态快照对象

**示例**:

```typescript
const store = useMyStore()
const snapshot = store.$getSnapshot()
console.log(snapshot) // 当前状态的副本
```

#### $restoreSnapshot()

从快照恢复状态。

```typescript
$restoreSnapshot(snapshot: any): void
```

**参数**:

- `snapshot`: 要恢复的状态快照

**示例**:

```typescript
const store = useMyStore()
const snapshot = store.$getSnapshot()

// 修改状态
store.someValue = 'changed'

// 恢复到快照
store.$restoreSnapshot(snapshot)
```

## createStoreClass()

将 Store 类转换为可用的 Store 工厂函数。

### 类型定义

```typescript
function createStoreClass<T extends BaseStore>(
  StoreClass: new () => T
): () => T
```

### 参数

- `StoreClass`: 继承自 `BaseStore` 的 Store 类

### 返回值

返回一个工厂函数，调用该函数可以获取 Store 实例。

### 示例

```typescript
@Store({ id: 'counter' })
class CounterStore extends BaseStore {
  @State({ default: 0 })
  count!: number

  @Action()
  increment() {
    this.count++
  }
}

// 创建 Store 工厂
const useCounterStore = createStoreClass(CounterStore)

// 在组件中使用
const store = useCounterStore()
```

## Store 实例扩展属性

通过 `createStoreClass` 创建的 Store 实例会自动添加以下扩展属性：

### $loading

- **类型**: `Ref<LoadingState>`
- **描述**: 异步操作的加载状态

```typescript
interface LoadingState {
  [actionName: string]: boolean
}
```

### $errors

- **类型**: `Ref<ErrorState>`
- **描述**: 异步操作的错误状态

```typescript
interface ErrorState {
  [actionName: string]: Error | null
}
```

### $isLoading()

检查指定 Action 是否正在加载。

```typescript
$isLoading(actionName: string): boolean
```

**示例**:

```typescript
const store = useAsyncStore()
console.log(store.$isLoading('fetchData')) // false

store.fetchData()
console.log(store.$isLoading('fetchData')) // true
```

### $getError()

获取指定 Action 的错误信息。

```typescript
$getError(actionName: string): Error | null
```

**示例**:

```typescript
const store = useAsyncStore()
try {
  await store.fetchData()
}
 catch (error) {
  console.log(store.$getError('fetchData')) // Error 实例
}
```

### $clearError()

清除指定 Action 的错误状态。

```typescript
$clearError(actionName: string): void
```

**示例**:

```typescript
const store = useAsyncStore()
store.$clearError('fetchData')
```

### $clearAllErrors()

清除所有 Action 的错误状态。

```typescript
$clearAllErrors(): void
```

**示例**:

```typescript
const store = useAsyncStore()
store.$clearAllErrors()
```

## 状态订阅

### StateSubscriber

状态变化订阅回调函数类型。

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
  type: string // 变更类型（Action 名称）
  payload?: any // 变更的载荷
  oldState: T // 变更前的状态
  newState: T // 变更后的状态
  timestamp: number // 时间戳
}
```

### 订阅示例

```typescript
const store = useMyStore()

const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('Action:', mutation.type)
  console.log('Payload:', mutation.payload)
  console.log('Old State:', mutation.oldState)
  console.log('New State:', mutation.newState)
  console.log('Timestamp:', mutation.timestamp)
})

// 执行 Action
store.updateValue('new value')

// 输出:
// Action: updateValue
// Payload: undefined
// Old State: { value: 'old value' }
// New State: { value: 'new value' }
// Timestamp: 1640995200000
```

## 错误处理

### 异步 Action 错误处理

```typescript
@Store({ id: 'error-demo' })
class ErrorDemoStore extends BaseStore {
  @AsyncAction()
  async riskyOperation() {
    try {
      const result = await api.riskyCall()
      return result
    }
 catch (error) {
      // 错误会自动记录到 $errors 中
      throw error
    }
  }
}

// 使用
const store = useErrorDemoStore()

try {
  await store.riskyOperation()
}
 catch (error) {
  // 处理错误
  console.error('Operation failed:', error)

  // 检查错误状态
  const storeError = store.$getError('riskyOperation')
  console.log('Store error:', storeError)
}
```

### 错误状态管理

```typescript
// 检查是否有错误
if (store.$getError('fetchData')) {
  console.log('Fetch data failed')
}

// 清除特定错误
store.$clearError('fetchData')

// 清除所有错误
store.$clearAllErrors()

// 响应式地监听错误状态
watch(() => store.$getError('fetchData'), (error) => {
  if (error) {
    showErrorMessage(error.message)
  }
})
```

## 性能优化

### 批量更新

使用 `$patch` 进行批量状态更新，避免多次响应式触发：

```typescript
// ❌ 多次单独更新
store.name = 'John'
store.age = 30
store.email = 'john@example.com'

// ✅ 批量更新
store.$patch({
  name: 'John',
  age: 30,
  email: 'john@example.com'
})
```

### 状态快照

使用状态快照进行撤销/重做功能：

```typescript
@Store({ id: 'undo-redo' })
class UndoRedoStore extends BaseStore {
  @State({ default: [] })
  history!: any[]

  @State({ default: -1 })
  currentIndex!: number

  @Action()
  saveSnapshot() {
    const snapshot = this.$getSnapshot()
    this.history = this.history.slice(0, this.currentIndex + 1)
    this.history.push(snapshot)
    this.currentIndex = this.history.length - 1
  }

  @Action()
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.$restoreSnapshot(this.history[this.currentIndex])
    }
  }

  @Action()
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      this.$restoreSnapshot(this.history[this.currentIndex])
    }
  }
}
```

## 调试和开发工具

### Pinia DevTools 集成

@ldesign/store 完全兼容 Pinia DevTools：

```typescript
// 在 Store 配置中启用开发工具
@Store({
  id: 'debug-store',
  devtools: true // 启用开发工具支持
})
class DebugStore extends BaseStore {
  // ...
}
```

### 调试信息

```typescript
const store = useMyStore()

// 获取 Store 信息
console.log('Store ID:', store.$id)
console.log('Store State:', store.$getSnapshot())
console.log('Loading States:', store.$loading.value)
console.log('Error States:', store.$errors.value)

// 监听状态变化
store.$subscribe((mutation, state) => {
  console.group(`[${store.$id}] ${mutation.type}`)
  console.log('Payload:', mutation.payload)
  console.log('State:', state)
  console.groupEnd()
})
```
