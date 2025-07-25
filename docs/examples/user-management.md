# 用户管理示例

本示例展示了如何使用 @ldesign/store 构建一个完整的用户管理系统，包括登录、用户信息管理、权限控制等功能。

## Store 定义

```typescript
import { Action, AsyncAction, BaseStore, Getter, State, Store, createStoreClass } from '@ldesign/store'

// 类型定义
interface User {
  id: number
  username: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'guest'
  createdAt: string
  lastLoginAt?: string
}

interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

@Store({
  id: 'user',
  persist: {
    key: 'user-session',
    paths: ['currentUser', 'preferences', 'isAuthenticated'],
    storage: 'localStorage'
  }
})
class UserStore extends BaseStore {
  // 认证状态
  @State({ default: false })
  isAuthenticated!: boolean

  @State({ default: null })
  currentUser!: User | null

  @State({ default: null })
  authToken!: string | null

  // 用户列表（管理员功能）
  @State({ default: [] })
  users!: User[]

  @State({ default: null })
  selectedUser!: User | null

  // 用户偏好设置
  @State({
    default: {
      theme: 'auto' as const,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    }
  })
  preferences!: UserPreferences

  // 登录相关
  @AsyncAction()
  async login(credentials: LoginCredentials) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        throw new Error('登录失败：用户名或密码错误')
      }

      const data = await response.json()

      this.authToken = data.token
      this.currentUser = data.user
      this.isAuthenticated = true

      // 设置认证头
      this.setAuthHeader(data.token)

      return data.user
    }
 catch (error) {
      this.logout()
      throw error
    }
  }

  @AsyncAction()
  async logout() {
    try {
      if (this.authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.authToken}` }
        })
      }
    }
 catch (error) {
      console.warn('登出请求失败:', error)
    }
 finally {
      this.clearAuthState()
    }
  }

  @Action()
  clearAuthState() {
    this.isAuthenticated = false
    this.currentUser = null
    this.authToken = null
    this.users = []
    this.selectedUser = null
    this.removeAuthHeader()
  }

  // 用户信息管理
  @AsyncAction()
  async fetchCurrentUser() {
    if (!this.authToken) {
      throw new Error('未登录')
    }

    const response = await fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.logout()
        throw new Error('登录已过期')
      }
      throw new Error('获取用户信息失败')
    }

    const user = await response.json()
    this.currentUser = user
    return user
  }

  @AsyncAction()
  async updateProfile(updates: Partial<User>) {
    if (!this.currentUser) {
      throw new Error('未登录')
    }

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('更新用户信息失败')
    }

    const updatedUser = await response.json()
    this.currentUser = updatedUser
    return updatedUser
  }

  @AsyncAction()
  async changePassword(oldPassword: string, newPassword: string) {
    const response = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '密码修改失败')
    }

    return '密码修改成功'
  }

  // 用户偏好设置
  @Action()
  updatePreferences(updates: Partial<UserPreferences>) {
    this.preferences = {
      ...this.preferences,
      ...updates
    }
  }

  @AsyncAction()
  async savePreferences() {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(this.preferences)
    })

    if (!response.ok) {
      throw new Error('保存偏好设置失败')
    }

    return '偏好设置已保存'
  }

  // 用户管理（管理员功能）
  @AsyncAction()
  async fetchUsers(page = 1, limit = 20) {
    const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    })

    if (!response.ok) {
      throw new Error('获取用户列表失败')
    }

    const data = await response.json()
    this.users = data.users
    return data
  }

  @AsyncAction()
  async createUser(userData: Omit<User, 'id' | 'createdAt'>) {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      throw new Error('创建用户失败')
    }

    const newUser = await response.json()
    this.users.push(newUser)
    return newUser
  }

  @AsyncAction()
  async updateUser(userId: number, updates: Partial<User>) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('更新用户失败')
    }

    const updatedUser = await response.json()
    const index = this.users.findIndex(u => u.id === userId)
    if (index > -1) {
      this.users[index] = updatedUser
    }

    // 如果更新的是当前用户
    if (this.currentUser?.id === userId) {
      this.currentUser = updatedUser
    }

    return updatedUser
  }

  @AsyncAction()
  async deleteUser(userId: number) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.authToken}` }
    })

    if (!response.ok) {
      throw new Error('删除用户失败')
    }

    this.users = this.users.filter(u => u.id !== userId)

    if (this.selectedUser?.id === userId) {
      this.selectedUser = null
    }

    return '用户已删除'
  }

  @Action()
  selectUser(user: User | null) {
    this.selectedUser = user
  }

  // 工具方法
  @Action()
  private setAuthHeader(token: string) {
    // 设置全局请求头
    if (typeof window !== 'undefined') {
      (window as any).authToken = token
    }
  }

  @Action()
  private removeAuthHeader() {
    if (typeof window !== 'undefined') {
      delete (window as any).authToken
    }
  }

  // 计算属性
  @Getter()
  get isAdmin() {
    return this.currentUser?.role === 'admin'
  }

  @Getter()
  get isUser() {
    return this.currentUser?.role === 'user'
  }

  @Getter()
  get isGuest() {
    return !this.isAuthenticated || this.currentUser?.role === 'guest'
  }

  @Getter()
  get userDisplayName() {
    return this.currentUser?.username || 'Guest'
  }

  @Getter()
  get userInitials() {
    if (!this.currentUser?.username)
return 'G'
    return this.currentUser.username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  @Getter()
  get canManageUsers() {
    return this.isAdmin
  }

  @Getter()
  get totalUsers() {
    return this.users.length
  }

  @Getter()
  get activeUsers() {
    return this.users.filter(user => user.role !== 'guest')
  }

  @Getter()
  get adminUsers() {
    return this.users.filter(user => user.role === 'admin')
  }

  // 权限检查
  @Getter()
  get permissions() {
    if (!this.currentUser)
return []

    const basePermissions = ['read:profile', 'update:profile']

    if (this.isAdmin) {
      return [
        ...basePermissions,
        'read:users',
        'create:users',
        'update:users',
        'delete:users',
        'manage:system'
      ]
    }

    if (this.isUser) {
      return [
        ...basePermissions,
        'create:content',
        'update:own-content'
      ]
    }

    return basePermissions
  }

  @Action()
  hasPermission(permission: string) {
    return this.permissions.includes(permission)
  }
}

export const useUserStore = createStoreClass(UserStore)
```

