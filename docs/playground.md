# 交互式演示

欢迎来到 @ldesign/store 的交互式演示页面！这里展示了各种功能的代码示例。

## 🎮 计数器演示

### 基础状态管理

体验最简单的状态管理功能：

```typescript
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

  @Action()
  reset() {
    this.count = 0
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
```

### 在组件中使用

```vue
<template>
  <div class="counter">
    <div class="count-value">{{ store.count }}</div>
    <div class="count-info">
      <span>双倍: {{ store.doubleCount }}</span>
      <span>状态: {{ store.isEven ? '偶数' : '奇数' }}</span>
    </div>

    <div class="counter-controls">
      <button @click="store.decrement()" :disabled="store.count <= 0">-</button>
      <button @click="store.increment()">+</button>
      <button @click="store.incrementBy(5)">+5</button>
      <button @click="store.reset()">重置</button>
    </div>
  </div>
</template>

<script setup>
import { useCounterStore } from './stores/counter'
const store = useCounterStore()
</script>
```

## 🔐 用户登录演示

### 异步操作 + 持久化

体验异步登录和状态持久化：

```typescript
@Store({
  id: 'user',
  persist: {
    paths: ['currentUser', 'isAuthenticated']
  }
})
class UserStore extends BaseStore {
  @State({ default: false })
  isAuthenticated!: boolean

  @State({ default: null })
  currentUser!: User | null

  @AsyncAction()
  async login(credentials: LoginCredentials) {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    this.currentUser = {
      id: 1,
      username: credentials.username,
      email: `${credentials.username}@example.com`,
      role: 'user'
    }
    this.isAuthenticated = true

    return this.currentUser
  }

  @Action()
  logout() {
    this.currentUser = null
    this.isAuthenticated = false
  }

  @Getter()
  get userDisplayName() {
    return this.currentUser?.username || 'Guest'
  }
}
```

### 登录组件示例

```vue
<template>
  <div v-if="!store.isAuthenticated" class="login-form">
    <div class="form-group">
      <input v-model="loginForm.username" placeholder="用户名" />
    </div>
    <div class="form-group">
      <input v-model="loginForm.password" type="password" placeholder="密码" />
    </div>
    <div class="form-group">
      <label>
        <input v-model="loginForm.rememberMe" type="checkbox" />
        记住我
      </label>
    </div>
    <button
      @click="handleLogin"
      :disabled="store.$isLoading('login')"
      class="login-btn"
    >
      {{ store.$isLoading('login') ? '登录中...' : '登录' }}
    </button>
    <div v-if="loginError" class="error">{{ loginError }}</div>
  </div>

  <div v-else class="user-info">
    <div class="avatar">{{ store.userInitials }}</div>
    <div class="user-details">
      <h4>{{ store.userDisplayName }}</h4>
      <p>{{ store.currentUser?.email }}</p>
      <span class="role">{{ store.currentUser?.role }}</span>
    </div>
    <button @click="store.logout()" class="logout-btn">登出</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from './stores/user'

const store = useUserStore()
const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false
})
const loginError = ref('')

async function handleLogin() {
  try {
    await store.login(loginForm.value)
  } catch (error) {
    loginError.value = error.message
  }
}
</script>
```

## 🛒 购物车演示

### 复杂状态管理

体验购物车的复杂业务逻辑：

```typescript
@Store({
  id: 'cart',
  persist: true
})
class CartStore extends BaseStore {
  @State({ default: [] })
  items!: CartItem[]

  @Action()
  addItem(product: Product, quantity = 1) {
    const existingItem = this.items.find(item => item.productId === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    }
 else {
      this.items.push({
        id: Date.now(),
        productId: product.id,
        product,
        quantity,
        addedAt: new Date()
      })
    }
  }

  @Action()
  updateQuantity(itemId: number, quantity: number) {
    const item = this.items.find(item => item.id === itemId)
    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId)
      }
 else {
        item.quantity = quantity
      }
    }
  }

  @Action()
  removeItem(itemId: number) {
    this.items = this.items.filter(item => item.id !== itemId)
  }

  @Action()
  clearCart() {
    this.items = []
  }

  @Getter()
  get subtotal() {
    return this.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)
  }

  @Getter()
  get itemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  @Getter()
  get isEmpty() {
    return this.items.length === 0
  }
}
```

## ⚡ 性能优化演示

### 缓存、防抖、节流

体验性能优化功能：

```typescript
@Store({ id: 'performance' })
class PerformanceStore extends BaseStore {
  @State({ default: [] })
  searchResults!: any[]

  @State({ default: 0 })
  actualCount!: number

  @Cache(5000) // 缓存5秒
  expensiveOperation() {
    // 模拟复杂计算
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.random()
    }
    return result.toFixed(2)
  }

  @Debounce(300) // 防抖300ms
  @AsyncAction()
  async search(query: string) {
    await new Promise(resolve => setTimeout(resolve, 500))
    this.searchResults = Array.from({ length: Math.floor(Math.random() * 10) + 1 })
    return this.searchResults
  }

  @Throttle(1000) // 节流1秒
  @Action()
  throttledAction() {
    this.actualCount++
  }
}
```

