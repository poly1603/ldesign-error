#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import chalk from 'chalk'

interface FileAnalysis {
  name: string
  path: string
  size: number
  gzipSize: number
  sizeFormatted: string
  gzipSizeFormatted: string
  compressionRatio: number
}

interface BundleResult {
  name: string
  totalSize: number
  totalGzipSize: number
  totalSizeFormatted: string
  totalGzipSizeFormatted: string
  fileCount: number
}

interface BundleReport {
  timestamp: string
  nodeVersion: string
  results: Record<string, BundleResult>
  summary: {
    totalFiles: number
    totalSize: number
    totalGzipSize: number
    totalSizeFormatted: string
    totalGzipSizeFormatted: string
  }
}

interface SizeLimit {
  max: number
  name: string
}

class BundleAnalyzer {
  private results: Record<string, BundleResult> = {}

  // 获取文件大小
  private getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath)
      return stats.size
    }
 catch {
      return 0
    }
  }

  // 获取 Gzip 压缩后的大小
  private getGzipSize(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath)
      const compressed = gzipSync(content)
      return compressed.length
    }
 catch {
      return 0
    }
  }

  // 格式化文件大小
  private formatSize(bytes: number): string {
    if (bytes === 0)
return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  // 分析单个文件
  private analyzeFile(filePath: string, name: string): FileAnalysis {
    const size = this.getFileSize(filePath)
    const gzipSize = this.getGzipSize(filePath)

    return {
      name,
      path: filePath,
      size,
      gzipSize,
      sizeFormatted: this.formatSize(size),
      gzipSizeFormatted: this.formatSize(gzipSize),
      compressionRatio: size > 0 ? Math.round((1 - gzipSize / size) * 100) : 0,
    }
  }

  // 分析构建输出
  private analyzeBuildOutput(): void {
    const buildDirs = [
      { dir: 'es', name: 'ESM' },
      { dir: 'lib', name: 'CommonJS' },
      { dir: 'dist', name: 'UMD' },
      { dir: 'types', name: 'TypeScript Declarations' },
    ]

    console.log(chalk.blue.bold('📦 分析构建输出...\n'))

    buildDirs.forEach(({ dir, name }) => {
      const dirPath = path.join(process.cwd(), dir)

      if (!fs.existsSync(dirPath)) {
        console.log(chalk.yellow(`⚠️  ${name} 目录不存在: ${dir}`))
        return
      }

      console.log(chalk.cyan(`📁 ${name} (${dir}/)`))

      const files = this.getFilesRecursively(dirPath)
      let totalSize = 0
      let totalGzipSize = 0

      files.forEach((file) => {
        const relativePath = path.relative(dirPath, file)
        const analysis = this.analyzeFile(file, relativePath)

        totalSize += analysis.size
        totalGzipSize += analysis.gzipSize

        if (analysis.size > 0) {
          console.log(chalk.white(`   ${analysis.name}`))
          console.log(chalk.gray(`     原始大小: ${analysis.sizeFormatted}`))
          console.log(
            chalk.gray(
              `     Gzip 大小: ${analysis.gzipSizeFormatted} (${analysis.compressionRatio}% 压缩)`,
            ),
          )
        }
      })

      this.results[dir] = {
        name,
        totalSize,
        totalGzipSize,
        totalSizeFormatted: this.formatSize(totalSize),
        totalGzipSizeFormatted: this.formatSize(totalGzipSize),
        fileCount: files.length,
      }

      console.log(
        chalk.green(
          `   总计: ${this.formatSize(totalSize)} (Gzip: ${this.formatSize(totalGzipSize)})`,
        ),
      )
      console.log()
    })
  }

  // 递归获取目录下的所有文件
  private getFilesRecursively(dir: string): string[] {
    const files: string[] = []

    const traverse = (currentDir: string): void => {
      const items = fs.readdirSync(currentDir)

      items.forEach((item) => {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          traverse(fullPath)
        }
 else {
          files.push(fullPath)
        }
      })
    }

    traverse(dir)
    return files
  }

  // 检查包大小限制
  private checkSizeLimits(): boolean {
    console.log(chalk.blue.bold('🚨 检查包大小限制...\n'))

    const limits: Record<string, SizeLimit> = {
      es: { max: 100 * 1024, name: 'ESM Bundle' }, // 100KB
      lib: { max: 100 * 1024, name: 'CommonJS Bundle' }, // 100KB
      dist: { max: 150 * 1024, name: 'UMD Bundle' }, // 150KB
    }

    let hasWarnings = false

    Object.entries(limits).forEach(([dir, limit]) => {
      const result = this.results[dir]

      if (!result) {
        console.log(chalk.yellow(`⚠️  ${limit.name}: 构建输出不存在`))
        return
      }

      if (result.totalGzipSize > limit.max) {
        console.log(
          chalk.red(
            `❌ ${limit.name}: ${result.totalGzipSizeFormatted} (超过限制 ${this.formatSize(
              limit.max,
            )})`,
          ),
        )
        hasWarnings = true
      }
 else {
        console.log(chalk.green(`✅ ${limit.name}: ${result.totalGzipSizeFormatted} (在限制内)`))
      }
    })

    if (hasWarnings) {
      console.log(chalk.yellow('\n⚠️  某些包超过了大小限制，请考虑优化'))
    }
 else {
      console.log(chalk.green('\n✅ 所有包都在大小限制内'))
    }

    return !hasWarnings
  }

  // 生成报告
  private generateReport(): BundleReport {
    const report: BundleReport = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      results: this.results,
      summary: {
        totalFiles: Object.values(this.results).reduce((sum, r) => sum + r.fileCount, 0),
        totalSize: Object.values(this.results).reduce((sum, r) => sum + r.totalSize, 0),
        totalGzipSize: Object.values(this.results).reduce((sum, r) => sum + r.totalGzipSize, 0),
        totalSizeFormatted: '',
        totalGzipSizeFormatted: '',
      },
    }

    report.summary.totalSizeFormatted = this.formatSize(report.summary.totalSize)
    report.summary.totalGzipSizeFormatted = this.formatSize(report.summary.totalGzipSize)

    // 保存报告
    const reportPath = path.join(process.cwd(), 'bundle-analysis.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(chalk.blue.bold('\n📊 Bundle 分析汇总:'))
    console.log(chalk.white(`   总文件数: ${report.summary.totalFiles}`))
    console.log(chalk.white(`   总大小: ${report.summary.totalSizeFormatted}`))
    console.log(chalk.white(`   Gzip 总大小: ${report.summary.totalGzipSizeFormatted}`))
    console.log(chalk.gray(`   报告已保存到: ${reportPath}`))

    return report
  }

  // 运行完整分析
  async run(): Promise<void> {
    console.log(chalk.blue.bold('🔍 开始 Bundle 大小分析...\n'))

    try {
      this.analyzeBuildOutput()
      const sizeCheckPassed = this.checkSizeLimits()
      this.generateReport()

      if (sizeCheckPassed) {
        console.log(chalk.green.bold('\n✅ Bundle 分析完成，所有检查通过！'))
      }
 else {
        console.log(chalk.yellow.bold('\n⚠️  Bundle 分析完成，但有警告'))
        process.exit(1)
      }
    }
 catch (error) {
      console.error(chalk.red('❌ Bundle 分析失败:'), (error as Error).message)
      process.exit(1)
    }
  }
}

// 运行分析
if (import.meta.url.includes('bundle-analyzer.ts') || process.argv[1]?.includes('bundle-analyzer.ts')) {
  const analyzer = new BundleAnalyzer()
  await analyzer.run()
}
