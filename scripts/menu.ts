#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import chalk from 'chalk'
import ora from 'ora'

// 键盘按键常量
const KEYS = {
  UP: '\u001B[A',
  DOWN: '\u001B[B',
  ENTER: '\r',
  ESC: '\u001B[1b',
  CTRL_C: '\u0003',
  TAB: '\t',
  SPACE: ' ',
}

interface MenuItem {
  icon: string
  title: string
  description: string
  command: string
  category: string
}

interface MenuCategory {
  icon: string
  title: string
  color: (text: string) => string
}

const CATEGORIES: Record<string, MenuCategory> = {
  dev: { icon: '🚀', title: '开发相关', color: chalk.blue },
  quality: { icon: '🔍', title: '质量检查', color: chalk.green },
  build: { icon: '📦', title: '构建工具', color: chalk.yellow },
  analysis: { icon: '📊', title: '分析工具', color: chalk.cyan },
  maintenance: { icon: '🧹', title: '维护工具', color: chalk.gray },
  config: { icon: '⚙️', title: '环境配置', color: chalk.yellow },
  help: { icon: '❓', title: '帮助信息', color: chalk.magenta },
  exit: { icon: '🚪', title: '退出', color: chalk.red },
}

const MENU_ITEMS: MenuItem[] = [
  // 开发相关
  {
    icon: '🚀',
    title: '一键智能提交',
    description: '运行完整的代码检查并提交代码',
    command: 'pnpm commit',
    category: 'dev',
  },
  {
    icon: '💻',
    title: '启动开发环境',
    description: '启动构建监听和文档开发服务器',
    command: 'pnpm dev:full',
    category: 'dev',
  },
  {
    icon: '📚',
    title: '启动文档服务器',
    description: '启动 VitePress 文档开发服务器',
    command: 'pnpm docs:dev',
    category: 'dev',
  },

  // 质量检查
  {
    icon: '🔍',
    title: '运行所有检查',
    description: '类型检查、代码规范、测试、构建验证',
    command: 'pnpm check:all',
    category: 'quality',
  },
  {
    icon: '🧪',
    title: '运行测试',
    description: '运行所有测试用例',
    command: 'pnpm test:run',
    category: 'quality',
  },
  {
    icon: '📊',
    title: '测试覆盖率',
    description: '生成测试覆盖率报告',
    command: 'pnpm test:coverage',
    category: 'quality',
  },
  {
    icon: '🔧',
    title: '自动修复问题',
    description: '自动修复 ESLint 和 Prettier 问题',
    command: 'pnpm fix:all',
    category: 'quality',
  },

  // 构建相关
  {
    icon: '📦',
    title: '构建项目',
    description: '构建所有格式的包（ESM、CommonJS、UMD）',
    command: 'pnpm build',
    category: 'build',
  },
  {
    icon: '📖',
    title: '构建文档',
    description: '构建 VitePress 文档',
    command: 'pnpm docs:build',
    category: 'build',
  },

  // 分析工具
  {
    icon: '⚡',
    title: '性能基准测试',
    description: '运行性能基准测试并生成报告',
    command: 'pnpm benchmark',
    category: 'analysis',
  },
  {
    icon: '📈',
    title: 'Bundle 大小分析',
    description: '分析构建输出大小和压缩比',
    command: 'pnpm bundle-analyzer',
    category: 'analysis',
  },

  // 维护工具
  {
    icon: '🧹',
    title: '清理构建产物',
    description: '清理所有构建产物和缓存',
    command: 'pnpm clean',
    category: 'maintenance',
  },
  {
    icon: '🗑️',
    title: '深度清理',
    description: '清理所有内容包括 node_modules',
    command: 'pnpm clean --deps',
    category: 'maintenance',
  },

  // 环境配置
  {
    icon: '⚙️',
    title: '环境配置管理',
    description: '检查和配置 Token（NPM、GitHub、CodeCov 等）',
    command: 'config',
    category: 'config',
  },

  // 特殊项目
  {
    icon: '❓',
    title: '帮助信息',
    description: '查看帮助和使用说明',
    command: 'help',
    category: 'help',
  },
  {
    icon: '🚪',
    title: '退出',
    description: '退出脚本',
    command: 'exit',
    category: 'exit',
  },
]