## Vue 组件使用

### 登录组件

```vue
<template>
  <div class="login-form">
    <h2>用户登录</h2>

    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="credentials.username"
          type="text"
          required
          :disabled="userStore.$isLoading('login')"
        >
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="credentials.password"
          type="password"
          required
          :disabled="userStore.$isLoading('login')"
        >
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            v-model="credentials.rememberMe"
            type="checkbox"
            :disabled="userStore.$isLoading('login')"
          >
          记住我
        </label>
      </div>

      <button
        type="submit"
        :disabled="userStore.$isLoading('login') || !canSubmit"
        class="login-btn"
      >
        <span v-if="userStore.$isLoading('login')">登录中...</span>
        <span v-else>登录</span>
      </button>

      <div v-if="loginError" class="error-message">
        {{ loginError }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const credentials = ref({
  username: '',
  password: '',
  rememberMe: false
})

const loginError = ref('')

const canSubmit = computed(() => {
  return credentials.value.username.trim() && credentials.value.password.trim()
})

async function handleLogin() {
  try {
    loginError.value = ''
    await userStore.login(credentials.value)

    // 登录成功，跳转到首页
    router.push('/')
  } catch (error) {
    loginError.value = error.message || '登录失败'
  }
}
</script>
```

### 用户资料组件

```vue
<template>
  <div class="user-profile">
    <h2>个人资料</h2>

    <div class="profile-header">
      <div class="avatar">
        <img v-if="userStore.currentUser?.avatar" :src="userStore.currentUser.avatar" alt="头像">
        <div v-else class="avatar-placeholder">
          {{ userStore.userInitials }}
        </div>
      </div>
      <div class="user-info">
        <h3>{{ userStore.userDisplayName }}</h3>
        <p>{{ userStore.currentUser?.email }}</p>
        <span class="role-badge" :class="userStore.currentUser?.role">
          {{ roleText }}
        </span>
      </div>
    </div>

    <form @submit.prevent="handleUpdateProfile">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="profileForm.username"
          type="text"
          required
        >
      </div>

      <div class="form-group">
        <label for="email">邮箱</label>
        <input
          id="email"
          v-model="profileForm.email"
          type="email"
          required
        >
      </div>

      <button
        type="submit"
        :disabled="userStore.$isLoading('updateProfile')"
        class="update-btn"
      >
        <span v-if="userStore.$isLoading('updateProfile')">更新中...</span>
        <span v-else>更新资料</span>
      </button>
    </form>

    <!-- 偏好设置 -->
    <div class="preferences-section">
      <h3>偏好设置</h3>

      <div class="form-group">
        <label for="theme">主题</label>
        <select
          id="theme"
          v-model="userStore.preferences.theme"
          @change="handlePreferenceChange"
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="auto">跟随系统</option>
        </select>
      </div>

      <div class="form-group">
        <label for="language">语言</label>
        <select
          id="language"
          v-model="userStore.preferences.language"
          @change="handlePreferenceChange"
        >
          <option value="zh-CN">中文</option>
          <option value="en-US">English</option>
        </select>
      </div>

      <div class="notifications">
        <h4>通知设置</h4>
        <label class="checkbox-label">
          <input
            v-model="userStore.preferences.notifications.email"
            type="checkbox"
            @change="handlePreferenceChange"
          >
          邮件通知
        </label>
        <label class="checkbox-label">
          <input
            v-model="userStore.preferences.notifications.push"
            type="checkbox"
            @change="handlePreferenceChange"
          >
          推送通知
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const profileForm = ref({
  username: '',
  email: ''
})

const roleText = computed(() => {
  const roleMap = {
    admin: '管理员',
    user: '用户',
    guest: '访客'
  }
  return roleMap[userStore.currentUser?.role || 'guest']
})

onMounted(() => {
  if (userStore.currentUser) {
    profileForm.value = {
      username: userStore.currentUser.username,
      email: userStore.currentUser.email
    }
  }
})

async function handleUpdateProfile() {
  try {
    await userStore.updateProfile(profileForm.value)
    // 显示成功消息
  } catch (error) {
    // 显示错误消息
  }
}

async function handlePreferenceChange() {
  try {
    await userStore.savePreferences()
  } catch (error) {
    console.error('保存偏好设置失败:', error)
  }
}
</script>
```

