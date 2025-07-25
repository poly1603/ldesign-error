#!/usr/bin/env tsx

import fs from 'node:fs'
import chalk from 'chalk'

// Conventional Commits 规范
const COMMIT_TYPES = [
  'feat', // 新功能
  'fix', // 修复 bug
  'docs', // 文档更新
  'style', // 代码格式调整（不影响功能）
  'refactor', // 重构代码
  'perf', // 性能优化
  'test', // 测试相关
  'chore', // 构建过程或辅助工具的变动
  'ci', // CI/CD 相关
  'build', // 构建系统或外部依赖变更
  'revert', // 回滚提交
] as const

// 提交信息格式：type(scope): description
// 例如：feat(store): add new state management feature
const COMMIT_REGEX = /^(revert: )?(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?: .{1,50}/

function validateCommitMessage(): void {
  const commitMsgFile = process.argv[2] || '.git/COMMIT_EDITMSG'

  if (!fs.existsSync(commitMsgFile)) {
    console.error(chalk.red('❌ 提交信息文件不存在'))
    process.exit(1)
  }

  const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim()

  // 忽略合并提交
  if (commitMsg.startsWith('Merge')) {
    console.log(chalk.green('✅ 合并提交，跳过验证'))
    process.exit(0)
  }

  // 忽略 revert 提交
  if (commitMsg.startsWith('Revert')) {
    console.log(chalk.green('✅ 回滚提交，跳过验证'))
    process.exit(0)
  }

  // 验证提交信息格式
  if (!COMMIT_REGEX.test(commitMsg)) {
    console.error(chalk.red('❌ 提交信息格式不正确'))
    console.error(chalk.yellow('\n正确格式：'))
    console.error(chalk.white('  type(scope): description'))
    console.error(chalk.white('  type: description'))
    console.error(chalk.yellow('\n示例：'))
    console.error(chalk.white('  feat(store): add new state management feature'))
    console.error(chalk.white('  fix: resolve memory leak issue'))
    console.error(chalk.white('  docs: update API documentation'))
    console.error(chalk.yellow('\n支持的类型：'))
    COMMIT_TYPES.forEach((type) => {
      console.error(chalk.white(`  ${type}`))
    })
    console.error(chalk.yellow('\n当前提交信息：'))
    console.error(chalk.red(`  ${commitMsg}`))
    process.exit(1)
  }

  // 检查描述长度
  const description = commitMsg.split(': ')[1]
  if (description && description.length > 50) {
    console.error(chalk.red('❌ 提交描述过长（超过50个字符）'))
    console.error(chalk.yellow(`当前长度：${description.length}`))
    console.error(chalk.yellow('请简化描述或使用提交体（commit body）来添加详细信息'))
    process.exit(1)
  }

  console.log(chalk.green('✅ 提交信息格式正确'))
}

if (import.meta.url.includes('validate-commit-msg.ts') || process.argv[1]?.includes('validate-commit-msg.ts')) {
  validateCommitMessage()
}

export { COMMIT_REGEX, COMMIT_TYPES, validateCommitMessage }
