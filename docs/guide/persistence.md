# 状态持久化

@ldesign/store 提供了强大的状态持久化功能，支持将状态自动保存到 localStorage 或 sessionStorage，并在页面刷新后自动恢复。

## 基础用法

### 启用持久化

最简单的方式是在 Store 配置中启用持久化：

```typescript
@Store({
  id: 'user',
  persist: true // 启用默认持久化
})
class UserStore extends BaseStore {
  @State({ default: null })
  currentUser!: User | null

  @State({ default: 'light' })
  theme!: string

  @Action()
  login(user: User) {
    this.currentUser = user
  }

  @Action()
  setTheme(theme: string) {
    this.theme = theme
  }
}
```

### 自定义持久化配置

```typescript
@Store({
  id: 'settings',
  persist: {
    key: 'app-settings', // 自定义存储键名
    storage: 'localStorage', // 存储类型
    paths: ['theme', 'language'] // 只持久化指定字段
  }
})
class SettingsStore extends BaseStore {
  @State({ default: 'light' })
  theme!: string

  @State({ default: 'en' })
  language!: string

  @State({ default: false })
  debugMode!: boolean // 不会被持久化
}
```

## 配置选项

### PersistConfig 接口

```typescript
interface PersistConfig {
  key?: string // 存储键名，默认为 'ldesign-store-{storeId}'
  storage?: StorageType // 存储类型：'localStorage' | 'sessionStorage' | 'none'
  paths?: string[] // 需要持久化的状态路径
  serializer?: { // 自定义序列化器
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  ssr?: boolean // 是否在 SSR 中启用
}
```

### 存储类型

```typescript
type StorageType = 'localStorage' | 'sessionStorage' | 'none'
```

- `localStorage`: 数据持久保存，直到用户清除
- `sessionStorage`: 数据在会话期间保存，关闭标签页后清除
- `none`: 禁用持久化

## 详细配置示例

### 1. 基础配置

```typescript
// 使用默认配置
@Store({
  id: 'simple',
  persist: true
})
class SimpleStore extends BaseStore {
  @State({ default: 0 })
  count!: number
}

// 等价于
@Store({
  id: 'simple',
  persist: {
    key: 'ldesign-store-simple',
    storage: 'localStorage',
    paths: [], // 空数组表示持久化所有状态
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse
    },
    ssr: false
  }
})
class SimpleStore extends BaseStore {
  @State({ default: 0 })
  count!: number
}
```

### 2. 选择性持久化

```typescript
@Store({
  id: 'selective',
  persist: {
    paths: ['user', 'preferences.theme'] // 只持久化指定路径
  }
})
class SelectiveStore extends BaseStore {
  @State({ default: null })
  user!: User | null

  @State({ default: { theme: 'light', language: 'en' } })
  preferences!: { theme: string, language: string }

  @State({ default: [] })
  temporaryData!: any[] // 不会被持久化

  @State({ default: false })
  isLoading!: boolean // 不会被持久化
}
```

### 3. 使用 sessionStorage

```typescript
@Store({
  id: 'session',
  persist: {
    storage: 'sessionStorage' // 使用 sessionStorage
  }
})
class SessionStore extends BaseStore {
  @State({ default: '' })
  sessionData!: string
}
```

### 4. 自定义存储键

```typescript
@Store({
  id: 'custom-key',
  persist: {
    key: 'my-app-data' // 自定义键名
  }
})
class CustomKeyStore extends BaseStore {
  @State({ default: 'data' })
  value!: string
}
```

## 高级功能

### 自定义序列化器

对于复杂数据类型，可以使用自定义序列化器：

```typescript
// 支持 Date 对象的序列化器
const dateSerializer = {
  serialize: (value: any) => {
    return JSON.stringify(value, (key, val) => {
      if (val instanceof Date) {
        return { __type: 'Date', value: val.toISOString() }
      }
      return val
    })
  },
  deserialize: (value: string) => {
    return JSON.parse(value, (key, val) => {
      if (val && val.__type === 'Date') {
        return new Date(val.value)
      }
      return val
    })
  }
}

@Store({
  id: 'date-store',
  persist: {
    serializer: dateSerializer
  }
})
class DateStore extends BaseStore {
  @State({ default: new Date() })
  createdAt!: Date

  @State({ default: null })
  lastUpdated!: Date | null
}
```

### 嵌套路径持久化

支持深层嵌套对象的选择性持久化：

```typescript
@Store({
  id: 'nested',
  persist: {
    paths: [
      'user.profile.name', // 只持久化用户名
      'user.profile.avatar', // 只持久化头像
      'settings.theme', // 只持久化主题
      'cart.items' // 只持久化购物车商品
    ]
  }
})
class NestedStore extends BaseStore {
  @State({
    default: {
      profile: { name: '', email: '', avatar: '' },
      permissions: []
    }
  })
  user!: {
    profile: { name: string, email: string, avatar: string }
    permissions: string[]
  }

  @State({
    default: {
      theme: 'light',
      language: 'en',
      notifications: true
    }
  })
  settings!: {
    theme: string
    language: string
    notifications: boolean
  }

  @State({
    default: {
      items: [],
      total: 0
    }
  })
  cart!: {
    items: any[]
    total: number
  }
}
```

## SSR 支持

在服务端渲染环境中，可以启用 SSR 支持：

