# 性能优化

@ldesign/store 提供了多种性能优化功能，帮助你构建高性能的应用。本章将详细介绍各种优化策略和最佳实践。

## 缓存系统

### 方法级缓存

使用 `@Cache` 装饰器缓存方法的返回值：

```typescript
@Store({ id: 'cache-demo' })
class CacheDemoStore extends BaseStore {
  @State({ default: [] })
  largeDataSet!: any[]

  // 缓存计算结果 5 秒
  @Cache(5000)
  expensiveCalculation(input: number) {
    console.log('Performing expensive calculation...')
    return this.largeDataSet
      .filter(item => item.value > input)
      .map(item => item.value * 2)
      .reduce((sum, value) => sum + value, 0)
  }

  // 缓存 API 调用结果
  @Cache(60000) // 缓存 1 分钟
  @AsyncAction()
  async fetchData(params: any) {
    console.log('Fetching data from API...')
    const response = await api.getData(params)
    return response.data
  }
}
```

### Getter 缓存

对于计算密集型的 Getter，启用缓存：

```typescript
@Store({ id: 'getter-cache' })
class GetterCacheStore extends BaseStore {
  @State({ default: [] })
  items!: { id: number, value: number, category: string }[]

  // 缓存复杂计算
  @Getter({ cache: true })
  get categorizedSummary() {
    console.log('Computing categorized summary...')
    const summary = {}
    this.items.forEach((item) => {
      if (!summary[item.category]) {
        summary[item.category] = { count: 0, total: 0 }
      }
      summary[item.category].count++
      summary[item.category].total += item.value
    })
    return summary
  }

  // 普通 Getter（每次都重新计算）
  @Getter()
  get totalCount() {
    return this.items.length
  }
}
```

### Store 级缓存配置

在 Store 级别配置缓存：

```typescript
@Store({
  id: 'store-cache',
  cache: {
    ttl: 10000, // 默认缓存时间 10 秒
    max: 100, // 最大缓存条目数
    lru: true // 启用 LRU 策略
  }
})
class StoreCacheStore extends BaseStore {
  // Store 中的缓存方法会使用这些默认配置
}
```

## 防抖和节流

### 防抖 (Debounce)

用于处理频繁触发的事件，如搜索输入：

```typescript
@Store({ id: 'debounce-demo' })
class DebounceDemoStore extends BaseStore {
  @State({ default: '' })
  searchQuery!: string

  @State({ default: [] })
  searchResults!: any[]

  // 防抖搜索，300ms 内只执行最后一次
  @Debounce(300)
  @Action()
  setSearchQuery(query: string) {
    this.searchQuery = query
    this.performSearch()
  }

  // 防抖保存，1 秒内只执行最后一次
  @Debounce(1000)
  @AsyncAction()
  async autoSave() {
    console.log('Auto saving...')
    await api.saveData(this.searchQuery)
  }

  @AsyncAction()
  async performSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults = []
      return
    }

    const results = await api.search(this.searchQuery)
    this.searchResults = results
  }
}
```

### 节流 (Throttle)

用于限制事件执行频率，如滚动事件：

```typescript
@Store({ id: 'throttle-demo' })
class ThrottleDemoStore extends BaseStore {
  @State({ default: 0 })
  scrollPosition!: number

  @State({ default: { x: 0, y: 0 } })
  mousePosition!: { x: number, y: number }

  // 节流滚动事件，每 100ms 最多执行一次
  @Throttle(100)
  @Action()
  updateScrollPosition(position: number) {
    this.scrollPosition = position
  }

  // 节流鼠标移动事件
  @Throttle(50)
  @Action()
  updateMousePosition(x: number, y: number) {
    this.mousePosition = { x, y }
  }

  // 节流网络请求
  @Throttle(2000)
  @AsyncAction()
  async sendAnalytics(data: any) {
    await api.sendAnalytics(data)
  }
}
```

## 批量更新

### 使用 $patch 进行批量更新

避免多次响应式更新，提高性能：

```typescript
@Store({ id: 'batch-demo' })
class BatchDemoStore extends BaseStore {
  @State({ default: '' })
  name!: string

  @State({ default: 0 })
  age!: number

  @State({ default: '' })
  email!: string

  @State({ default: [] })
  hobbies!: string[]

  // ❌ 不好的做法：多次单独更新
  @Action()
  updateUserBad(userData: any) {
    this.name = userData.name // 触发响应式更新
    this.age = userData.age // 触发响应式更新
    this.email = userData.email // 触发响应式更新
    this.hobbies = userData.hobbies // 触发响应式更新
  }

  // ✅ 好的做法：批量更新
  @Action()
  updateUserGood(userData: any) {
    this.$patch({
      name: userData.name,
      age: userData.age,
      email: userData.email,
      hobbies: userData.hobbies
    })
    // 只触发一次响应式更新
  }

  // 条件批量更新
  @Action()
  updateUserConditional(userData: any) {
    const updates: any = {}

    if (userData.name !== this.name) {
      updates.name = userData.name
    }
    if (userData.age !== this.age) {
      updates.age = userData.age
    }
    if (userData.email !== this.email) {
      updates.email = userData.email
    }

    if (Object.keys(updates).length > 0) {
      this.$patch(updates)
    }
  }
}
```