class InteractiveMenu {
  private selectedIndex = 0
  private isRunning = true

  constructor() {
    // 设置原始模式以捕获键盘事件
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
  }

  private waitForKeyPress(): Promise<string> {
    return new Promise((resolve) => {
      const onKeyPress = (key: string) => {
        process.stdin.off('data', onKeyPress)
        resolve(key)
      }
      process.stdin.on('data', onKeyPress)
    })
  }

  private async executeCommand(command: string): Promise<void> {
    // 恢复终端设置
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false)
    }

    console.clear()
    console.log(chalk.blue.bold(`🔄 执行命令: ${command}\n`))

    const spinner = ora('正在执行...').start()

    try {
      execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      spinner.succeed(chalk.green('✅ 命令执行完成'))
    }
 catch (error) {
      spinner.fail(chalk.red('❌ 命令执行失败'))
      console.error(chalk.red((error as Error).message))
    }

    console.log(chalk.gray('\n按任意键返回菜单...'))

    // 重新设置原始模式
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }

    await this.waitForKeyPress()
  }

  private displayMenu(): void {
    console.clear()

    // 标题
    console.log(chalk.blue.bold('? ') + chalk.white.bold('请选择要执行的操作:'))
    console.log()

    // 显示菜单项
    MENU_ITEMS.forEach((item, index) => {
      const isSelected = index === this.selectedIndex
      const category = CATEGORIES[item.category]

      if (isSelected) {
        // 选中状态：蓝色背景 + 白色文字
        console.log(chalk.bgBlue.white(`❯ ${item.icon} ${item.title} - ${item.description}`))
      }
 else {
        // 未选中状态：灰色图标 + 白色标题 + 灰色描述
        console.log(chalk.gray(`  ${item.icon} ${item.title} - ${item.description}`))
      }
    })

    console.log()
    console.log(chalk.gray('(使用 ↑↓ 键选择，Enter 确认，Ctrl+C 退出)'))
  }

  private async displayHelp(): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold('📖 帮助信息\n'))

    console.log(chalk.yellow('🚀 快速开始：'))
    console.log(chalk.white('  1. 首次使用建议先运行 "运行所有检查" 确保环境正常'))
    console.log(chalk.white('  2. 日常开发使用 "启动开发环境" 进行开发'))
    console.log(chalk.white('  3. 提交代码使用 "一键智能提交"'))
    console.log(chalk.white('  4. 发布版本前先运行性能测试和大小分析'))

    console.log(chalk.yellow('\n🔧 环境配置：'))
    console.log(chalk.white('  - 确保已安装 Node.js 16+ 和 pnpm'))
    console.log(chalk.white('  - 配置必要的环境变量（参考 .env.example）'))
    console.log(chalk.white('  - 查看 docs/setup/tokens.md 了解如何获取 API tokens'))

    console.log(chalk.yellow('\n📚 文档链接：'))
    console.log(chalk.white('  - Token 配置指南: docs/setup/tokens.md'))
    console.log(chalk.white('  - 自动化流程说明: AUTOMATION.md'))
    console.log(chalk.white('  - 项目文档: pnpm docs:dev'))

    console.log(chalk.yellow('\n🆘 常见问题：'))
    console.log(chalk.white('  - 构建失败: 运行 "自动修复问题" 或检查 TypeScript 错误'))
    console.log(chalk.white('  - 测试失败: 检查测试文件或运行 "测试覆盖率" 查看详情'))
    console.log(chalk.white('  - 提交失败: 确保遵循 Conventional Commits 格式'))

    console.log(chalk.yellow('\n⌨️  快捷键：'))
    console.log(chalk.white('  ↑↓ - 上下选择'))
    console.log(chalk.white('  Enter - 确认选择'))
    console.log(chalk.white('  Ctrl+C - 退出程序'))

    console.log(chalk.gray('\n按任意键返回菜单...'))
    await this.waitForKeyPress()
  }

  private async openConfigManager(): Promise<void> {
    console.clear()
    console.log(chalk.yellow.bold('⚙️  环境配置管理'))
    console.log(chalk.gray('检查和配置项目所需的 API Token'))
    console.log()

    const tokens = [
      { name: 'NPM Token', env: 'NPM_TOKEN', desc: '用于发布包到 NPM 注册表' },
      { name: 'GitHub Token', env: 'GITHUB_TOKEN', desc: '用于 GitHub Actions 和 API 访问' },
      { name: 'CodeCov Token', env: 'CODECOV_TOKEN', desc: '用于上传测试覆盖率报告' },
      { name: 'Snyk Token', env: 'SNYK_TOKEN', desc: '用于安全漏洞扫描' },
      { name: 'Netlify Token', env: 'NETLIFY_AUTH_TOKEN', desc: '用于部署到 Netlify' },
      { name: 'Vercel Token', env: 'VERCEL_TOKEN', desc: '用于部署到 Vercel' },
    ]

    tokens.forEach((token) => {
      const isConfigured = process.env[token.env] ? '✅' : '❌'
      const status = process.env[token.env] ? chalk.green('已配置') : chalk.red('未配置')
      console.log(`${isConfigured} ${token.name} - ${token.desc} ${status}`)
    })

    console.log()
    console.log(chalk.yellow('配置说明：'))
    console.log(chalk.white('1. NPM Token: https://www.npmjs.com/settings/tokens'))
    console.log(chalk.white('2. GitHub Token: https://github.com/settings/tokens'))
    console.log(chalk.white('3. CodeCov Token: https://codecov.io/'))
    console.log(chalk.white('4. Snyk Token: https://app.snyk.io/account'))
    console.log(chalk.white('5. Netlify Token: https://app.netlify.com/user/applications'))
    console.log(chalk.white('6. Vercel Token: https://vercel.com/account/tokens'))
    console.log()
    console.log(chalk.gray('请在项目根目录创建 .env.local 文件并添加相应的 Token'))
    console.log(chalk.gray('格式：TOKEN_NAME=your_token_value'))
    console.log()
    console.log(chalk.gray('按任意键返回主菜单...'))

    await this.waitForKeyPress()
  }

  async run(): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold('🎉 欢迎使用 @ldesign/store 开发工具！'))
    console.log(chalk.gray('正在加载菜单...\n'))

    // 等待一下让用户看到欢迎信息
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      while (this.isRunning) {
        this.displayMenu()

        const key = await this.waitForKeyPress()

        // 处理按键
        if (key === KEYS.CTRL_C) {
          this.isRunning = false
          break
        }

        if (key === KEYS.UP) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1)
          continue
        }

        if (key === KEYS.DOWN) {
          this.selectedIndex = Math.min(MENU_ITEMS.length - 1, this.selectedIndex + 1)
          continue
        }

        if (key === KEYS.ENTER) {
          const selectedItem = MENU_ITEMS[this.selectedIndex]

          if (selectedItem.command === 'help') {
            await this.displayHelp()
            continue
          }

          if (selectedItem.command === 'config') {
            await this.openConfigManager()
            continue
          }

          if (selectedItem.command === 'exit') {
            this.isRunning = false
            break
          }

          // 执行选中的命令
          await this.executeCommand(selectedItem.command)
        }
      }
    }
 finally {
      // 恢复终端设置
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }
      process.stdin.pause()
    }

    console.clear()
    console.log(chalk.green.bold('👋 再见！感谢使用 @ldesign/store 开发工具'))
  }
}

// 运行菜单
async function main() {
  const menu = new InteractiveMenu()

  // 处理 Ctrl+C 信号
  process.on('SIGINT', () => {
    console.clear()
    console.log(chalk.green.bold('\n👋 再见！感谢使用 @ldesign/store 开发工具'))
    process.exit(0)
  })

  await menu.run()
}

// 检查是否直接运行此文件
if (process.argv[1]?.includes('menu.ts')) {
  main().catch(console.error)
}
