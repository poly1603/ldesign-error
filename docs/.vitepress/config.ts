import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/store',
  description: '基于 Pinia 的现代化 Vue3 状态管理库',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/store-class' },
      { text: '示例', link: '/examples/basic' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心概念', link: '/guide/concepts' },
            { text: '装饰器', link: '/guide/decorators' },
            { text: '状态持久化', link: '/guide/persistence' },
            { text: '性能优化', link: '/guide/performance' },
            { text: '测试', link: '/guide/testing' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: 'Store 类', link: '/api/store-class' },
            { text: '装饰器', link: '/api/decorators' },
            { text: '插件', link: '/api/plugins' },
            { text: '类型定义', link: '/api/types' },
          ],
        },
      ],
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '基础用法', link: '/examples/basic' },
            { text: '用户管理', link: '/examples/user-management' },
            { text: '购物车', link: '/examples/shopping-cart' },
            { text: '异步操作', link: '/examples/async-operations' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/poly1603/ldesign-store' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 LDesign Team',
    },
  },
})
