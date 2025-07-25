# 基础示例

本页面展示了 @ldesign/store 的基础用法示例。

## 计数器示例

最简单的状态管理示例。

### Store 定义

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

  @Getter()
  get isPositive() {
    return this.count > 0
  }
}

export const useCounterStore = createStoreClass(CounterStore)
```

### Vue 组件使用

```vue
<template>
  <div class="counter-demo">
    <h2>计数器示例</h2>

    <div class="counter-display">
      <p class="count">当前计数: {{ store.count }}</p>
      <p class="double-count">双倍计数: {{ store.doubleCount }}</p>
      <p class="status">
        状态:
        <span :class="{ positive: store.isPositive, negative: !store.isPositive }">
          {{ store.isPositive ? '正数' : '非正数' }}
        </span>
        {{ store.isEven ? '偶数' : '奇数' }}
      </p>
    </div>

    <div class="counter-controls">
      <button @click="store.decrement()" :disabled="store.count <= 0">
        -1
      </button>
      <button @click="store.increment()">
        +1
      </button>
      <button @click="store.incrementBy(5)">
        +5
      </button>
      <button @click="store.incrementBy(10)">
        +10
      </button>
      <button @click="store.reset()" :disabled="store.count === 0">
        重置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from './stores/counter'

const store = useCounterStore()
</script>

