# 快速开始

## 安装

::: code-group

```bash [pnpm]
pnpm add @ldesign/store pinia vue
```

```bash [npm]
npm install @ldesign/store pinia vue
```

```bash [yarn]
yarn add @ldesign/store pinia vue
```

:::

## 设置

### 1. 安装 Pinia

首先在你的 Vue 应用中设置 Pinia：

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### 2. 创建你的第一个 Store

```typescript
// stores/counter.ts
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

  @Getter()
  get isEven() {
    return this.count % 2 === 0
  }
}

export const useCounterStore = createStoreClass(CounterStore)
```

### 3. 在组件中使用

```vue
<template>
  <div class="counter">
    <h2>计数器: {{ store.count }}</h2>
    <p>双倍值: {{ store.doubleCount }}</p>
    <p>是否为偶数: {{ store.isEven ? '是' : '否' }}</p>

    <div class="buttons">
      <button @click="store.increment()">+1</button>
      <button @click="store.decrement()">-1</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
</script>
```

## 核心装饰器

### @Store 装饰器

`@Store` 装饰器用于定义 Store 类：

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

### @State 装饰器

`@State` 装饰器用于定义响应式状态：

```typescript
@State({ default: 0 })
count!: number

@State({ default: [] })
items!: Item[]

@State({ default: { name: '', email: '' } })
user!: User
```

### @Action 装饰器

`@Action` 装饰器用于定义修改状态的方法：

```typescript
@Action()
increment() {
  this.count++
}

@Action({ debounce: { delay: 300 } })
search(query: string) {
  // 防抖搜索
  this.searchQuery = query
}
```

### @Getter 装饰器

`@Getter` 装饰器用于定义计算属性：

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

## 下一步

现在你已经了解了基础用法，可以继续学习：

- [核心概念](/guide/concepts) - 深入了解 Store 的工作原理
- [装饰器](/guide/decorators) - 学习所有可用的装饰器
- [状态持久化](/guide/persistence) - 配置状态持久化
- [性能优化](/guide/performance) - 优化应用性能
- [示例](/examples/basic) - 查看更多实际示例
