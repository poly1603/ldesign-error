---
layout: home

hero:
  name: "@ldesign/store"
  text: "现代化 Vue3 状态管理"
  tagline: 基于 Pinia 的类装饰器状态管理库
  image:
    src: /logo.svg
    alt: LDesign Store
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/basic

features:
  - icon: 🎯
    title: 类装饰器模式
    details: 使用装饰器定义状态、动作和计算属性，代码更简洁优雅
  - icon: 🔄
    title: 响应式状态
    details: 基于 Vue 3 响应式系统，自动追踪依赖变化
  - icon: 💾
    title: 状态持久化
    details: 支持 localStorage/sessionStorage 自动持久化
  - icon: ⚡
    title: 性能优化
    details: 内置缓存、防抖、节流等性能优化功能
  - icon: 🔍
    title: TypeScript 支持
    details: 完整的类型定义和智能提示
  - icon: 🧪
    title: 测试友好
    details: 易于测试的 API 设计，支持单元测试和集成测试
---

## 快速预览

```typescript
import { Action, BaseStore, Getter, State, Store, createStoreClass } from '@ldesign/store'

@Store({ id: 'counter', persist: true })
class CounterStore extends BaseStore {
  @State({ default: 0 })
  count!: number

  @Action()
  increment() {
    this.count++
  }

  @Getter()
  get doubleCount() {
    return this.count * 2
  }
}

export const useCounterStore = createStoreClass(CounterStore)
```

```vue
<template>
  <div>
    <p>Count: {{ store.count }}</p>
    <p>Double: {{ store.doubleCount }}</p>
    <button @click="store.increment()">+</button>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from './stores/counter'

const store = useCounterStore()
</script>
```

## 为什么选择 @ldesign/store？

### 🎨 优雅的 API 设计

传统的 Pinia 写法：

```typescript
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
```

使用 @ldesign/store：

```typescript
@Store({ id: 'counter' })
class CounterStore extends BaseStore {
  @State({ default: 0 })
  count!: number

  @Getter()
  get doubleCount() {
    return this.count * 2
  }

  @Action()
  increment() {
    this.count++
  }
}

export const useCounterStore = createStoreClass(CounterStore)
```

### 🚀 强大的功能

- **自动加载状态管理** - 异步操作自动处理加载状态
- **智能缓存** - 方法级别的缓存控制
- **防抖节流** - 内置防抖和节流装饰器
- **状态持久化** - 灵活的持久化配置
- **错误处理** - 自动错误捕获和状态管理

### 📈 更好的开发体验

- **完整的 TypeScript 支持** - 类型安全和智能提示
- **装饰器语法** - 声明式的状态管理
- **测试友好** - 易于模拟和测试
- **开发工具集成** - 完整的 Pinia DevTools 支持
