#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import chalk from 'chalk'

// 键盘按键常量
const KEYS = {
  UP: '\u001B[A',
  DOWN: '\u001B[B',
  ENTER: '\r',
  ESC: '\u001B[1b',
  CTRL_C: '\u0003',
  BACKSPACE: '\u007F',
}

interface TokenConfig {
  name: string
  envKey: string
  description: string
  icon: string
  getUrl: string
  instructions: string[]
  isConfigured: boolean
  value?: string
}

const TOKEN_CONFIGS: TokenConfig[] = [
  {
    name: 'NPM Token',
    envKey: 'NPM_TOKEN',
    description: '用于发布包到 NPM 注册表',
    icon: '📦',
    getUrl: 'https://www.npmjs.com/settings/tokens',
    instructions: [
      '1. 访问 https://www.npmjs.com/settings/tokens',
      '2. 点击 "Generate New Token"',
      '3. 选择 "Automation" 类型',
      '4. 复制生成的 Token',
    ],
    isConfigured: false,
  },
  {
    name: 'GitHub Token',
    envKey: 'GITHUB_TOKEN',
    description: '用于 GitHub Actions 和 API 访问',
    icon: '🐙',
    getUrl: 'https://github.com/settings/tokens',
    instructions: [
      '1. 访问 https://github.com/settings/tokens',
      '2. 点击 "Generate new token (classic)"',
      '3. 选择权限：repo, workflow, write:packages',
      '4. 复制生成的 Token',
    ],
    isConfigured: false,
  },
  {
    name: 'CodeCov Token',
    envKey: 'CODECOV_TOKEN',
    description: '用于上传测试覆盖率报告',
    icon: '📊',
    getUrl: 'https://codecov.io/',
    instructions: [
      '1. 访问 https://codecov.io/ 并登录',
      '2. 添加你的 GitHub 仓库',
      '3. 在仓库设置中找到 Upload Token',
      '4. 复制 Token',
    ],
    isConfigured: false,
  },
  {
    name: 'Snyk Token',
    envKey: 'SNYK_TOKEN',
    description: '用于安全漏洞扫描',
    icon: '🔒',
    getUrl: 'https://app.snyk.io/account',
    instructions: [
      '1. 访问 https://app.snyk.io/account',
      '2. 在 "General Account Settings" 中找到 Auth Token',
      '3. 点击 "Show" 显示 Token',
      '4. 复制 Token',
    ],
    isConfigured: false,
  },
  {
    name: 'Netlify Token',
    envKey: 'NETLIFY_AUTH_TOKEN',
    description: '用于部署到 Netlify',
    icon: '🌐',
    getUrl: 'https://app.netlify.com/user/applications',
    instructions: [
      '1. 访问 https://app.netlify.com/user/applications',
      '2. 在 "Personal access tokens" 部分',
      '3. 点击 "New access token"',
      '4. 输入描述并生成 Token',
    ],
    isConfigured: false,
  },
  {
    name: 'Vercel Token',
    envKey: 'VERCEL_TOKEN',
    description: '用于部署到 Vercel',
    icon: '▲',
    getUrl: 'https://vercel.com/account/tokens',
    instructions: [
      '1. 访问 https://vercel.com/account/tokens',
      '2. 点击 "Create Token"',
      '3. 输入 Token 名称',
      '4. 复制生成的 Token',
    ],
    isConfigured: false,
  },
]

class ConfigManager {
  private selectedIndex = 0
  private isRunning = true
  private envFilePath = join(process.cwd(), '.env.local')

  constructor() {
    // 设置原始模式以捕获键盘事件
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    // 检查现有配置
    this.checkExistingConfigs()
  }

