#!/usr/bin/env tsx

import { join } from 'node:path'
import chalk from 'chalk'
import { config } from 'dotenv'

// 加载 .env.local 文件
config({ path: join(process.cwd(), '.env.local') })

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
