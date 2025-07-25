#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import chalk from 'chalk'
import ora from 'ora'

// 键盘按键常量
const KEYS = {
  UP: '\u001B[A',
  DOWN: '\u001B[B',
  ENTER: '\r',
  ESC: '\u001B',
  CTRL_C: '\u0003',
  SPACE: ' ',
  TAB: '\t',
  BACKSPACE: '\u007F',
}

interface MenuItem {
  key: string
  title: string
  description: string
  command: string
  category: 'dev' | 'quality' | 'build' | 'deploy' | 'analysis' | 'maintenance'
}

const MENU_ITEMS: MenuItem[] = [
  // 开发相关
  {
    key: '1',
    title: '🚀 一键智能提交',
    description: '运行完整的代码检查并提交代码',
    command: 'pnpm commit',
    category: 'dev',
  },
  {
    key: '2',
    title: '💻 启动开发环境',
    description: '启动构建监听和文档开发服务器',
    command: 'pnpm dev:full',
    category: 'dev',
  },
  {
    key: '3',
    title: '📚 启动文档服务器',
    description: '启动 VitePress 文档开发服务器',
    command: 'pnpm docs:dev',
    category: 'dev',
  },

  // 质量检查
  {
    key: '4',
    title: '🔍 运行所有检查',
    description: '类型检查、代码规范、测试、构建验证',
    command: 'pnpm check:all',
    category: 'quality',
  },
  {
    key: '5',
    title: '🧪 运行测试',
    description: '运行所有测试用例',
    command: 'pnpm test:run',
    category: 'quality',
  },
  {
    key: '6',
    title: '📊 测试覆盖率',
    description: '生成测试覆盖率报告',
    command: 'pnpm test:coverage',
    category: 'quality',
  },
  {
    key: '7',
    title: '🔧 自动修复问题',
    description: '自动修复 ESLint 和 Prettier 问题',
    command: 'pnpm fix:all',
    category: 'quality',
  },

  // 构建相关
  {
    key: '8',
    title: '📦 构建项目',
    description: '构建所有格式的包（ESM、CommonJS、UMD）',
    command: 'pnpm build',
    category: 'build',
  },
  {
    key: '9',
    title: '📖 构建文档',
    description: '构建 VitePress 文档',
    command: 'pnpm docs:build',
    category: 'build',
  },

  // 部署相关
  {
    key: '10',
    title: '🏷️ 发布修复版本',
    description: '发布 patch 版本（1.0.0 → 1.0.1）',
    command: 'pnpm release:patch',
    category: 'deploy',
  },
  {
    key: '11',
    title: '🎯 发布功能版本',
    description: '发布 minor 版本（1.0.0 → 1.1.0）',
    command: 'pnpm release:minor',
    category: 'deploy',
  },
  {
    key: '12',
    title: '💥 发布重大版本',
    description: '发布 major 版本（1.0.0 → 2.0.0）',
    command: 'pnpm release:major',
    category: 'deploy',
  },

  // 分析工具
  {
    key: '13',
    title: '⚡ 性能基准测试',
    description: '运行性能基准测试并生成报告',
    command: 'pnpm benchmark',
    category: 'analysis',
  },
  {
    key: '14',
    title: '📈 Bundle 大小分析',
    description: '分析构建输出大小和压缩比',
    command: 'pnpm bundle-analyzer',
    category: 'analysis',
  },

  // 维护工具
  {
    key: '15',
    title: '🧹 清理构建产物',
    description: '清理所有构建产物和缓存',
    command: 'pnpm clean',
    category: 'maintenance',
  },
  {
    key: '16',
    title: '🗑️ 深度清理',
    description: '清理所有内容包括 node_modules',
    command: 'pnpm clean --deps',
    category: 'maintenance',
  },
]

const CATEGORIES = {
  dev: { title: '🚀 开发工具', color: chalk.blue },
  quality: { title: '🔍 质量检查', color: chalk.green },
  build: { title: '📦 构建工具', color: chalk.yellow },
  deploy: { title: '🚀 部署发布', color: chalk.magenta },
  analysis: { title: '📊 分析工具', color: chalk.cyan },
  maintenance: { title: '🧹 维护工具', color: chalk.gray },
}

class DevToolsMenu {
  private selectedIndex = 0
  private allItems: (MenuItem | { type: 'separator', title: string } | { type: 'action', key: string, title: string })[] = []

  constructor() {
    this.buildMenuItems()
  }

  private buildMenuItems(): void {
    this.allItems = []

    // 按分类添加菜单项
    Object.entries(CATEGORIES).forEach(([categoryKey, category]) => {
      const items = MENU_ITEMS.filter(item => item.category === categoryKey)
      if (items.length === 0)
return

      // 添加分类标题
      this.allItems.push({ type: 'separator', title: category.title })

      // 添加该分类的所有项目
      items.forEach((item) => {
        this.allItems.push(item)
      })
    })

    // 添加特殊操作
    this.allItems.push({ type: 'separator', title: '🔧 其他操作' })
    this.allItems.push({ type: 'action', key: 'help', title: '📖 显示帮助' })
    this.allItems.push({ type: 'action', key: 'exit', title: '🚪 退出' })
  }

  private getSelectableItems(): MenuItem[] {
    return this.allItems.filter(item => 'command' in item) as MenuItem[]
  }

  private getSelectableActions(): { type: 'action', key: string, title: string }[] {
    return this.allItems.filter(item => item.type === 'action') as { type: 'action', key: string, title: string }[]
  }

