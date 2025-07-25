#!/usr/bin/env tsx

import chalk from 'chalk'
import { config } from 'dotenv'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import ora from 'ora'

// 加载 .env.local 文件
config({ path: join(process.cwd(), '.env.local') })

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

    console.log(chalk.yellow('\n⌨️  快捷键：'))
    console.log(chalk.white('  ↑↓ - 上下选择'))
    console.log(chalk.white('  Enter - 确认选择'))
    console.log(chalk.white('  Ctrl+C - 退出程序'))

    console.log(chalk.gray('\n按任意键返回菜单...'))
    await this.waitForKeyPress()
  }

  private async openConfigManager(): Promise<void> {
    // 恢复终端设置
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false)
    }

    const configManager = new TokenConfigManager()
    await configManager.run()

    // 重新设置原始模式
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
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

// Token配置管理器
class TokenConfigManager {
  private selectedIndex = 0
  private isRunning = true
  private envFilePath = join(process.cwd(), '.env.local')

  private tokens = [
    {
      name: 'NPM Token',
      env: 'NPM_TOKEN',
      desc: '用于发布包到 NPM 注册表',
      icon: '📦',
      getUrl: 'https://www.npmjs.com/settings/tokens',
      instructions: [
        '1. 访问 https://www.npmjs.com/settings/tokens',
        '2. 点击 "Generate New Token"',
        '3. 选择 "Automation" 类型',
        '4. 复制生成的 Token',
      ],
    },
    {
      name: 'GitHub Token',
      env: 'GITHUB_TOKEN',
      desc: '用于 GitHub Actions 和 API 访问',
      icon: '🐙',
      getUrl: 'https://github.com/settings/tokens',
      instructions: [
        '1. 访问 https://github.com/settings/tokens',
        '2. 点击 "Generate new token (classic)"',
        '3. 选择权限：repo, workflow, write:packages',
        '4. 复制生成的 Token',
      ],
    },
    {
      name: 'CodeCov Token',
      env: 'CODECOV_TOKEN',
      desc: '用于上传测试覆盖率报告',
      icon: '📊',
      getUrl: 'https://codecov.io/',
      instructions: [
        '1. 访问 https://codecov.io/ 并登录',
        '2. 添加你的 GitHub 仓库',
        '3. 在仓库设置中找到 Upload Token',
        '4. 复制 Token',
      ],
    },
    {
      name: 'Snyk Token',
      env: 'SNYK_TOKEN',
      desc: '用于安全漏洞扫描',
      icon: '🔒',
      getUrl: 'https://app.snyk.io/account',
      instructions: [
        '1. 访问 https://app.snyk.io/account',
        '2. 在 "General Account Settings" 中找到 Auth Token',
        '3. 点击 "Show" 显示 Token',
        '4. 复制 Token',
      ],
    },
    {
      name: 'Netlify Token',
      env: 'NETLIFY_AUTH_TOKEN',
      desc: '用于部署到 Netlify',
      icon: '🌐',
      getUrl: 'https://app.netlify.com/user/applications',
      instructions: [
        '1. 访问 https://app.netlify.com/user/applications',
        '2. 在 "Personal access tokens" 部分',
        '3. 点击 "New access token"',
        '4. 输入描述并生成 Token',
      ],
    },
    {
      name: 'Vercel Token',
      env: 'VERCEL_TOKEN',
      desc: '用于部署到 Vercel',
      icon: '▲',
      getUrl: 'https://vercel.com/account/tokens',
      instructions: [
        '1. 访问 https://vercel.com/account/tokens',
        '2. 点击 "Create Token"',
        '3. 输入 Token 名称',
        '4. 复制生成的 Token',
      ],
    },
  ]

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

  private waitForInput(): Promise<string> {
    return new Promise((resolve) => {
      // 临时恢复正常模式以接收输入
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }

      let input = ''
      const onData = (chunk: string) => {
        if (chunk === '\n' || chunk === '\r') {
          process.stdin.off('data', onData)
          // 重新设置原始模式
          if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true)
          }
          resolve(input.trim())
        } else if (chunk === KEYS.BACKSPACE) {
          if (input.length > 0) {
            input = input.slice(0, -1)
            process.stdout.write('\b \b')
          }
        } else if (chunk >= ' ' && chunk <= '~') {
          input += chunk
          process.stdout.write('*') // 隐藏实际输入
        }
      }

