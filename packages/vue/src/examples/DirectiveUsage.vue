<script setup lang="ts">
/**
 * v-error-boundary 指令使用示例
 *
 * 这是最简单的错误边界使用方式，无需手动包裹 ErrorBoundary 组件
 */
import { ref } from 'vue'

const showError = ref(false)

function triggerError() {
  showError.value = true
}

function reset() {
  showError.value = false
}
</script>

<template>
  <div class="demo-container">
    <h2>v-error-boundary 指令使用示例</h2>

    <!-- 方法 1：最简单的使用方式 -->
    <section>
      <h3>方法 1：默认用法</h3>
      <div v-error-boundary class="card">
        <p>这个区域被错误边界保护</p>
        <ErrorProneComponent v-if="showError" />
      </div>
    </section>

    <!-- 方法 2：指定显示模式 -->
    <section>
      <h3>方法 2：Overlay 模式</h3>
      <div v-error-boundary="'overlay'" class="card">
        <p>错误时显示红色覆盖层</p>
        <ErrorProneComponent v-if="showError" />
      </div>
    </section>

    <!-- 方法 3：完整配置 -->
    <section>
      <h3>方法 3：完整配置</h3>
      <div
        v-error-boundary="{
          mode: 'overlay',
          showRetry: true,
          showDismiss: true,
          onError: (err) => console.log('Error caught:', err),
        }"
        class="card"
      >
        <p>支持重试和关闭按钮</p>
        <ErrorProneComponent v-if="showError" />
      </div>
    </section>

    <!-- 方法 4：inline 模式 -->
    <section>
      <h3>方法 4：Inline 模式（仅文字）</h3>
      <div v-error-boundary="'inline'" class="card">
        <p>错误时显示简洁的错误信息</p>
        <ErrorProneComponent v-if="showError" />
      </div>
    </section>

    <div class="actions">
      <button @click="triggerError">
        触发错误
      </button>
      <button @click="reset">
        重置
      </button>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 20px;
}

.card {
  border: 1px solid #ddd;
  padding: 16px;
  margin: 10px 0;
  border-radius: 8px;
  min-height: 100px;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
}

button:hover {
  background: #f0f0f0;
}
</style>