  private getAllSelectableItems(): (MenuItem | { type: 'action', key: string, title: string })[] {
    return this.allItems.filter(item => 'command' in item || item.type === 'action') as (MenuItem | { type: 'action', key: string, title: string })[]
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

  private executeCommand(command: string): void {
    console.log(chalk.blue(`\n🔄 执行命令: ${command}\n`))

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
  }

  private displayMenu(): void {
    console.clear()
    console.log(chalk.blue.bold('🛠️  @ldesign/store 开发工具菜单'))
    console.log(chalk.gray('使用 ↑↓ 键选择，Enter 确认，Esc 退出\n'))

    const selectableItems = this.getAllSelectableItems()
    let currentSelectableIndex = 0

    this.allItems.forEach((item, index) => {
      if (item.type === 'separator') {
        // 显示分类标题
        const category = Object.values(CATEGORIES).find(cat => cat.title === item.title)
        if (category) {
          console.log(category.color.bold(item.title))
        }
 else {
          console.log(chalk.cyan.bold(item.title))
        }
      }
 else if ('command' in item || item.type === 'action') {
        // 显示可选择的项目
        const isSelected = currentSelectableIndex === this.selectedIndex
        const prefix = isSelected ? chalk.bgBlue.white(' ► ') : '   '
        const titleColor = isSelected ? chalk.white.bold : chalk.white
        const descColor = isSelected ? chalk.gray.bold : chalk.gray

        if ('command' in item) {
          console.log(`${prefix}${titleColor(item.title)}`)
          console.log(`     ${descColor(item.description)}`)
        }
 else {
          console.log(`${prefix}${titleColor(item.title)}`)
        }

        currentSelectableIndex++
      }
    })

    console.log()
    console.log(chalk.gray('提示: ↑↓ 选择 | Enter 确认 | Esc 退出 | h 帮助'))
  }

  private async showHelp(): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold('📖 帮助信息\n'))

    console.log(chalk.yellow('🚀 快速开始：'))
    console.log(chalk.white('  1. 首次使用建议先运行 "运行所有检查" 确保环境正常'))
    console.log(chalk.white('  2. 日常开发使用 "启动开发环境" 进行开发'))
    console.log(chalk.white('  3. 提交代码使用 "一键智能提交"'))
    console.log(chalk.white('  4. 发布版本前先运行 "性能基准测试" 和 "Bundle 大小分析"'))

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
    console.log(chalk.white('  h - 显示帮助'))
    console.log(chalk.white('  Esc - 退出程序'))

    console.log(chalk.gray('\n按任意键返回菜单...'))
    await this.waitForKeyPress()
  }

  private async confirmExecution(item: MenuItem): Promise<boolean> {
    console.clear()
    console.log(chalk.cyan.bold('📋 确认执行\n'))
    console.log(chalk.white(`🎯 操作: ${item.title}`))
    console.log(chalk.gray(`📝 描述: ${item.description}`))
    console.log(chalk.gray(`💻 命令: ${item.command}`))

    console.log(chalk.yellow('\n确认执行此操作吗？'))
    console.log(chalk.gray('Enter - 确认执行 | Esc - 取消'))

    while (true) {
      const key = await this.waitForKeyPress()

      if (key === KEYS.ENTER) {
        return true
      }

      if (key === KEYS.ESC) {
        console.log(chalk.yellow('\n❌ 已取消'))
        await new Promise(resolve => setTimeout(resolve, 1000))
        return false
      }
    }
  }

  private async executeCommandWithFeedback(command: string): Promise<void> {
    console.clear()
    console.log(chalk.blue.bold('🔄 执行中...\n'))
    console.log(chalk.gray(`命令: ${command}\n`))

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
  }

  private async waitForContinue(): Promise<void> {
    console.log(chalk.gray('\n按任意键继续...'))
    await this.waitForKeyPress()
  }

  async run(): Promise<void> {
    // 设置原始模式以捕获键盘事件
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    console.log(chalk.blue.bold('🎉 欢迎使用 @ldesign/store 开发工具！'))
    console.log(chalk.gray('正在加载菜单...\n'))

    // 等待一下让用户看到欢迎信息
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      while (true) {
        this.displayMenu()

        const key = await this.waitForKeyPress()

        // 处理特殊按键
        if (key === KEYS.CTRL_C || key === KEYS.ESC) {
          console.log(chalk.green('\n👋 再见！'))
          break
        }

        if (key === 'h' || key === 'H') {
          await this.showHelp()
          continue
        }

        if (key === KEYS.UP) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1)
          continue
        }

        if (key === KEYS.DOWN) {
          const maxIndex = this.getAllSelectableItems().length - 1
          this.selectedIndex = Math.min(maxIndex, this.selectedIndex + 1)
          continue
        }

        if (key === KEYS.ENTER) {
          const selectedItem = this.getAllSelectableItems()[this.selectedIndex]

          if (!selectedItem)
continue

          if (selectedItem.type === 'action') {
            if (selectedItem.key === 'help') {
              await this.showHelp()
              continue
            }
            if (selectedItem.key === 'exit') {
              console.log(chalk.green('\n👋 再见！'))
              break
            }
          }
 else {
            // 执行选中的命令
            const shouldExecute = await this.confirmExecution(selectedItem)
            if (shouldExecute) {
              await this.executeCommandWithFeedback(selectedItem.command)
              await this.waitForContinue()
            }
          }
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
  }
}

// 运行开发工具菜单
if (import.meta.url.includes('dev.ts') || process.argv[1]?.includes('dev.ts')) {
  const menu = new DevToolsMenu()
  await menu.run()
}