### 用户管理组件（管理员）

```vue
<template>
  <div v-if="userStore.canManageUsers" class="user-management">
    <h2>用户管理</h2>

    <div class="management-header">
      <div class="stats">
        <div class="stat-item">
          <span class="stat-number">{{ userStore.totalUsers }}</span>
          <span class="stat-label">总用户数</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ userStore.activeUsers.length }}</span>
          <span class="stat-label">活跃用户</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ userStore.adminUsers.length }}</span>
          <span class="stat-label">管理员</span>
        </div>
      </div>

      <button @click="showCreateForm = true" class="create-btn">
        创建用户
      </button>
    </div>

    <div class="user-list">
      <div
        v-for="user in userStore.users"
        :key="user.id"
        class="user-item"
        :class="{ selected: userStore.selectedUser?.id === user.id }"
        @click="userStore.selectUser(user)"
      >
        <div class="user-avatar">
          {{ getUserInitials(user) }}
        </div>
        <div class="user-details">
          <h4>{{ user.username }}</h4>
          <p>{{ user.email }}</p>
          <span class="role-badge" :class="user.role">{{ user.role }}</span>
        </div>
        <div class="user-actions">
          <button @click.stop="editUser(user)">编辑</button>
          <button @click.stop="deleteUser(user)" class="danger">删除</button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑用户表单 -->
    <div v-if="showCreateForm || editingUser" class="modal">
      <div class="modal-content">
        <h3>{{ editingUser ? '编辑用户' : '创建用户' }}</h3>

        <form @submit.prevent="handleSubmitUser">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="userForm.username" type="text" required>
          </div>

          <div class="form-group">
            <label>邮箱</label>
            <input v-model="userForm.email" type="email" required>
          </div>

          <div class="form-group">
            <label>角色</label>
            <select v-model="userForm.role" required>
              <option value="user">用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="isSubmitting">
              {{ editingUser ? '更新' : '创建' }}
            </button>
            <button type="button" @click="cancelForm">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div v-else class="no-permission">
    <p>您没有权限访问用户管理功能</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const showCreateForm = ref(false)
const editingUser = ref(null)
const isSubmitting = ref(false)

const userForm = ref({
  username: '',
  email: '',
  role: 'user'
})

onMounted(() => {
  if (userStore.canManageUsers) {
    userStore.fetchUsers()
  }
})

function getUserInitials(user) {
  return user.username
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function editUser(user) {
  editingUser.value = user
  userForm.value = {
    username: user.username,
    email: user.email,
    role: user.role
  }
}

async function handleSubmitUser() {
  try {
    isSubmitting.value = true

    if (editingUser.value) {
      await userStore.updateUser(editingUser.value.id, userForm.value)
    } else {
      await userStore.createUser(userForm.value)
    }

    cancelForm()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

async function deleteUser(user) {
  if (confirm(`确定要删除用户 ${user.username} 吗？`)) {
    try {
      await userStore.deleteUser(user.id)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

function cancelForm() {
  showCreateForm.value = false
  editingUser.value = null
  userForm.value = {
    username: '',
    email: '',
    role: 'user'
  }
}
</script>
```

这个用户管理示例展示了：

1. **完整的认证流程** - 登录、登出、token 管理
2. **用户资料管理** - 查看和更新个人信息
3. **偏好设置** - 主题、语言、通知等设置
4. **权限控制** - 基于角色的权限管理
5. **管理员功能** - 用户的增删改查
6. **状态持久化** - 登录状态和偏好设置的持久化
7. **错误处理** - 完善的错误处理和用户反馈
8. **加载状态** - 异步操作的加载状态管理
