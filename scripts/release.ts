#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import chalk from 'chalk'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

interface PackageJson {
  version: string
  [key: string]: any
}

interface ReleaseOptions {
  silent?: boolean
}

type ReleaseType = 'patch' | 'minor' | 'major'

class ReleaseManager {
  private packagePath = path.join(process.cwd(), 'package.json')
  private package: PackageJson

  constructor() {
    this.package = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'))
  }

  // 执行命令
  private exec(command: string, options: ReleaseOptions = {}): string {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options,
      }).trim()
    }
 catch (error) {
      if (!options.silent) {
        console.error(chalk.red(`命令执行失败: ${command}`))
        console.error(chalk.red((error as Error).message))
      }
      throw error
    }
  }

  // 询问用户输入
  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer)
      })
    })
  }

  // 检查工作区状态
  private checkWorkingDirectory(): boolean {
    try {
      const status = this.exec('git status --porcelain', { silent: true })
      return status.length === 0
    }
 catch {
      return false
    }
  }

  // 获取当前版本
  private getCurrentVersion(): string {
    return this.package.version
  }

  // 计算新版本
  private calculateNewVersion(currentVersion: string, releaseType: ReleaseType): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number)

    switch (releaseType) {
      case 'patch':
        return `${major}.${minor}.${patch + 1}`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'major':
        return `${major + 1}.0.0`
      default:
        throw new Error(`无效的发布类型: ${releaseType}`)
    }
  }

  // 更新版本号
  private updateVersion(newVersion: string): void {
    this.package.version = newVersion
    fs.writeFileSync(this.packagePath, `${JSON.stringify(this.package, null, 2)}\n`)
    console.log(chalk.green(`✅ 版本号已更新为: ${newVersion}`))
  }

  // 生成 changelog
  private generateChangelog(fromVersion: string): string {
    try {
      const gitLog = this.exec(
        `git log v${fromVersion}..HEAD --pretty=format:"- %s (%h)" --no-merges`,
        { silent: true },
      )

      if (!gitLog) {
        return '- 初始发布'
      }

      return gitLog
    }
 catch {
      return '- 无法生成变更日志'
    }
  }

  // 运行发布前检查
  private async runPreReleaseChecks(): Promise<void> {
    console.log(chalk.blue('🔍 运行发布前检查...\n'))

    const checks = [
      { name: 'TypeScript 类型检查', command: 'pnpm typecheck' },
      { name: 'ESLint 代码检查', command: 'pnpm lint' },
      { name: '运行测试', command: 'pnpm test:run' },
      { name: '构建项目', command: 'pnpm build' },
      { name: '构建文档', command: 'pnpm docs:build' },
    ]

    for (const check of checks) {
      try {
        console.log(chalk.cyan(`   ${check.name}...`))
        this.exec(check.command, { silent: true })
        console.log(chalk.green(`   ✅ ${check.name}`))
      }
 catch (error) {
        console.log(chalk.red(`   ❌ ${check.name}`))
        throw new Error(`发布前检查失败: ${check.name}`)
      }
    }

    console.log(chalk.green('\n✅ 所有发布前检查通过！\n'))
  }

  // 主发布流程
  async release(): Promise<void> {
    try {
      console.log(chalk.blue.bold('🚀 开始发布流程...\n'))

      // 检查工作区
      if (!this.checkWorkingDirectory()) {
        throw new Error('工作区不干净，请先提交或暂存所有更改')
      }

      // 获取当前版本
      const currentVersion = this.getCurrentVersion()
      console.log(chalk.cyan(`当前版本: ${currentVersion}`))

      // 选择发布类型
      console.log(chalk.cyan('\n请选择发布类型:'))
      console.log(chalk.white('1. patch - 修复版本 (1.0.0 -> 1.0.1)'))
      console.log(chalk.white('2. minor - 功能版本 (1.0.0 -> 1.1.0)'))
      console.log(chalk.white('3. major - 重大版本 (1.0.0 -> 2.0.0)'))

      const releaseTypeInput = await this.askQuestion('\n请输入选项 (1-3): ')
      const releaseTypes: ReleaseType[] = ['patch', 'minor', 'major']
      const releaseType = releaseTypes[Number.parseInt(releaseTypeInput) - 1]

      if (!releaseType) {
        throw new Error('无效的发布类型选择')
      }

      // 计算新版本
      const newVersion = this.calculateNewVersion(currentVersion, releaseType)
      console.log(chalk.cyan(`新版本: ${newVersion}`))

      // 确认发布
      const confirm = await this.askQuestion(`\n确认发布版本 ${newVersion}？(y/N): `)
      if (confirm.toLowerCase() !== 'y') {
        throw new Error('用户取消发布')
      }

      // 运行发布前检查
      await this.runPreReleaseChecks()

      // 更新版本号
      this.updateVersion(newVersion)

      // 生成 changelog
      const changelog = this.generateChangelog(currentVersion)
      console.log(chalk.blue('\n📝 变更日志:'))
      console.log(chalk.white(changelog))

      // 提交版本更新
      console.log(chalk.blue('\n📦 提交版本更新...'))
      this.exec('git add package.json')
      this.exec(`git commit -m "chore: release v${newVersion}"`)

      // 创建标签
      console.log(chalk.blue('🏷️  创建版本标签...'))
      this.exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`)

      // 推送到远程
      console.log(chalk.blue('⬆️  推送到远程仓库...'))
      this.exec('git push origin main')
      this.exec(`git push origin v${newVersion}`)

      console.log(chalk.green.bold(`\n🎉 版本 ${newVersion} 发布成功！`))
      console.log(chalk.cyan('GitHub Actions 将自动处理 NPM 发布和文档更新'))
    }
 catch (error) {
      console.error(chalk.red(`\n❌ 发布失败: ${(error as Error).message}`))
      process.exit(1)
    }
 finally {
      rl.close()
    }
  }
}

// 运行发布脚本
if (import.meta.url.includes('release.ts') || process.argv[1]?.includes('release.ts')) {
  const releaseManager = new ReleaseManager()
  await releaseManager.release()
}
