# 插件 API

## 持久化插件

### createPersistPlugin()

创建状态持久化插件。

#### 语法

```typescript
createPersistPlugin(config?: PersistConfig): (store: Store) => void
```

#### 参数

##### PersistConfig

```typescript
interface PersistConfig {
  key?: string // 存储键名
  storage?: StorageType // 存储类型
  paths?: string[] // 需要持久化的状态路径
  serializer?: { // 自定义序列化器
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  ssr?: boolean // 是否在 SSR 中启用
}

type StorageType = 'localStorage' | 'sessionStorage' | 'none'
```

#### 示例

```typescript
import { createPersistPlugin } from '@ldesign/store'

// 基础用法
const persistPlugin = createPersistPlugin()

// 自定义配置
const customPersistPlugin = createPersistPlugin({
  key: 'my-app-data',
  storage: 'localStorage',
  paths: ['user', 'settings.theme'],
  serializer: {
    serialize: JSON.stringify,
    deserialize: JSON.parse
  }
})

// 在 Store 中使用
@Store({
  id: 'user',
  persist: {
    key: 'user-data',
    paths: ['profile', 'preferences']
  }
})
class UserStore extends BaseStore {
  // ...
}
```

### 持久化工具函数

#### getPersistedState()

获取持久化的状态数据。

```typescript
getPersistedState(
  storeId: string,
  storageType?: StorageType
): any | null
```

**参数**:

- `storeId`: Store 的 ID
- `storageType`: 存储类型（默认 'localStorage'）

**示例**:

```typescript
import { getPersistedState } from '@ldesign/store'

const data = getPersistedState('user-store')
console.log('Persisted data:', data)

const sessionData = getPersistedState('temp-store', 'sessionStorage')
```

#### setPersistedState()

手动设置持久化数据。

```typescript
setPersistedState(
  storeId: string,
  data: any,
  storageType?: StorageType
): void
```

**参数**:

- `storeId`: Store 的 ID
- `data`: 要保存的数据
- `storageType`: 存储类型（默认 'localStorage'）

**示例**:

```typescript
import { setPersistedState } from '@ldesign/store'

setPersistedState('user-store', { name: 'John', age: 30 })
setPersistedState('temp-store', { session: 'data' }, 'sessionStorage')
```

#### clearPersistedState()

清除持久化数据。

```typescript
clearPersistedState(
  storeId: string,
  storageType?: StorageType
): void
```

**参数**:

- `storeId`: Store 的 ID
- `storageType`: 存储类型（默认 'localStorage'）

**示例**:

```typescript
import { clearPersistedState } from '@ldesign/store'

clearPersistedState('user-store')
clearPersistedState('temp-store', 'sessionStorage')
```

## 缓存插件

### createCachePlugin()

创建缓存插件。

#### 语法

```typescript
createCachePlugin(config?: CacheConfig): (store: Store) => void
```

#### 参数

##### CacheConfig

```typescript
interface CacheConfig {
  ttl?: number // 缓存时间（毫秒）
  max?: number // 最大缓存数量
  lru?: boolean // 是否启用 LRU 策略
}
```

#### 示例

```typescript
import { createCachePlugin } from '@ldesign/store'

// 基础用法
const cachePlugin = createCachePlugin()

// 自定义配置
const customCachePlugin = createCachePlugin({
  ttl: 300000, // 5 分钟
  max: 100, // 最多 100 个缓存项
  lru: true // 启用 LRU
})

// 在 Store 中使用
@Store({
  id: 'data',
  cache: {
    ttl: 60000,
    max: 50
  }
})
class DataStore extends BaseStore {
  // ...
}
```

### createCacheDecorator()

创建缓存装饰器。

#### 语法

```typescript
createCacheDecorator(config?: CacheConfig): MethodDecorator
```

#### 示例

```typescript
import { createCacheDecorator } from '@ldesign/store'

const Cache5Min = createCacheDecorator({ ttl: 300000 })

@Store({ id: 'custom-cache' })
class CustomCacheStore extends BaseStore {
  @Cache5Min
  expensiveMethod(input: number) {
    return input * Math.random()
  }
}
```

### 缓存管理函数

#### clearAllCaches()

清除所有缓存。

```typescript
clearAllCaches(): void
```

**示例**:

```typescript
import { clearAllCaches } from '@ldesign/store'

clearAllCaches()
```

#### getCacheStats()

获取缓存统计信息。

```typescript
getCacheStats(): Record<string, any>
```

**返回值**: 包含各个 Store 缓存统计的对象

**示例**:

```typescript
import { getCacheStats } from '@ldesign/store'

const stats = getCacheStats()
console.log('Cache statistics:', stats)

// 输出示例:
// {
//   'user-store': {
//     size: 10,
//     maxSize: 100,
//     ttl: 300000,
//     totalAccess: 150,
//     averageAccess: 15
//   }
// }
```

#### cacheManager

缓存管理器实例，提供高级缓存操作。

```typescript
interface CacheManager {
  getCache: (storeId: string, config: CacheConfig) => LRUCache
  clearCache: (storeId: string) => void
  removeCache: (storeId: string) => void
  getAllStats: () => Record<string, any>
}
```