## 懒加载和按需加载

### 模块化 Store

将大型 Store 拆分为多个小模块：

```typescript
// 用户基础信息 Store
@Store({ id: 'user-basic' })
class UserBasicStore extends BaseStore {
  @State({ default: null })
  profile!: UserProfile | null

  @AsyncAction()
  async loadProfile() {
    this.profile = await api.getUserProfile()
  }
}

// 用户偏好设置 Store（按需加载）
@Store({ id: 'user-preferences' })
class UserPreferencesStore extends BaseStore {
  @State({ default: {} })
  preferences!: UserPreferences

  @AsyncAction()
  async loadPreferences() {
    this.preferences = await api.getUserPreferences()
  }
}

// 用户统计数据 Store（按需加载）
@Store({ id: 'user-analytics' })
class UserAnalyticsStore extends BaseStore {
  @State({ default: null })
  analytics!: UserAnalytics | null

  @AsyncAction()
  async loadAnalytics() {
    this.analytics = await api.getUserAnalytics()
  }
}
```

### 动态导入 Store

```typescript
// 动态加载 Store
async function loadUserPreferences() {
  const { useUserPreferencesStore } = await import('./stores/user-preferences')
  return useUserPreferencesStore()
}

// 在组件中使用
async function loadPreferences() {
  const preferencesStore = await loadUserPreferences()
  await preferencesStore.loadPreferences()
}
```

## 内存优化

### 状态清理

及时清理不需要的状态：

```typescript
@Store({ id: 'memory-demo' })
class MemoryDemoStore extends BaseStore {
  @State({ default: [] })
  temporaryData!: any[]

  @State({ default: new Map() })
  cache!: Map<string, any>

  @Action()
  addTemporaryData(data: any) {
    this.temporaryData.push(data)

    // 限制临时数据数量
    if (this.temporaryData.length > 1000) {
      this.temporaryData = this.temporaryData.slice(-500)
    }
  }

  @Action()
  clearTemporaryData() {
    this.temporaryData = []
  }

  @Action()
  cleanupCache() {
    // 清理过期缓存
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 300000) { // 5 分钟过期
        this.cache.delete(key)
      }
    }
  }

  // 组件卸载时清理
  @Action()
  dispose() {
    this.clearTemporaryData()
    this.cache.clear()
  }
}
```

### WeakMap 和 WeakSet

对于临时引用，使用 WeakMap 和 WeakSet：

```typescript
@Store({ id: 'weak-refs' })
class WeakRefsStore extends BaseStore {
  // 使用 WeakMap 存储临时关联数据
  private elementData = new WeakMap<Element, any>()

  @Action()
  setElementData(element: Element, data: any) {
    this.elementData.set(element, data)
    // 当 element 被垃圾回收时，关联数据也会被自动清理
  }

  @Action()
  getElementData(element: Element) {
    return this.elementData.get(element)
  }
}
```

## 计算优化

### 记忆化计算

对于复杂计算，使用记忆化：

```typescript
@Store({ id: 'memoization' })
class MemoizationStore extends BaseStore {
  @State({ default: [] })
  items!: { id: number, value: number, category: string }[]

  // 记忆化的分类统计
  private memoizedCategoryStats = new Map<string, any>()
  private lastItemsHash = ''

  @Getter()
  get categoryStats() {
    // 计算当前数据的哈希值
    const currentHash = JSON.stringify(this.items.map(i => ({ id: i.id, value: i.value, category: i.category })))

    if (currentHash === this.lastItemsHash && this.memoizedCategoryStats.size > 0) {
      // 数据未变化，返回缓存结果
      return Object.fromEntries(this.memoizedCategoryStats)
    }

    // 重新计算
    console.log('Recalculating category stats...')
    this.memoizedCategoryStats.clear()

    this.items.forEach((item) => {
      if (!this.memoizedCategoryStats.has(item.category)) {
        this.memoizedCategoryStats.set(item.category, { count: 0, total: 0, avg: 0 })
      }
      const stats = this.memoizedCategoryStats.get(item.category)!
      stats.count++
      stats.total += item.value
      stats.avg = stats.total / stats.count
    })

    this.lastItemsHash = currentHash
    return Object.fromEntries(this.memoizedCategoryStats)
  }
}
```

## 网络优化

### 请求合并

合并多个相似的网络请求：

