import { readFileSync } from 'node:fs'
import path from 'node:path'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { glob } from 'glob'
import dts from 'rollup-plugin-dts'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
  'vue',
  'pinia',
]

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} LDesign Team
 * @license MIT
 */`

// 获取所有入口文件
const entryFiles = glob.sync('src/**/*.ts', {
  ignore: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
})

// 创建入口对象
function createEntries(files) {
  const entries = {}
  files.forEach((file) => {
    const name = path.relative('src', file).replace(/\.ts$/, '')
    entries[name] = file
  })
  return entries
}

export default [
  // ESM build - 多入口
  {
    input: createEntries(entryFiles),
    output: {
      dir: 'es',
      format: 'es',
      banner,
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external,
    plugins: [
      nodeResolve({
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        outDir: 'es',
      }),
    ],
  },

  // CommonJS build - 多入口
  {
    input: createEntries(entryFiles),
    output: {
      dir: 'lib',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'named',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external,
    plugins: [
      nodeResolve({
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        outDir: 'lib',
      }),
    ],
  },

  // UMD build - 单入口
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'umd',
        name: 'LDesignStore',
        banner,
        sourcemap: true,
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
        },
      },
    ],
    external: ['vue', 'pinia'],
    plugins: [
      nodeResolve({
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
  },

  // Type definitions - 多入口
  {
    input: createEntries(entryFiles),
    output: {
      dir: 'types',
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external,
    plugins: [
      dts({
        tsconfig: './tsconfig.json',
      }),
    ],
  },
]