**示例**:

```typescript
import { cacheManager } from '@ldesign/store'

// 获取特定 Store 的缓存
const cache = cacheManager.getCache('my-store', { ttl: 60000 })

// 清除特定 Store 的缓存
cacheManager.clearCache('my-store')

// 移除特定 Store 的缓存
cacheManager.removeCache('my-store')

// 获取所有缓存统计
const allStats = cacheManager.getAllStats()
```

## LRU 缓存类

### LRUCache

内置的 LRU 缓存实现。

#### 构造函数

```typescript
new LRUCache<T>(maxSize?: number, ttl?: number)
```

**参数**:

- `maxSize`: 最大缓存数量（默认 100）
- `ttl`: 缓存时间（默认 5 分钟）

#### 方法

##### get()

获取缓存值。

```typescript
get(key: string): T | undefined
```

##### set()

设置缓存值。

```typescript
set(key: string, value: T): void
```

##### has()

检查是否存在缓存。

```typescript
has(key: string): boolean
```

##### delete()

删除缓存项。

```typescript
delete(key: string): boolean
```

##### clear()

清空所有缓存。

```typescript
clear(): void
```

##### size()

获取缓存数量。

```typescript
size(): number
```

##### getStats()

获取缓存统计信息。

```typescript
getStats(): {
  size: number
  maxSize: number
  ttl: number
  totalAccess: number
  averageAccess: number
}
```

#### 示例

```typescript
import { LRUCache } from '@ldesign/store'

const cache = new LRUCache<string>(50, 60000) // 最多 50 项，1 分钟过期

// 设置缓存
cache.set('key1', 'value1')
cache.set('key2', 'value2')

// 获取缓存
const value = cache.get('key1') // 'value1'

// 检查缓存
if (cache.has('key1')) {
  console.log('Cache hit')
}

// 获取统计信息
const stats = cache.getStats()
console.log('Cache stats:', stats)

// 清空缓存
cache.clear()
```

## 自定义插件

### 插件接口

```typescript
interface StorePlugin {
  name: string // 插件名称
  install: (store: Store, options?: any) => void // 插件安装函数
  options?: any // 插件选项
}
```

### 创建自定义插件

```typescript
// 日志插件示例
function createLoggerPlugin(options: { prefix?: string } = {}) {
  return function loggerPlugin(store: Store) {
    const prefix = options.prefix || '[Store]'

    // 监听所有 Action
    store.$onAction(({ name, args, after, onError }) => {
      console.log(`${prefix} Action ${name} called with:`, args)

      after((result) => {
        console.log(`${prefix} Action ${name} completed with:`, result)
      })

      onError((error) => {
        console.error(`${prefix} Action ${name} failed:`, error)
      })
    })

    // 监听状态变化
    store.$subscribe((mutation, state) => {
      console.log(`${prefix} State changed:`, {
        type: mutation.type,
        payload: mutation.payload,
        state
      })
    })
  }
}

// 使用自定义插件
@Store({ id: 'logged-store' })
class LoggedStore extends BaseStore {
  @State({ default: 0 })
  count!: number

  @Action()
  increment() {
    this.count++
  }
}

// 手动应用插件
const store = useLoggedStore()
const loggerPlugin = createLoggerPlugin({ prefix: '[MyApp]' })
loggerPlugin(store.$store)
```

### 插件最佳实践

#### 1. 插件命名

```typescript
// ✅ 好的命名
function createAnalyticsPlugin() { /* ... */ }
function createValidationPlugin() { /* ... */ }

// ❌ 避免的命名
function plugin() { /* ... */ }
function myPlugin() { /* ... */ }
```

#### 2. 选项处理

```typescript
function createMyPlugin(options: MyPluginOptions = {}) {
  // 合并默认选项
  const finalOptions = {
    enabled: true,
    debug: false,
    ...options
  }

  return function myPlugin(store: Store) {
    if (!finalOptions.enabled)
return

    // 插件逻辑
  }
}
```

#### 3. 错误处理

```typescript
function createSafePlugin() {
  return function safePlugin(store: Store) {
    try {
      // 插件逻辑
    }
 catch (error) {
      console.warn('[Plugin] Error occurred:', error)
    }
  }
}
```

#### 4. 清理资源

```typescript
function createCleanupPlugin() {
  return function cleanupPlugin(store: Store) {
    const cleanup = () => {
      // 清理逻辑
    }

    // 在 Store 销毁时清理
    store.$dispose = () => {
      cleanup()
      // 调用原始的 dispose 方法
    }
  }
}
```

## 插件组合

多个插件可以组合使用：

```typescript
@Store({
  id: 'multi-plugin',
  persist: true, // 持久化插件
  cache: { ttl: 60000 } // 缓存插件
})
class MultiPluginStore extends BaseStore {
  // ...
}

// 手动应用额外插件
const store = useMultiPluginStore()
const loggerPlugin = createLoggerPlugin()
const analyticsPlugin = createAnalyticsPlugin()

loggerPlugin(store.$store)
analyticsPlugin(store.$store)
```
