#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'

interface BenchmarkResult {
  name: string
  iterations: number
  totalTime: number
  avgTime: number
  opsPerSecond: number
}

interface BenchmarkReport {
  timestamp: string
  nodeVersion: string
  platform: string
  arch: string
  memory: NodeJS.MemoryUsage
  benchmarks: BenchmarkResult[]
}

// 模拟 Store 类用于基准测试
class MockStore {
  private state: Record<string, any> = {}
  public getters: Record<string, () => any> = {}
  public actions: Record<string, () => any> = {}

  setState(key: string, value: any): void {
    this.state[key] = value
  }

  getState(key: string): any {
    return this.state[key]
  }

  addGetter(key: string, fn: () => any): void {
    this.getters[key] = fn
  }

  addAction(key: string, fn: () => any): void {
    this.actions[key] = fn
  }
}

class BenchmarkRunner {
  private results: BenchmarkResult[] = []

  // 运行基准测试
  async runBenchmark(
    name: string,
    fn: () => any | Promise<any>,
    iterations = 10000,
  ): Promise<BenchmarkResult> {
    console.log(chalk.blue(`🏃 运行基准测试: ${name}`))

    // 预热
    for (let i = 0; i < 100; i++) {
      await fn()
    }

    // 正式测试
    const start = performance.now()

    for (let i = 0; i < iterations; i++) {
      await fn()
    }

    const end = performance.now()
    const totalTime = end - start
    const avgTime = totalTime / iterations
    const opsPerSecond = 1000 / avgTime

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime: Math.round(totalTime * 100) / 100,
      avgTime: Math.round(avgTime * 1000) / 1000,
      opsPerSecond: Math.round(opsPerSecond),
    }

    this.results.push(result)

    console.log(chalk.green(`✅ ${name}:`))
    console.log(chalk.white(`   总时间: ${result.totalTime}ms`))
    console.log(chalk.white(`   平均时间: ${result.avgTime}ms`))
    console.log(chalk.white(`   每秒操作数: ${result.opsPerSecond} ops/sec`))
    console.log()

    return result
  }

  // Store 创建性能测试
  async testStoreCreation(): Promise<void> {
    await this.runBenchmark(
      'Store 创建',
      () => {
        const store = new MockStore()
        store.setState('count', 0)
        store.addGetter('doubleCount', () => store.getState('count') * 2)
        store.addAction('increment', () => {
          store.setState('count', store.getState('count') + 1)
        })
        return store
      },
      1000,
    )
  }

  // 状态更新性能测试
  async testStateUpdate(): Promise<void> {
    const store = new MockStore()
    store.setState('count', 0)

    await this.runBenchmark('状态更新', () => {
      const currentCount = store.getState('count')
      store.setState('count', currentCount + 1)
    })
  }

  // 计算属性性能测试
  async testGetterPerformance(): Promise<void> {
    const store = new MockStore()
    store.setState(
      'items',
      Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i * 2 })),
    )
    store.addGetter('totalValue', () => {
      return store.getState('items').reduce((sum: number, item: any) => sum + item.value, 0)
    })

    await this.runBenchmark('计算属性计算', () => {
      return store.getters.totalValue()
    })
  }

  // 大数据集处理性能测试
  async testLargeDataset(): Promise<void> {
    const store = new MockStore()
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 1000,
    }))

    await this.runBenchmark(
      '大数据集设置',
      () => {
        store.setState('largeData', largeArray)
      },
      100,
    )

    store.setState('largeData', largeArray)

    await this.runBenchmark(
      '大数据集查询',
      () => {
        const data = store.getState('largeData')
        return data.filter((item: any) => item.value > 500)
      },
      1000,
    )
  }

  // 内存使用测试
  testMemoryUsage(): NodeJS.MemoryUsage {
    const used = process.memoryUsage()

    console.log(chalk.blue('📊 内存使用情况:'))
    console.log(chalk.white(`   RSS: ${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`))
    console.log(
      chalk.white(`   Heap Total: ${Math.round((used.heapTotal / 1024 / 1024) * 100) / 100} MB`),
    )
    console.log(
      chalk.white(`   Heap Used: ${Math.round((used.heapUsed / 1024 / 1024) * 100) / 100} MB`),
    )
    console.log(
      chalk.white(`   External: ${Math.round((used.external / 1024 / 1024) * 100) / 100} MB`),
    )
    console.log()

    return used
  }

  // 生成报告
  generateReport(): BenchmarkReport {
    const report: BenchmarkReport = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: this.testMemoryUsage(),
      benchmarks: this.results,
    }

    // 保存到文件
    const reportPath = path.join(process.cwd(), 'benchmark-results.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(chalk.green(`📄 基准测试报告已保存到: ${reportPath}`))

    // 显示汇总
    console.log(chalk.blue('📈 基准测试汇总:'))
    this.results.forEach((result) => {
      console.log(chalk.white(`   ${result.name}: ${result.opsPerSecond} ops/sec`))
    })

    return report
  }

  // 运行所有测试
  async runAll(): Promise<void> {
    console.log(chalk.blue.bold('🚀 开始性能基准测试...\n'))

    try {
      await this.testStoreCreation()
      await this.testStateUpdate()
      await this.testGetterPerformance()
      await this.testLargeDataset()

      this.generateReport()

      console.log(chalk.green.bold('✅ 所有基准测试完成！'))
    }
 catch (error) {
      console.error(chalk.red('❌ 基准测试失败:'), (error as Error).message)
      process.exit(1)
    }
  }
}

// 运行基准测试
if (import.meta.url.includes('benchmark.ts') || process.argv[1]?.includes('benchmark.ts')) {
  const runner = new BenchmarkRunner()
  await runner.runAll()
}