<style scoped>
.counter-demo {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.counter-display {
  text-align: center;
  margin-bottom: 20px;
}

.count {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
}

.double-count {
  font-size: 18px;
  color: #666;
  margin: 10px 0;
}

.status {
  font-size: 16px;
  margin: 10px 0;
}

.positive {
  color: green;
}

.negative {
  color: red;
}

.counter-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.counter-controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.counter-controls button:hover:not(:disabled) {
  background: #0056b3;
}

.counter-controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

## 待办事项示例

展示数组状态管理和复杂操作。

### Store 定义

```typescript
interface TodoItem {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

@Store({
  id: 'todos',
  persist: {
    paths: ['items'] // 只持久化待办事项，不持久化过滤器
  }
})
class TodoStore extends BaseStore {
  @State({ default: [] })
  items!: TodoItem[]

  @State({ default: 'all' })
  filter!: 'all' | 'active' | 'completed'

  @State({ default: '' })
  newTodoText!: string

  @Action()
  addTodo(text: string) {
    if (text.trim()) {
      this.items.push({
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: new Date()
      })
      this.newTodoText = ''
    }
  }

  @Action()
  toggleTodo(id: number) {
    const todo = this.items.find(item => item.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  @Action()
  removeTodo(id: number) {
    const index = this.items.findIndex(item => item.id === id)
    if (index > -1) {
      this.items.splice(index, 1)
    }
  }

  @Action()
  updateTodoText(id: number, text: string) {
    const todo = this.items.find(item => item.id === id)
    if (todo) {
      todo.text = text.trim()
    }
  }

  @Action()
  setFilter(filter: 'all' | 'active' | 'completed') {
    this.filter = filter
  }

  @Action()
  clearCompleted() {
    this.items = this.items.filter(item => !item.completed)
  }

  @Action()
  toggleAll() {
    const allCompleted = this.items.every(item => item.completed)
    this.items.forEach((item) => {
      item.completed = !allCompleted
    })
  }

  @Getter()
  get filteredItems() {
    switch (this.filter) {
      case 'active':
        return this.items.filter(item => !item.completed)
      case 'completed':
        return this.items.filter(item => item.completed)
      default:
        return this.items
    }
  }

  @Getter()
  get totalCount() {
    return this.items.length
  }

  @Getter()
  get activeCount() {
    return this.items.filter(item => !item.completed).length
  }

  @Getter()
  get completedCount() {
    return this.items.filter(item => item.completed).length
  }

  @Getter()
  get allCompleted() {
    return this.items.length > 0 && this.items.every(item => item.completed)
  }

  @Getter()
  get hasCompleted() {
    return this.items.some(item => item.completed)
  }
}

export const useTodoStore = createStoreClass(TodoStore)
```

### Vue 组件使用

```vue
<template>
  <div class="todo-app">
    <h2>待办事项</h2>

    <!-- 添加新待办事项 -->
    <div class="todo-input">
      <input
        v-model="store.newTodoText"
        @keyup.enter="addTodo"
        placeholder="添加新的待办事项..."
        class="new-todo"
      >
      <button @click="addTodo" :disabled="!store.newTodoText.trim()">
        添加
      </button>
    </div>

    <!-- 待办事项列表 -->
    <div v-if="store.totalCount > 0" class="todo-list">
      <!-- 全选/取消全选 -->
      <div class="todo-controls">
        <label class="toggle-all">
          <input
            type="checkbox"
            :checked="store.allCompleted"
            @change="store.toggleAll()"
          >
          全选
        </label>
      </div>

      <!-- 待办事项 -->
      <div
        v-for="todo in store.filteredItems"
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
      >
        <label class="todo-toggle">
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="store.toggleTodo(todo.id)"
          >
        </label>
        <span class="todo-text" @dblclick="editTodo(todo)">
          {{ todo.text }}
        </span>
        <button @click="store.removeTodo(todo.id)" class="remove-btn">
          ×
        </button>
      </div>
    </div>

    <!-- 统计和过滤器 -->
    <div v-if="store.totalCount > 0" class="todo-footer">
      <div class="todo-stats">
        <span>{{ store.activeCount }} 项未完成</span>
      </div>

      <div class="todo-filters">
        <button
          @click="store.setFilter('all')"
          :class="{ active: store.filter === 'all' }"
        >
          全部 ({{ store.totalCount }})
        </button>
        <button
          @click="store.setFilter('active')"
          :class="{ active: store.filter === 'active' }"
        >
          未完成 ({{ store.activeCount }})
        </button>
        <button
          @click="store.setFilter('completed')"
          :class="{ active: store.filter === 'completed' }"
        >
          已完成 ({{ store.completedCount }})
        </button>
      </div>

      <div class="todo-actions">
        <button
          v-if="store.hasCompleted"
          @click="store.clearCompleted()"
          class="clear-completed"
        >
          清除已完成
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>暂无待办事项</p>
      <p>添加一个新的待办事项开始吧！</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTodoStore } from './stores/todo'

const store = useTodoStore()

function addTodo() {
  store.addTodo(store.newTodoText)
}

function editTodo(todo: TodoItem) {
  const newText = prompt('编辑待办事项:', todo.text)
  if (newText !== null) {
    store.updateTodoText(todo.id, newText)
  }
}
</script>

<style scoped>
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.todo-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.new-todo {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.todo-input button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.todo-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.todo-controls {
  margin-bottom: 10px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-toggle {
  margin-right: 10px;
}

.todo-text {
  flex: 1;
  cursor: pointer;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4444;
  font-size: 20px;
  cursor: pointer;
  padding: 0 10px;
}

.todo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #eee;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.todo-filters {
  display: flex;
  gap: 5px;
}

.todo-filters button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 3px;
}

.todo-filters button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.clear-completed {
  padding: 5px 10px;
  border: 1px solid #ff4444;
  background: white;
  color: #ff4444;
  cursor: pointer;
  border-radius: 3px;
}

.clear-completed:hover {
  background: #ff4444;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
```

## 表单状态管理示例

展示表单验证和状态管理。

### Store 定义

```typescript
interface FormData {
  name: string
  email: string
  age: number
  gender: 'male' | 'female' | ''
  interests: string[]
  bio: string
}

interface FormErrors {
  name?: string
  email?: string
  age?: string
  bio?: string
}

@Store({
  id: 'form',
  persist: {
    storage: 'sessionStorage', // 使用 sessionStorage 保存表单草稿
    paths: ['formData']
  }
})
class FormStore extends BaseStore {
  @State({
    default: {
      name: '',
      email: '',
      age: 0,
      gender: '' as const,
      interests: [],
      bio: ''
    }
  })
  formData!: FormData

  @State({ default: {} })
  errors!: FormErrors

  @State({ default: false })
  isSubmitting!: boolean

  @State({ default: false })
  isValid!: boolean

  @Action()
  updateField(field: keyof FormData, value: any) {
    this.formData = {
      ...this.formData,
      [field]: value
    }
    this.validateField(field)
    this.validateForm()
  }

  @Action()
  validateField(field: keyof FormData) {
    const errors: FormErrors = { ...this.errors }

    switch (field) {
      case 'name':
        if (!this.formData.name.trim()) {
          errors.name = '姓名不能为空'
        }
 else if (this.formData.name.length < 2) {
          errors.name = '姓名至少需要2个字符'
        }
 else {
          delete errors.name
        }
        break

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!this.formData.email) {
          errors.email = '邮箱不能为空'
        }
 else if (!emailRegex.test(this.formData.email)) {
          errors.email = '邮箱格式不正确'
        }
 else {
          delete errors.email
        }
        break

      case 'age':
        if (this.formData.age < 1) {
          errors.age = '年龄必须大于0'
        }
 else if (this.formData.age > 120) {
          errors.age = '年龄不能超过120'
        }
 else {
          delete errors.age
        }
        break

      case 'bio':
        if (this.formData.bio.length > 500) {
          errors.bio = '个人简介不能超过500字符'
        }
 else {
          delete errors.bio
        }
        break
    }

    this.errors = errors
  }

  @Action()
  validateForm() {
    // 验证所有字段
    Object.keys(this.formData).forEach((field) => {
      this.validateField(field as keyof FormData)
    })

    // 检查是否有错误
    this.isValid = Object.keys(this.errors).length === 0
      && this.formData.name.trim() !== ''
      && this.formData.email.trim() !== ''
  }

  @AsyncAction()
  async submitForm() {
    this.validateForm()

    if (!this.isValid) {
      throw new Error('表单验证失败')
    }

    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 提交成功后清空表单
    this.resetForm()

    return '提交成功！'
  }

  @Action()
  resetForm() {
    this.formData = {
      name: '',
      email: '',
      age: 0,
      gender: '',
      interests: [],
      bio: ''
    }
    this.errors = {}
    this.isValid = false
  }

  @Getter()
  get hasErrors() {
    return Object.keys(this.errors).length > 0
  }

  @Getter()
  get canSubmit() {
    return this.isValid && !this.isSubmitting
  }
}

export const useFormStore = createStoreClass(FormStore)
```

这些示例展示了 @ldesign/store 在不同场景下的使用方法，包括：

1. **基础状态管理** - 计数器示例
2. **数组操作** - 待办事项示例
3. **表单处理** - 表单验证示例
4. **持久化** - 数据自动保存和恢复
5. **计算属性** - 基于状态的派生值
6. **异步操作** - 加载状态管理

每个示例都包含完整的 Store 定义和 Vue 组件使用代码，可以直接在项目中使用。
