#!/usr/bin/env tsx

import { execSync } from 'node:child_process'
import readline from 'node:readline'
import chalk from 'chalk'
import ora from 'ora'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// 提交类型选项
const COMMIT_TYPES = [
  { value: 'feat', description: '新功能 (feature)' },
  { value: 'fix', description: '修复 bug' },
  { value: 'docs', description: '文档更新' },
  { value: 'style', description: '代码格式调整（不影响功能）' },
  { value: 'refactor', description: '重构代码' },
  { value: 'perf', description: '性能优化' },
  { value: 'test', description: '测试相关' },
  { value: 'chore', description: '构建过程或辅助工具的变动' },
  { value: 'ci', description: 'CI/CD 相关' },
  { value: 'build', description: '构建系统或外部依赖变更' },
] as const

interface CommitOptions {
  silent?: boolean
}

class CommitAutomation {
  private hasStash = false
  private originalBranch = ''

  // 执行命令并返回结果
  private exec(command: string, options: CommitOptions = {}): string {
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

  // 检查是否在 Git 仓库中
  private checkGitRepo(): boolean {
    try {
      this.exec('git rev-parse --git-dir', { silent: true })
      return true
    }
 catch {
      console.error(chalk.red('❌ 当前目录不是 Git 仓库'))
      return false
    }
  }

  // 检查工作区是否干净
  private checkWorkingDirectory(): boolean {
    try {
      const status = this.exec('git status --porcelain', { silent: true })
      return status.length === 0
    }
 catch {
      return false
    }
  }

  // 获取当前分支
  private getCurrentBranch(): string {
    try {
      return this.exec('git branch --show-current', { silent: true })
    }
 catch {
      return 'main'
    }
  }

  // 代码质量检查
  private async runQualityChecks(): Promise<void> {
    const checks = [
      { name: 'TypeScript 类型检查', command: 'pnpm typecheck' },
      { name: 'ESLint 代码规范检查', command: 'pnpm lint' },
      { name: '运行测试用例', command: 'pnpm test:run' },
      { name: '验证项目构建', command: 'pnpm build' },
      { name: '验证文档构建', command: 'pnpm docs:build' },
    ]

    console.log(chalk.blue('\n🔍 开始代码质量检查...\n'))

    for (const check of checks) {
      const spinner = ora(check.name).start()
      try {
        this.exec(check.command, { silent: true })
        spinner.succeed(chalk.green(`✅ ${check.name}`))
      }
 catch (error) {
        spinner.fail(chalk.red(`❌ ${check.name}`))
        console.error(chalk.red(`\n错误详情: ${(error as Error).message}\n`))

        const shouldContinue = await this.askQuestion(
          chalk.yellow('是否忽略此错误并继续？(y/N): '),
        )

        if (shouldContinue.toLowerCase() !== 'y') {
          throw new Error(`质量检查失败: ${check.name}`)
        }
      }
    }

    console.log(chalk.green('\n✅ 所有质量检查通过！\n'))
  }

  // Git 操作流程
  private async runGitOperations(): Promise<void> {
    console.log(chalk.blue('🔄 开始 Git 操作流程...\n'))

    // 获取当前分支
    this.originalBranch = this.getCurrentBranch()
    console.log(chalk.cyan(`当前分支: ${this.originalBranch}`))

    // 检查是否有未提交的更改
    if (!this.checkWorkingDirectory()) {
      // 暂存当前更改
      const spinner1 = ora('暂存当前工作区更改').start()
      try {
        this.exec('git stash push -m "auto-stash-before-commit"', { silent: true })
        this.hasStash = true
        spinner1.succeed(chalk.green('✅ 已暂存当前更改'))
      }
 catch (error) {
        spinner1.fail(chalk.red('❌ 暂存失败'))
        throw error
      }
    }

    // 拉取最新代码
    const spinner2 = ora('拉取最新代码').start()
    try {
      this.exec(`git pull --rebase origin ${this.originalBranch}`, { silent: true })
      spinner2.succeed(chalk.green('✅ 已拉取最新代码'))
    }
 catch (error) {
      spinner2.fail(chalk.red('❌ 拉取代码失败'))
      await this.rollback()
      throw error
    }

    // 恢复暂存的更改
    if (this.hasStash) {
      const spinner3 = ora('恢复暂存的更改').start()
      try {
        this.exec('git stash pop', { silent: true })
        spinner3.succeed(chalk.green('✅ 已恢复暂存的更改'))
      }
 catch (error) {
        spinner3.fail(chalk.red('❌ 恢复更改失败，可能存在冲突'))
        console.log(chalk.yellow('\n请手动解决冲突后重新运行提交命令'))
        throw error
      }
    }

    // 清理 stash
    try {
      this.exec('git stash clear', { silent: true })
    }
 catch {
      // 忽略清理失败
    }
  }

  // 交互式提交
  private async interactiveCommit(): Promise<void> {
    console.log(chalk.blue('\n📝 准备提交代码...\n'))

    // 显示当前状态
    console.log(chalk.cyan('当前更改:'))
    this.exec('git status --short')

    // 选择提交类型
    console.log(chalk.cyan('\n请选择提交类型:'))
    COMMIT_TYPES.forEach((type, index) => {
      console.log(chalk.white(`${index + 1}. ${type.value}: ${type.description}`))
    })

    const typeIndex = await this.askQuestion('\n请输入选项编号 (1-10): ')
    const selectedType = COMMIT_TYPES[Number.parseInt(typeIndex) - 1]

    if (!selectedType) {
      throw new Error('无效的提交类型选择')
    }

    // 输入提交描述
    const description = await this.askQuestion('\n请输入提交描述: ')
    if (!description.trim()) {
      throw new Error('提交描述不能为空')
    }

    // 询问是否为破坏性更改
    const isBreaking = await this.askQuestion('\n是否为破坏性更改？(y/N): ')
    const breakingFlag = isBreaking.toLowerCase() === 'y' ? '!' : ''

    // 构建提交信息
    const commitMessage = `${selectedType.value}${breakingFlag}: ${description.trim()}`

    // 确认提交
    console.log(chalk.cyan(`\n提交信息: ${commitMessage}`))
    const confirm = await this.askQuestion('\n确认提交？(Y/n): ')

    if (confirm.toLowerCase() === 'n') {
      throw new Error('用户取消提交')
    }

    // 添加所有更改
    const spinner1 = ora('添加文件到暂存区').start()
    try {
      this.exec('git add .', { silent: true })
      spinner1.succeed(chalk.green('✅ 已添加文件到暂存区'))
    }
 catch (error) {
      spinner1.fail(chalk.red('❌ 添加文件失败'))
      throw error
    }

    // 提交更改
    const spinner2 = ora('提交更改').start()
    try {
      this.exec(`git commit -m "${commitMessage}"`, { silent: true })
      spinner2.succeed(chalk.green('✅ 已提交更改'))
    }
 catch (error) {
      spinner2.fail(chalk.red('❌ 提交失败'))
      throw error
    }

    // 推送到远程仓库
    const spinner3 = ora('推送到远程仓库').start()
    try {
      this.exec(`git push origin ${this.originalBranch}`, { silent: true })
      spinner3.succeed(chalk.green('✅ 已推送到远程仓库'))
    }
 catch (error) {
      spinner3.fail(chalk.red('❌ 推送失败'))
      throw error
    }

    console.log(chalk.green('\n🎉 提交完成！'))
  }

  // 回滚操作
  private async rollback(): Promise<void> {
    console.log(chalk.yellow('\n🔄 正在回滚操作...'))

    if (this.hasStash) {
      try {
        this.exec('git stash pop', { silent: true })
        console.log(chalk.green('✅ 已恢复暂存的更改'))
      }
 catch {
        console.log(chalk.yellow('⚠️ 无法自动恢复暂存的更改，请手动检查'))
      }
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

  // 主流程
  async run(): Promise<void> {
    try {
      console.log(chalk.blue.bold('\n🚀 开始自动化提交流程...\n'))

      // 检查 Git 仓库
      if (!this.checkGitRepo()) {
        process.exit(1)
      }

      // 运行质量检查
      await this.runQualityChecks()

      // Git 操作流程
      await this.runGitOperations()

      // 交互式提交
      await this.interactiveCommit()
    }
 catch (error) {
      console.error(chalk.red(`\n❌ 提交流程失败: ${(error as Error).message}`))
      await this.rollback()
      process.exit(1)
    }
 finally {
      rl.close()
    }
  }
}

// 运行脚本
if (import.meta.url.includes('commit.ts') || process.argv[1]?.includes('commit.ts')) {
  const automation = new CommitAutomation()
  await automation.run()
}
