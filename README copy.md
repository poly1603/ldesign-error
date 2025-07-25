# @ldesign/store

🚀 基于 Pinia 的现代化 Vue3 状态管理库

## ✨ 特性

- 🎯 **类装饰器模式** - 使用装饰器定义状态、动作和计算属性
- 🔄 **响应式状态** - 基于 Vue 3 响应式系统
- 💾 **状态持久化** - 支持 localStorage/sessionStorage 自动持久化
- ⚡ **性能优化** - 内置缓存、防抖、节流等性能优化功能
- 🔍 **TypeScript 支持** - 完整的类型定义和智能提示
- 🧪 **测试友好** - 易于测试的 API 设计
- 🛠️ **开发工具** - 完整的 Pinia DevTools 支持
- 📦 **轻量级** - 基于 Pinia，无额外依赖负担

## 📦 安装

```bash
# pnpm
pnpm add @ldesign/store pinia vue

# npm
npm install @ldesign/store pinia vue

# yarn
yarn add @ldesign/store pinia vue
```

## 🛠️ 开发者工具

如果你是项目贡献者或想要本地开发，可以使用我们的交互式开发工具：

```bash
# 克隆项目
git clone <repo-url>
cd ldesign/packages/store

# 安装依赖
pnpm install

# 启动开发工具菜单
pnpm dev:menu
```

开发工具提供了完整的开发、测试、构建、发布流程，包括：

- 🚀 一键智能提交
- 💻 开发环境启动
- 🔍 代码质量检查
- 📦 多格式构建
- 🚀 自动化发布
- 📊 性能分析

详细使用方法请查看 [快速开始指南](QUICK_START.md) 和 [Token 配置指南](docs/setup/tokens.md)。

## 🚀 快速开始

### 1. 设置 Pinia

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### 2. 创建 Store 类

```typescript
import { Action, BaseStore, Getter, State, Store, createStoreClass } from '@ldesign/store'

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

  @Getter()
  get doubleCount() {
    return this.count * 2
  }
}

export const useCounterStore = createStoreClass(CounterStore)
```

### 3. 在组件中使用

```vue
<template>
  <div>
    <p>Count: {{ store.count }}</p>
    <p>Double: {{ store.doubleCount }}</p>
    <button @click="store.increment()">+</button>
    <button @click="store.decrement()">-</button>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from './stores/counter'

const store = useCounterStore()
</script>
```

## 📖 核心概念

### Store 装饰器

使用 `@Store` 装饰器定义 Store 类：

```typescript
@Store({
  id: 'user',
  persist: true, // 启用持久化
  cache: { ttl: 5000 } // 启用缓存
})
class UserStore extends BaseStore {
  // ...
}
```

### State 装饰器

使用 `@State` 装饰器定义响应式状态：

```typescript
@State({ default: 0 })
count!: number

@State({ default: [] })
items!: Item[]

@State({ default: { name: '', email: '' } })
user!: User
```

### Action 装饰器

使用 `@Action` 装饰器定义状态修改方法：

```typescript
@Action()
increment() {
  this.count++
}

@Action({ debounce: { delay: 300 } })
search(query: string) {
  // 防抖搜索
}

@AsyncAction()  // 自动处理加载状态
async fetchData() {
  const data = await api.getData()
  this.data = data
  return data
}
```

### Getter 装饰器

使用 `@Getter` 装饰器定义计算属性：

```typescript
@Getter()
get fullName() {
  return `${this.firstName} ${this.lastName}`
}

@Getter({ cache: true })
get expensiveComputation() {
  // 缓存计算结果
  return this.items.reduce((sum, item) => sum + item.value, 0)
}
```

## 🔧 高级功能

### 状态持久化

```typescript
@Store({
  id: 'settings',
  persist: {
    key: 'app-settings',
    storage: 'localStorage',
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

### 缓存和性能优化

```typescript
@Store({ id: 'data' })
class DataStore extends BaseStore {
  @Cache(5000) // 缓存 5 秒
  expensiveOperation(input: number) {
    return input * Math.random()
  }

  @Debounce(300) // 防抖 300ms
  @Action()
  search(query: string) {
    this.searchQuery = query
  }

  @Throttle(1000) // 节流 1 秒
  @Action()
  saveData() {
    // 保存操作
  }
}
```

### 异步操作和加载状态

```typescript
@Store({ id: 'api' })
class ApiStore extends BaseStore {
  @State({ default: null })
  data!: any

  @AsyncAction() // 自动管理加载状态
  async fetchData() {
    const response = await fetch('/api/data')
    this.data = await response.json()
    return this.data
  }

  @Getter()
  get isLoading() {
    return this.$isLoading('fetchData')
  }

  @Getter()
  get error() {
    return this.$getError('fetchData')
  }
}
```

### 状态订阅

```typescript
const store = useMyStore()

// 订阅状态变化
const unsubscribe = store.$subscribe((mutation, state) => {
  console.log('State changed:', mutation.type, state)
})

// 清理订阅
unsubscribe()
```

## 📚 文档

完整的文档请访问：[https://ldesign-store.netlify.app](https://ldesign-store.netlify.app)

- [快速开始](https://ldesign-store.netlify.app/guide/getting-started) - 5分钟上手指南
- [核心概念](https://ldesign-store.netlify.app/guide/concepts) - 深入了解设计理念
- [装饰器详解](https://ldesign-store.netlify.app/guide/decorators) - 所有装饰器的使用方法
- [状态持久化](https://ldesign-store.netlify.app/guide/persistence) - 数据持久化配置
- [性能优化](https://ldesign-store.netlify.app/guide/performance) - 性能优化最佳实践
- [API 参考](https://ldesign-store.netlify.app/api/store-class) - 完整的 API 文档
- [实际示例](https://ldesign-store.netlify.app/examples/basic) - 真实项目示例
- [交互式演示](https://ldesign-store.netlify.app/playground) - 在线体验所有功能

## 🎮 在线体验

访问我们的 [交互式演示页面](https://ldesign-store.netlify.app/playground) 立即体验：

- 🎯 基础状态管理
- 🔐 用户登录系统
- 🛒 购物车功能
- ⚡ 性能优化特性
- 🔄 状态订阅监听

## 📦 多种引入方式

### 完整引入

```typescript
import { Action, BaseStore, Getter, State, Store, createStoreClass } from '@ldesign/store'
```

### 按需引入

```typescript
// 只引入装饰器
import { Action, State, Store } from '@ldesign/store/decorators'

// 只引入插件
import { createPersistPlugin } from '@ldesign/store/plugins/persist'
import { createCachePlugin } from '@ldesign/store/plugins/cache'

// 只引入核心类
import { BaseStore, createStoreClass } from '@ldesign/store/store-class'
```

## 🏗️ 构建输出

本包提供多种格式的构建输出：

- **ESM** (`es/`): 现代 ES 模块格式，支持 Tree Shaking
- **CommonJS** (`lib/`): Node.js 兼容格式
- **UMD** (`dist/`): 浏览器直接使用格式
- **TypeScript** (`types/`): 完整的类型声明文件

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/poly1603/ldesign-store.git
cd ldesign-store/packages/store

# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 运行测试
pnpm test

# 构建
pnpm build

# 文档开发
pnpm docs:dev
```

## 📄 许可证

[MIT License](LICENSE) © 2024 LDesign Team

## 🙏 致谢

感谢以下优秀的开源项目：

- [Pinia](https://pinia.vuejs.org/) - 优秀的 Vue 状态管理库
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

---

如果这个项目对你有帮助，请给我们一个 ⭐️！