```typescript
@Store({ id: 'request-batching' })
class RequestBatchingStore extends BaseStore {
  @State({ default: new Map() })
  users!: Map<number, User>

  private pendingUserRequests = new Set<number>()
  private userRequestTimer: NodeJS.Timeout | null = null

  @AsyncAction()
  async loadUser(userId: number) {
    if (this.users.has(userId)) {
      return this.users.get(userId)!
    }

    // 添加到待处理队列
    this.pendingUserRequests.add(userId)

    // 延迟批量请求
    if (this.userRequestTimer) {
      clearTimeout(this.userRequestTimer)
    }

    this.userRequestTimer = setTimeout(() => {
      this.batchLoadUsers()
    }, 50) // 50ms 内的请求会被合并

    // 等待批量请求完成
    return new Promise<User>((resolve) => {
      const checkUser = () => {
        if (this.users.has(userId)) {
          resolve(this.users.get(userId)!)
        }
 else {
          setTimeout(checkUser, 10)
        }
      }
      checkUser()
    })
  }

  @AsyncAction()
  private async batchLoadUsers() {
    const userIds = Array.from(this.pendingUserRequests)
    this.pendingUserRequests.clear()
    this.userRequestTimer = null

    if (userIds.length === 0)
return

    console.log(`Batch loading ${userIds.length} users...`)
    const users = await api.getUsers(userIds)

    users.forEach((user) => {
      this.users.set(user.id, user)
    })
  }
}
```

### 请求缓存

缓存网络请求结果：

```typescript
@Store({ id: 'request-cache' })
class RequestCacheStore extends BaseStore {
  @State({ default: new Map() })
  apiCache!: Map<string, { data: any, timestamp: number, ttl: number }>

  @AsyncAction()
  async cachedRequest(url: string, options: any = {}, ttl = 300000) { // 默认缓存 5 分钟
    const cacheKey = `${url}:${JSON.stringify(options)}`
    const cached = this.apiCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log('Returning cached result for:', url)
      return cached.data
    }

    console.log('Fetching fresh data for:', url)
    const data = await api.request(url, options)

    this.apiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    })

    return data
  }

  @Action()
  clearExpiredCache() {
    const now = Date.now()
    for (const [key, value] of this.apiCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.apiCache.delete(key)
      }
    }
  }
}
```

## 性能监控

### 性能指标收集

```typescript
@Store({ id: 'performance-monitor' })
class PerformanceMonitorStore extends BaseStore {
  @State({ default: [] })
  performanceMetrics!: Array<{
    action: string
    duration: number
    timestamp: number
  }>

  // 装饰器：自动记录方法执行时间
  private measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const start = performance.now()
      const result = originalMethod.apply(this, args)

      if (result && typeof result.then === 'function') {
        // 异步方法
        return result.finally(() => {
          const duration = performance.now() - start
          this.recordMetric(propertyKey, duration)
        })
      }
 else {
        // 同步方法
        const duration = performance.now() - start
        this.recordMetric(propertyKey, duration)
        return result
      }
    }
  }

  @Action()
  recordMetric(action: string, duration: number) {
    this.performanceMetrics.push({
      action,
      duration,
      timestamp: Date.now()
    })

    // 只保留最近 1000 条记录
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-500)
    }

    // 如果执行时间过长，发出警告
    if (duration > 100) {
      console.warn(`Slow operation detected: ${action} took ${duration.toFixed(2)}ms`)
    }
  }

  @Getter()
  get averagePerformance() {
    if (this.performanceMetrics.length === 0)
return {}

    const grouped = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.action]) {
        acc[metric.action] = { total: 0, count: 0 }
      }
      acc[metric.action].total += metric.duration
      acc[metric.action].count++
      return acc
    }, {} as Record<string, { total: number, count: number }>)

    const result = {}
    for (const [action, stats] of Object.entries(grouped)) {
      result[action] = {
        average: stats.total / stats.count,
        count: stats.count
      }
    }

    return result
  }
}
```

## 最佳实践总结

### 1. 缓存策略

```typescript
// ✅ 缓存计算密集型操作
@Cache(60000)
@Getter()
get expensiveCalculation() {
  return this.largeArray.reduce(/* complex logic */)
}

// ✅ 缓存网络请求
@Cache(300000)
@AsyncAction()
async fetchStaticData() {
  return await api.getStaticData()
}

// ❌ 避免缓存简单操作
@Cache(1000)
get simpleSum() {
  return this.a + this.b
}
```

### 2. 防抖节流选择

```typescript
// 搜索输入 → 防抖
@Debounce(300)
setSearchQuery(query: string) { /* ... */ }

// 滚动事件 → 节流
@Throttle(100)
updateScrollPosition(position: number) { /* ... */ }

// 自动保存 → 防抖
@Debounce(2000)
autoSave() { /* ... */ }
```

### 3. 状态管理

```typescript
// ✅ 批量更新
@Action()
updateMultipleFields(data: any) {
  this.$patch(data)
}

// ✅ 及时清理
@Action()
cleanup() {
  this.temporaryData = []
  this.cache.clear()
}

// ✅ 合理的状态结构
@State({ default: new Map() })
normalizedData!: Map<string, any>
```

### 4. 内存管理

```typescript
// ✅ 限制数组大小
if (this.logs.length > 1000) {
  this.logs = this.logs.slice(-500)
}

// ✅ 清理过期数据
const now = Date.now()
this.cache.forEach((value, key) => {
  if (now - value.timestamp > TTL) {
    this.cache.delete(key)
  }
})
```