      process.stdin.on('data', onData)
    })
  }

  private isTokenConfigured(envKey: string): boolean {
    return !!process.env[envKey]
  }

  private displayTokenList(): void {
    console.clear()

    console.log(chalk.yellow.bold('⚙️  环境配置管理'))
    console.log(chalk.gray('选择要配置的 Token\n'))

    this.tokens.forEach((token, index) => {
      const isSelected = index === this.selectedIndex
      const isConfigured = this.isTokenConfigured(token.env)
      const statusIcon = isConfigured ? chalk.green('✅') : chalk.red('❌')
      const statusText = isConfigured ? chalk.green('已配置') : chalk.red('未配置')

      if (isSelected) {
        console.log(chalk.bgBlue.white(`❯ ${token.icon} ${token.name} ${statusIcon}`))
        console.log(chalk.bgBlue.white(`  ${token.desc} - ${statusText}`))
      } else {
        console.log(chalk.gray(`  ${token.icon} ${token.name} ${statusIcon}`))
        console.log(chalk.gray(`  ${token.desc} - ${statusText}`))
      }
      console.log()
    })

    console.log(chalk.gray('(使用 ↑↓ 键选择，Enter 进入配置，Ctrl+C 返回主菜单)'))
  }

  async run(): Promise<void> {
    try {
      while (this.isRunning) {
        this.displayTokenList()

        const key = await this.waitForKeyPress()

        if (key === KEYS.CTRL_C) {
          this.isRunning = false
          break
        }

        if (key === KEYS.UP) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1)
          continue
        }

        if (key === KEYS.DOWN) {
          this.selectedIndex = Math.min(this.tokens.length - 1, this.selectedIndex + 1)
          continue
        }

        if (key === KEYS.ENTER) {
          const selectedToken = this.tokens[this.selectedIndex]
          await this.configureToken(selectedToken)
        }
      }
    } finally {
      // 恢复终端设置
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }
    }
  }

  private async configureToken(token: any): Promise<void> {
    const isConfigured = this.isTokenConfigured(token.env)

    console.clear()
    console.log(chalk.yellow.bold(`⚙️  配置 ${token.name}`))
    console.log(chalk.gray(`${token.desc}\n`))

    if (isConfigured) {
      console.log(chalk.green('✅ 当前状态：已配置'))
      const currentValue = process.env[token.env]
      console.log(chalk.gray(`当前值：${currentValue?.substring(0, 10)}...`))
      console.log()
      console.log(chalk.yellow('选择操作：'))
      console.log(chalk.white('1. 查看完整 Token'))
      console.log(chalk.white('2. 修改 Token'))
      console.log(chalk.white('3. 删除 Token'))
      console.log(chalk.white('0. 返回'))
      console.log()

      const choice = await this.waitForKeyPress()

      switch (choice) {
        case '1':
          await this.showFullToken(token)
          break
        case '2':
          await this.editToken(token)
          break
        case '3':
          await this.deleteToken(token)
          break
      }
    } else {
      console.log(chalk.red('❌ 当前状态：未配置'))
      console.log()
      console.log(chalk.yellow('获取 Token 步骤：'))
      token.instructions.forEach((instruction: string) => {
        console.log(chalk.white(instruction))
      })
      console.log()
      console.log(chalk.cyan(`🔗 获取地址：${token.getUrl}`))
      console.log()
      console.log(chalk.yellow('选择操作：'))
      console.log(chalk.white('1. 配置 Token'))
      console.log(chalk.white('0. 返回'))
      console.log()

      const choice = await this.waitForKeyPress()

      if (choice === '1') {
        await this.editToken(token)
      }
    }
  }

  private async showFullToken(token: any): Promise<void> {
    console.clear()
    console.log(chalk.yellow.bold(`${token.name} 完整值：`))
    console.log(chalk.white(process.env[token.env]))
    console.log(chalk.gray('\n按任意键返回...'))
    await this.waitForKeyPress()
  }

  private async editToken(token: any): Promise<void> {
    console.clear()
    console.log(chalk.yellow.bold(`⚙️  配置 ${token.name}`))
    console.log(chalk.gray('请输入 Token（输入时会隐藏显示）：'))
    console.log()

    const newToken = await this.waitForInput()

    if (newToken.trim()) {
      this.saveTokenToEnv(token.env, newToken.trim())
      console.log(chalk.green('\n✅ Token 配置成功！'))
    } else {
      console.log(chalk.red('\n❌ Token 不能为空'))
    }

    console.log(chalk.gray('按任意键继续...'))
    await this.waitForKeyPress()
  }

  private async deleteToken(token: any): Promise<void> {
    console.clear()
    console.log(chalk.red.bold(`🗑️  删除 ${token.name}`))
    console.log(chalk.yellow('确认要删除这个 Token 吗？(y/N)'))

    const confirm = await this.waitForKeyPress()

    if (confirm.toLowerCase() === 'y') {
      this.removeTokenFromEnv(token.env)
      console.log(chalk.green('\n✅ Token 已删除'))
    } else {
      console.log(chalk.gray('\n已取消'))
    }

    console.log(chalk.gray('按任意键继续...'))
    await this.waitForKeyPress()
  }

  private saveTokenToEnv(key: string, value: string): void {
    const fs = require('node:fs')
    let envContent = ''

    if (fs.existsSync(this.envFilePath)) {
      envContent = fs.readFileSync(this.envFilePath, 'utf-8')
    }

    const regex = new RegExp(`^${key}=.*$`, 'm')
    const newLine = `${key}=${value}`

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine)
    } else {
      envContent += envContent.endsWith('\n') ? newLine + '\n' : '\n' + newLine + '\n'
    }

    fs.writeFileSync(this.envFilePath, envContent)
    // 更新当前进程的环境变量
    process.env[key] = value
  }

  private removeTokenFromEnv(key: string): void {
    const fs = require('node:fs')
    if (!fs.existsSync(this.envFilePath)) return

    const envContent = fs.readFileSync(this.envFilePath, 'utf-8')
    const regex = new RegExp(`^${key}=.*$\n?`, 'm')
    const newContent = envContent.replace(regex, '')

    fs.writeFileSync(this.envFilePath, newContent)
    // 删除当前进程的环境变量
    delete process.env[key]
  }
}

// 检查是否直接运行此文件
if (process.argv[1]?.includes('menu-simple.ts')) {
  main().catch(console.error)
}