```typescript
@Store({
  id: 'ssr-store',
  persist: {
    ssr: true // 在 SSR 环境中也尝试持久化
  }
})
class SSRStore extends BaseStore {
  @State({ default: 'default' })
  value!: string
}
```

注意：在 SSR 环境中，`localStorage` 和 `sessionStorage` 不可用，持久化会被跳过。

## 手动持久化操作

除了自动持久化，还可以手动操作持久化数据：

```typescript
import {
  clearPersistedState,
  getPersistedState,
  setPersistedState
} from '@ldesign/store'

// 获取持久化数据
const data = getPersistedState('my-store')
console.log('Persisted data:', data)

// 手动设置持久化数据
setPersistedState('my-store', { count: 100 })

// 清除持久化数据
clearPersistedState('my-store')

// 指定存储类型
const sessionData = getPersistedState('my-store', 'sessionStorage')
setPersistedState('my-store', { data: 'session' }, 'sessionStorage')
clearPersistedState('my-store', 'sessionStorage')
```

## 实际应用示例

### 用户偏好设置

```typescript
@Store({
  id: 'user-preferences',
  persist: {
    key: 'user-prefs',
    paths: ['theme', 'language', 'fontSize', 'sidebarCollapsed']
  }
})
class UserPreferencesStore extends BaseStore {
  @State({ default: 'light' })
  theme!: 'light' | 'dark'

  @State({ default: 'en' })
  language!: string

  @State({ default: 14 })
  fontSize!: number

  @State({ default: false })
  sidebarCollapsed!: boolean

  @State({ default: false })
  isLoading!: boolean // 不持久化

  @Action()
  setTheme(theme: 'light' | 'dark') {
    this.theme = theme
  }

  @Action()
  setLanguage(language: string) {
    this.language = language
  }

  @Action()
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed
  }
}
```

### 购物车持久化

```typescript
interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

@Store({
  id: 'shopping-cart',
  persist: {
    key: 'cart-data',
    paths: ['items', 'couponCode'] // 不持久化临时状态
  }
})
class ShoppingCartStore extends BaseStore {
  @State({ default: [] })
  items!: CartItem[]

  @State({ default: '' })
  couponCode!: string

  @State({ default: false })
  isCheckingOut!: boolean // 不持久化

  @State({ default: null })
  checkoutError!: string | null // 不持久化

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
    this.couponCode = ''
  }

  @Getter()
  get total() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }
}
```

### 表单草稿保存

```typescript
@Store({
  id: 'form-draft',
  persist: {
    storage: 'sessionStorage', // 使用 sessionStorage，关闭标签页后清除
    paths: ['formData']
  }
})
class FormDraftStore extends BaseStore {
  @State({ default: {} })
  formData!: Record<string, any>

  @State({ default: false })
  isSaving!: boolean // 不持久化

  @Action()
  updateField(field: string, value: any) {
    this.formData = {
      ...this.formData,
      [field]: value
    }
  }

  @Action()
  clearDraft() {
    this.formData = {}
  }

  @AsyncAction()
  async saveDraft() {
    // 模拟保存到服务器
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Draft saved:', this.formData)
  }
}
```

## 最佳实践

### 1. 选择合适的存储类型

- **localStorage**: 用于用户偏好、购物车等需要长期保存的数据
- **sessionStorage**: 用于表单草稿、临时设置等会话级数据

### 2. 合理选择持久化字段

```typescript
// ✅ 好的做法：只持久化必要的数据
@Store({
  id: 'good-practice',
  persist: {
    paths: ['user', 'settings', 'cart.items'] // 只持久化核心数据
  }
})
class GoodPracticeStore extends BaseStore {
  @State({ default: null })
  user!: User | null // 持久化

  @State({ default: {} })
  settings!: any // 持久化

  @State({ default: { items: [], total: 0 } })
  cart!: { items: any[], total: number } // 只持久化 items

  @State({ default: false })
  isLoading!: boolean // 不持久化

  @State({ default: null })
  error!: Error | null // 不持久化
}
```

### 3. 处理持久化错误

```typescript
@Store({
  id: 'error-handling',
  persist: {
    serializer: {
      serialize: (value) => {
        try {
          return JSON.stringify(value)
        }
 catch (error) {
          console.warn('Failed to serialize state:', error)
          return '{}'
        }
      },
      deserialize: (value) => {
        try {
          return JSON.parse(value)
        }
 catch (error) {
          console.warn('Failed to deserialize state:', error)
          return {}
        }
      }
    }
  }
})
class ErrorHandlingStore extends BaseStore {
  // ...
}
```

### 4. 数据迁移

当 Store 结构发生变化时，处理旧数据：

```typescript
@Store({
  id: 'migration',
  persist: {
    serializer: {
      serialize: JSON.stringify,
      deserialize: (value) => {
        const data = JSON.parse(value)

        // 数据迁移逻辑
        if (data.version === undefined) {
          // 迁移到 v1
          data.version = 1
          data.newField = 'default'
        }

        if (data.version === 1) {
          // 迁移到 v2
          data.version = 2
          data.renamedField = data.oldField
          delete data.oldField
        }

        return data
      }
    }
  }
})
class MigrationStore extends BaseStore {
  @State({ default: 2 })
  version!: number

  @State({ default: 'default' })
  newField!: string

  @State({ default: 'renamed' })
  renamedField!: string
}
```