  private checkExistingConfigs(): void {
    TOKEN_CONFIGS.forEach((config) => {
      // 检查环境变量
      const envValue = process.env[config.envKey]
      if (envValue) {
        config.isConfigured = true
        config.value = envValue
        return
      }

      // 检查 .env.local 文件
      if (existsSync(this.envFilePath)) {
        const envContent = readFileSync(this.envFilePath, 'utf-8')
        const match = envContent.match(new RegExp(`^${config.envKey}=(.+)$`, 'm'))
        if (match) {
          config.isConfigured = true
          config.value = match[1]
        }
      }
    })
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
        }
 else if (chunk === KEYS.BACKSPACE) {
          if (input.length > 0) {
            input = input.slice(0, -1)
            process.stdout.write('\b \b')
          }
        }
 else if (chunk >= ' ' && chunk <= '~') {
          input += chunk
          process.stdout.write('*') // 隐藏实际输入
        }
      }

      process.stdin.on('data', onData)
    })
  }

  private displayMainMenu(): void {
    console.clear()

    console.log(chalk.yellow.bold('⚙️  环境配置管理'))
    console.log(chalk.gray('检查和配置项目所需的 API Token\n'))

    TOKEN_CONFIGS.forEach((config, index) => {
      const isSelected = index === this.selectedIndex
      const statusIcon = config.isConfigured ? chalk.green('✅') : chalk.red('❌')
      const statusText = config.isConfigured ? chalk.green('已配置') : chalk.red('未配置')

      if (isSelected) {
        console.log(chalk.bgBlue.white(`❯ ${config.icon} ${config.name} ${statusIcon} ${statusText}`))
        console.log(chalk.bgBlue.white(`  ${config.description}`))
      }
 else {
        console.log(chalk.gray(`  ${config.icon} ${config.name} ${statusIcon} ${statusText}`))
        console.log(chalk.gray(`  ${config.description}`))
      }
      console.log()
    })

    console.log(chalk.gray('(使用 ↑↓ 键选择，Enter 进入配置，Ctrl+C 返回主菜单)'))
  }

  private async displayTokenConfig(config: TokenConfig): Promise<void> {
    console.clear()

    console.log(chalk.yellow.bold(`⚙️  配置 ${config.name}`))
    console.log(chalk.gray(`${config.description}\n`))

    if (config.isConfigured) {
      console.log(chalk.green('✅ 当前状态：已配置'))
      console.log(chalk.gray(`当前值：${config.value?.substring(0, 10)}...`))
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
          console.clear()
          console.log(chalk.yellow.bold(`${config.name} 完整值：`))
          console.log(chalk.white(config.value))
          console.log(chalk.gray('\n按任意键返回...'))
          await this.waitForKeyPress()
          break

        case '2':
          await this.configureToken(config)
          break

        case '3':
          await this.deleteToken(config)
          break
      }
    }
 else {
      console.log(chalk.red('❌ 当前状态：未配置'))
      console.log()
      console.log(chalk.yellow('获取 Token 步骤：'))
      config.instructions.forEach((instruction) => {
        console.log(chalk.white(instruction))
      })
      console.log()
      console.log(chalk.cyan(`🔗 获取地址：${config.getUrl}`))
      console.log()
      console.log(chalk.yellow('选择操作：'))
      console.log(chalk.white('1. 配置 Token'))
      console.log(chalk.white('2. 打开获取页面'))
      console.log(chalk.white('0. 返回'))
      console.log()

      const choice = await this.waitForKeyPress()

      switch (choice) {
        case '1':
          await this.configureToken(config)
          break

        case '2':
          console.log(chalk.blue(`正在打开：${config.getUrl}`))
          // 这里可以添加打开浏览器的逻辑
          await this.waitForKeyPress()
          break
      }
    }
  }

  private async configureToken(config: TokenConfig): Promise<void> {
    console.clear()
    console.log(chalk.yellow.bold(`⚙️  配置 ${config.name}`))
    console.log(chalk.gray('请输入 Token（输入时会隐藏显示）：'))
    console.log()

    const token = await this.waitForInput()

    if (token.trim()) {
      this.saveTokenToEnv(config.envKey, token.trim())
      config.isConfigured = true
      config.value = token.trim()

      console.log(chalk.green('\n✅ Token 配置成功！'))
    }
 else {
      console.log(chalk.red('\n❌ Token 不能为空'))
    }

    console.log(chalk.gray('按任意键继续...'))
    await this.waitForKeyPress()
  }

  private async deleteToken(config: TokenConfig): Promise<void> {
    console.clear()
    console.log(chalk.red.bold(`🗑️  删除 ${config.name}`))
    console.log(chalk.yellow('确认要删除这个 Token 吗？(y/N)'))

    const confirm = await this.waitForKeyPress()

    if (confirm.toLowerCase() === 'y') {
      this.removeTokenFromEnv(config.envKey)
      config.isConfigured = false
      config.value = undefined

      console.log(chalk.green('\n✅ Token 已删除'))
    }
 else {
      console.log(chalk.gray('\n已取消'))
    }

    console.log(chalk.gray('按任意键继续...'))
    await this.waitForKeyPress()
  }

  private saveTokenToEnv(key: string, value: string): void {
    let envContent = ''

    if (existsSync(this.envFilePath)) {
      envContent = readFileSync(this.envFilePath, 'utf-8')
    }

    const regex = new RegExp(`^${key}=.*$`, 'm')
    const newLine = `${key}=${value}`

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine)
    }
 else {
      envContent += envContent.endsWith('\n') ? `${newLine}\n` : `\n${newLine}\n`
    }

    writeFileSync(this.envFilePath, envContent)
  }

  private removeTokenFromEnv(key: string): void {
    if (!existsSync(this.envFilePath))
return

    const envContent = readFileSync(this.envFilePath, 'utf-8')
    const regex = new RegExp(`^${key}=.*$\n?`, 'm')
    const newContent = envContent.replace(regex, '')

    writeFileSync(this.envFilePath, newContent)
  }

  async run(): Promise<void> {
    try {
      while (this.isRunning) {
        this.displayMainMenu()

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
          this.selectedIndex = Math.min(TOKEN_CONFIGS.length - 1, this.selectedIndex + 1)
          continue
        }

        if (key === KEYS.ENTER) {
          const selectedConfig = TOKEN_CONFIGS[this.selectedIndex]
          await this.displayTokenConfig(selectedConfig)
        }
      }
    }
 finally {
      // 恢复终端设置
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false)
      }
    }
  }
}

export { ConfigManager }
