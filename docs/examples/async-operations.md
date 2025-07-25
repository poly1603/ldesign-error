# 异步操作示例

本示例展示了如何使用 @ldesign/store 处理各种异步操作，包括 API 调用、文件上传、实时数据、错误处理等。

## Store 定义

```typescript
import { Action, AsyncAction, BaseStore, Cache, Debounce, Getter, State, Store, createStoreClass } from '@ldesign/store'

// 类型定义
interface Post {
  id: number
  title: string
  content: string
  author: string
  createdAt: string
  updatedAt: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
}

interface Comment {
  id: number
  postId: number
  author: string
  content: string
  createdAt: string
}

interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

@Store({
  id: 'async-demo',
  cache: {
    ttl: 300000, // 5 分钟缓存
    max: 100
  }
})
class AsyncDemoStore extends BaseStore {
  // 文章管理
  @State({ default: [] })
  posts!: Post[]

  @State({ default: null })
  currentPost!: Post | null

  @State({ default: {} })
  comments!: Record<number, Comment[]>

  // 搜索功能
  @State({ default: '' })
  searchQuery!: string

  @State({ default: [] })
  searchResults!: Post[]

  @State({ default: null })
  searchSuggestions!: string[] | null

  // 文件上传
  @State({ default: [] })
  uploadFiles!: UploadFile[]

  // 实时数据
  @State({ default: null })
  websocket!: WebSocket | null

  @State({ default: [] })
  notifications!: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    timestamp: number
  }>

  // 分页状态
  @State({ default: 1 })
  currentPage!: number

  @State({ default: 20 })
  pageSize!: number

  @State({ default: 0 })
  totalPosts!: number

  // 文章操作
  @AsyncAction()
  async fetchPosts(page = 1, limit = 20, filters?: any) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    })

    const response = await fetch(`/api/posts?${params}`)

    if (!response.ok) {
      throw new Error(`获取文章失败: ${response.statusText}`)
    }

    const result: ApiResponse<Post[]> = await response.json()

    if (page === 1) {
      this.posts = result.data
    }
 else {
      // 分页加载，追加数据
      this.posts.push(...result.data)
    }

    this.currentPage = page
    this.totalPosts = result.pagination?.total || 0

    return result
  }

  @Cache(60000) // 缓存 1 分钟
  @AsyncAction()
  async fetchPost(id: number) {
    const response = await fetch(`/api/posts/${id}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('文章不存在')
      }
      throw new Error('获取文章详情失败')
    }

    const result: ApiResponse<Post> = await response.json()
    this.currentPost = result.data

    return result.data
  }

  @AsyncAction()
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '创建文章失败')
    }

    const result: ApiResponse<Post> = await response.json()
    this.posts.unshift(result.data)
    this.totalPosts++

    return result.data
  }

  @AsyncAction()
  async updatePost(id: number, updates: Partial<Post>) {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('更新文章失败')
    }

    const result: ApiResponse<Post> = await response.json()

    // 更新列表中的文章
    const index = this.posts.findIndex(p => p.id === id)
    if (index > -1) {
      this.posts[index] = result.data
    }

    // 更新当前文章
    if (this.currentPost?.id === id) {
      this.currentPost = result.data
    }

    return result.data
  }

  @AsyncAction()
  async deletePost(id: number) {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('删除文章失败')
    }

    // 从列表中移除
    this.posts = this.posts.filter(p => p.id !== id)
    this.totalPosts--

    // 清除当前文章
    if (this.currentPost?.id === id) {
      this.currentPost = null
    }

    return true
  }

  // 评论管理
  @AsyncAction()
  async fetchComments(postId: number) {
    const response = await fetch(`/api/posts/${postId}/comments`)

    if (!response.ok) {
      throw new Error('获取评论失败')
    }

    const result: ApiResponse<Comment[]> = await response.json()
    this.comments[postId] = result.data

    return result.data
  }

  @AsyncAction()
  async addComment(postId: number, content: string, author: string) {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author })
    })

    if (!response.ok) {
      throw new Error('添加评论失败')
    }

    const result: ApiResponse<Comment> = await response.json()

    if (!this.comments[postId]) {
      this.comments[postId] = []
    }
    this.comments[postId].push(result.data)

    return result.data
  }

  // 搜索功能
  @Debounce(300)
  @AsyncAction()
  async search(query: string) {
    this.searchQuery = query

    if (!query.trim()) {
      this.searchResults = []
      this.searchSuggestions = null
      return
    }

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error('搜索失败')
    }

    const result: ApiResponse<Post[]> = await response.json()
    this.searchResults = result.data

    return result.data
  }

  @Debounce(500)
  @AsyncAction()
  async fetchSearchSuggestions(query: string) {
    if (!query.trim()) {
      this.searchSuggestions = null
      return
    }

    const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      return // 建议失败不抛错误
    }

    const result: ApiResponse<string[]> = await response.json()
    this.searchSuggestions = result.data

    return result.data
  }

  // 文件上传
  @AsyncAction()
  async uploadFile(file: File) {
    const uploadId = Date.now().toString()

    // 添加到上传列表
    const uploadFile: UploadFile = {
      id: uploadId,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending'
    }
    this.uploadFiles.push(uploadFile)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // 创建 XMLHttpRequest 以跟踪上传进度
      const xhr = new XMLHttpRequest()

      return new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            this.updateUploadProgress(uploadId, progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            this.updateUploadStatus(uploadId, 'completed', response.data.url)
            resolve(response.data.url)
          }
 else {
            const error = '上传失败'
            this.updateUploadStatus(uploadId, 'error', undefined, error)
            reject(new Error(error))
          }
        })

        xhr.addEventListener('error', () => {
          const error = '网络错误'
          this.updateUploadStatus(uploadId, 'error', undefined, error)
          reject(new Error(error))
        })

        xhr.open('POST', '/api/upload')
        this.updateUploadStatus(uploadId, 'uploading')
        xhr.send(formData)
      })
    }
 catch (error) {
      this.updateUploadStatus(uploadId, 'error', undefined, error.message)
      throw error
    }
  }

  @Action()
  updateUploadProgress(uploadId: string, progress: number) {
    const file = this.uploadFiles.find(f => f.id === uploadId)
    if (file) {
      file.progress = progress
    }
  }

  @Action()
  updateUploadStatus(uploadId: string, status: UploadFile['status'], url?: string, error?: string) {
    const file = this.uploadFiles.find(f => f.id === uploadId)
    if (file) {
      file.status = status
      if (url)
file.url = url
      if (error)
file.error = error
    }
  }

  @Action()
  removeUploadFile(uploadId: string) {
    this.uploadFiles = this.uploadFiles.filter(f => f.id !== uploadId)
  }

  // 批量操作
  @AsyncAction()
  async batchDeletePosts(postIds: number[]) {
    const results = await Promise.allSettled(
      postIds.map(id =>
        fetch(`/api/posts/${id}`, { method: 'DELETE' })
          .then((response) => {
            if (!response.ok)
throw new Error(`删除文章 ${id} 失败`)
            return id
          })
      )
    )

    const succeeded: number[] = []
    const failed: number[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        succeeded.push(postIds[index])
      }
 else {
        failed.push(postIds[index])
      }
    })

    // 从列表中移除成功删除的文章
    this.posts = this.posts.filter(p => !succeeded.includes(p.id))
    this.totalPosts -= succeeded.length

    return { succeeded, failed }
  }

  @AsyncAction()
  async batchUpdatePosts(updates: Array<{ id: number, data: Partial<Post> }>) {
    const results = await Promise.allSettled(
      updates.map(({ id, data }) =>
        fetch(`/api/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then((response) => {
          if (!response.ok)
throw new Error(`更新文章 ${id} 失败`)
          return response.json()
        })
      )
    )

    const succeeded: Post[] = []
    const failed: number[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        succeeded.push(result.value.data)
      }
 else {
        failed.push(updates[index].id)
      }
    })

    // 更新成功的文章
    succeeded.forEach((updatedPost) => {
      const index = this.posts.findIndex(p => p.id === updatedPost.id)
      if (index > -1) {
        this.posts[index] = updatedPost
      }
    })

    return { succeeded, failed }
  }

  // WebSocket 实时数据
  @Action()
  connectWebSocket() {
    if (this.websocket) {
      this.websocket.close()
    }

    this.websocket = new WebSocket('ws://localhost:8080/ws')

    this.websocket.onopen = () => {
      this.addNotification('success', 'WebSocket 连接成功')
    }

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleWebSocketMessage(data)
      }
 catch (error) {
        console.error('WebSocket 消息解析失败:', error)
      }
    }

    this.websocket.onclose = () => {
      this.addNotification('warning', 'WebSocket 连接已断开')
      this.websocket = null

      // 自动重连
      setTimeout(() => {
        this.connectWebSocket()
      }, 5000)
    }

    this.websocket.onerror = (error) => {
      this.addNotification('error', 'WebSocket 连接错误')
      console.error('WebSocket error:', error)
    }
  }

  @Action()
  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  @Action()
  handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'post_created':
        this.posts.unshift(data.post)
        this.totalPosts++
        this.addNotification('info', `新文章: ${data.post.title}`)
        break

      case 'post_updated':
        const index = this.posts.findIndex(p => p.id === data.post.id)
        if (index > -1) {
          this.posts[index] = data.post
        }
        if (this.currentPost?.id === data.post.id) {
          this.currentPost = data.post
        }
        break

      case 'post_deleted':
        this.posts = this.posts.filter(p => p.id !== data.postId)
        this.totalPosts--
        if (this.currentPost?.id === data.postId) {
          this.currentPost = null
        }
        break

      case 'comment_added':
        if (!this.comments[data.comment.postId]) {
          this.comments[data.comment.postId] = []
        }
        this.comments[data.comment.postId].push(data.comment)
        break
    }
  }

  @Action()
  addNotification(type: 'info' | 'success' | 'warning' | 'error', message: string) {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now()
    }

    this.notifications.push(notification)

    // 自动移除通知
    setTimeout(() => {
      this.removeNotification(notification.id)
    }, 5000)
  }

  @Action()
  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
  }

  // 计算属性
  @Getter()
  get isLoadingPosts() {
    return this.$isLoading('fetchPosts')
  }

  @Getter()
  get isLoadingPost() {
    return this.$isLoading('fetchPost')
  }

  @Getter()
  get isSearching() {
    return this.$isLoading('search')
  }

  @Getter()
  get hasMorePosts() {
    return this.posts.length < this.totalPosts
  }

  @Getter()
  get uploadingFiles() {
    return this.uploadFiles.filter(f => f.status === 'uploading')
  }

  @Getter()
  get completedUploads() {
    return this.uploadFiles.filter(f => f.status === 'completed')
  }

  @Getter()
  get failedUploads() {
    return this.uploadFiles.filter(f => f.status === 'error')
  }

  @Getter()
  get isConnected() {
    return this.websocket?.readyState === WebSocket.OPEN
  }

  @Getter()
  get postsByStatus() {
    return {
      draft: this.posts.filter(p => p.status === 'draft'),
      published: this.posts.filter(p => p.status === 'published'),
      archived: this.posts.filter(p => p.status === 'archived')
    }
  }

  @Getter()
  get searchResultsCount() {
    return this.searchResults.length
  }

  // 错误处理
  @Getter()
  get lastError() {
    const errors = Object.values(this.$errors.value).filter(Boolean)
    return errors[errors.length - 1] || null
  }

  @Action()
  clearErrors() {
    this.$clearAllErrors()
  }
}

export const useAsyncDemoStore = createStoreClass(AsyncDemoStore)
```

## Vue 组件使用

### 文章列表组件

```vue
<template>
  <div class="post-list">
    <div class="list-header">
      <h2>文章列表</h2>
      <div class="actions">
        <button @click="refreshPosts" :disabled="store.isLoadingPosts">
          <span v-if="store.isLoadingPosts">刷新中...</span>
          <span v-else>刷新</span>
        </button>
        <button @click="showCreateForm = true">新建文章</button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <input
        v-model="searchQuery"
        @input="handleSearch"
        placeholder="搜索文章..."
        class="search-input"
      >

      <!-- 搜索建议 -->
      <div v-if="store.searchSuggestions" class="search-suggestions">
        <div
          v-for="suggestion in store.searchSuggestions"
          :key="suggestion"
          @click="selectSuggestion(suggestion)"
          class="suggestion-item"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="posts">
      <div
        v-for="post in displayPosts"
        :key="post.id"
        class="post-item"
        @click="viewPost(post.id)"
      >
        <h3>{{ post.title }}</h3>
        <p class="post-excerpt">{{ post.content.substring(0, 150) }}...</p>
        <div class="post-meta">
          <span class="author">{{ post.author }}</span>
          <span class="date">{{ formatDate(post.createdAt) }}</span>
          <span class="status" :class="post.status">{{ post.status }}</span>
        </div>
        <div class="post-tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="store.hasMorePosts" class="load-more">
      <button @click="loadMore" :disabled="store.isLoadingPosts">
        <span v-if="store.isLoadingPosts">加载中...</span>
        <span v-else>加载更多</span>
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="!store.isLoadingPosts && displayPosts.length === 0" class="empty-state">
      <p>{{ isSearching ? '没有找到相关文章' : '暂无文章' }}</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="store.lastError" class="error-message">
      {{ store.lastError.message }}
      <button @click="store.clearErrors()">关闭</button>
    </div>

    <!-- 通知 -->
    <div class="notifications">
      <div
        v-for="notification in store.notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        {{ notification.message }}
        <button @click="store.removeNotification(notification.id)">×</button>
      </div>
    </div>

    <!-- WebSocket 连接状态 -->
    <div class="connection-status">
      <span :class="{ connected: store.isConnected, disconnected: !store.isConnected }">
        {{ store.isConnected ? '已连接' : '未连接' }}
      </span>
      <button v-if="!store.isConnected" @click="store.connectWebSocket()">
        重新连接
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAsyncDemoStore } from '../stores/async-demo'

const router = useRouter()
const store = useAsyncDemoStore()

const searchQuery = ref('')
const showCreateForm = ref(false)

const isSearching = computed(() => searchQuery.value.trim() !== '')
const displayPosts = computed(() =>
  isSearching.value ? store.searchResults : store.posts
)

onMounted(async () => {
  // 初始化数据
  await store.fetchPosts()

  // 连接 WebSocket
  store.connectWebSocket()
})

onUnmounted(() => {
  // 断开 WebSocket
  store.disconnectWebSocket()
})

async function refreshPosts() {
  try {
    await store.fetchPosts(1)
  } catch (error) {
    console.error('刷新失败:', error)
  }
}

async function loadMore() {
  try {
    await store.fetchPosts(store.currentPage + 1)
  } catch (error) {
    console.error('加载更多失败:', error)
  }
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    store.search(searchQuery.value)
    store.fetchSearchSuggestions(searchQuery.value)
  } else {
    store.searchResults = []
    store.searchSuggestions = null
  }
}

function selectSuggestion(suggestion: string) {
  searchQuery.value = suggestion
  store.search(suggestion)
  store.searchSuggestions = null
}

function viewPost(id: number) {
  router.push(`/posts/${id}`)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.post-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-section {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 10;
}

.suggestion-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.post-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.post-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.post-excerpt {
  color: #666;
  margin: 10px 0;
}

.post-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #888;
  margin: 10px 0;
}

.status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status.draft { background: #fff3cd; color: #856404; }
.status.published { background: #d4edda; color: #155724; }
.status.archived { background: #f8d7da; color: #721c24; }

.post-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.tag {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #495057;
}

.load-more {
  text-align: center;
  margin: 20px 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.notification {
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 300px;
}

.notification.info { background: #d1ecf1; color: #0c5460; }
.notification.success { background: #d4edda; color: #155724; }
.notification.warning { background: #fff3cd; color: #856404; }
.notification.error { background: #f8d7da; color: #721c24; }

.connection-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.connected {
  background: #d4edda;
  color: #155724;
}

.disconnected {
  background: #f8d7da;
  color: #721c24;
}
</style>
```

这个异步操作示例展示了：

1. **API 调用管理** - GET、POST、PUT、DELETE 操作
2. **分页加载** - 无限滚动和分页数据管理
3. **搜索功能** - 防抖搜索和搜索建议
4. **文件上传** - 带进度跟踪的文件上传
5. **批量操作** - 并发处理多个异步操作
6. **WebSocket 实时数据** - 实时数据推送和自动重连
7. **错误处理** - 统一的错误处理和用户反馈
8. **加载状态** - 细粒度的加载状态管理
9. **缓存策略** - 智能缓存减少重复请求
10. **通知系统** - 实时通知和消息管理