### 使用示例

```vue
<template>
  <div class="performance-demo">
    <!-- 缓存演示 -->
    <div class="demo-group">
      <h4>缓存演示</h4>
      <p>点击按钮，第一次会计算，后续5秒内返回缓存结果</p>
      <button @click="testCache" :disabled="store.$isLoading('expensiveOperation')">
        {{ store.$isLoading('expensiveOperation') ? '计算中...' : '执行复杂计算' }}
      </button>
      <div v-if="cacheResult" class="result">
        结果: {{ cacheResult }} ({{ cacheTime }})
      </div>
    </div>

    <!-- 防抖演示 -->
    <div class="demo-group">
      <h4>防抖演示</h4>
      <p>快速输入，只有停止输入300ms后才会触发搜索</p>
      <input
        v-model="searchQuery"
        @input="handleSearch"
        placeholder="输入搜索关键词..."
      />
      <div v-if="store.$isLoading('search')" class="loading">搜索中...</div>
      <div v-if="store.searchResults.length > 0" class="results">
        找到 {{ store.searchResults.length }} 个结果
      </div>
    </div>

    <!-- 节流演示 -->
    <div class="demo-group">
      <h4>节流演示</h4>
      <p>快速点击，每秒最多执行一次</p>
      <button @click="handleThrottle">
        节流按钮 (点击次数: {{ throttleCount }})
      </button>
      <div class="throttle-info">
        实际执行次数: {{ store.actualCount }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePerformanceStore } from './stores/performance'

const store = usePerformanceStore()
const cacheResult = ref('')
const cacheTime = ref('')
const searchQuery = ref('')
const throttleCount = ref(0)

function testCache() {
  const start = Date.now()
  cacheResult.value = store.expensiveOperation()
  cacheTime.value = `${Date.now() - start}ms`
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    store.search(searchQuery.value)
  }
}

function handleThrottle() {
  throttleCount.value++
  store.throttledAction()
}
</script>
```

## 🔄 状态订阅演示

### 状态变化监听

实时监听状态变化：

```typescript
@Store({ id: 'subscription' })
class SubscriptionStore extends BaseStore {
  @State({ default: 0 })
  value!: number

  @Action()
  increment() {
    this.value++
  }

  @Action()
  decrement() {
    this.value--
  }

  @Action()
  reset() {
    this.value = 0
  }
}
```

### 订阅状态变化

```typescript
// 在组件中订阅状态变化
const store = useSubscriptionStore()
const mutationHistory = ref([])

const unsubscribe = store.$subscribe((mutation, state) => {
  mutationHistory.value.push({
    type: mutation.type,
    timestamp: mutation.timestamp,
    newValue: state.value
  })
})

// 清理订阅
onUnmounted(() => {
  unsubscribe()
})
```

### 组件示例

```vue
<template>
  <div class="subscription-demo">
    <div class="controls">
      <button @click="store.increment()">增加</button>
      <button @click="store.decrement()">减少</button>
      <button @click="store.reset()">重置</button>
      <button @click="clearHistory">清空历史</button>
    </div>

    <div class="current-state">
      当前值: {{ store.value }}
    </div>

    <div class="mutation-history">
      <h4>状态变化历史:</h4>
      <div class="history-list">
        <div
          v-for="(mutation, index) in mutationHistory"
          :key="index"
          class="mutation-item"
        >
          <span class="action">{{ mutation.type }}</span>
          <span class="time">{{ formatTime(mutation.timestamp) }}</span>
          <span class="value">{{ mutation.newValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useSubscriptionStore } from './stores/subscription'

const store = useSubscriptionStore()
const mutationHistory = ref([])

const unsubscribe = store.$subscribe((mutation, state) => {
  mutationHistory.value.push({
    type: mutation.type,
    timestamp: mutation.timestamp,
    newValue: state.value
  })
})

function clearHistory() {
  mutationHistory.value = []
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString()
}

onUnmounted(() => {
  unsubscribe()
})
</script>
```

## 总结

这些示例展示了 @ldesign/store 的核心功能：

- **基础状态管理** - 简单的状态定义和操作
- **异步操作** - 处理 API 调用和异步逻辑
- **状态持久化** - 自动保存和恢复状态
- **复杂业务逻辑** - 购物车等复杂场景
- **性能优化** - 缓存、防抖、节流等优化策略
- **状态监听** - 实时监听状态变化

每个示例都可以直接在你的项目中使用，只需要根据实际需求进行调整即可。

## 总结

这些示例展示了 @ldesign/store 的核心功能：

- **基础状态管理** - 简单的状态定义和操作
- **异步操作** - 处理 API 调用和异步逻辑
- **状态持久化** - 自动保存和恢复状态
- **复杂业务逻辑** - 购物车等复杂场景
- **性能优化** - 缓存、防抖、节流等优化策略
- **状态监听** - 实时监听状态变化

每个示例都提供了完整的代码，可以直接在你的项目中使用。通过这些示例，你可以快速了解 @ldesign/store 的核心功能和使用方法。
