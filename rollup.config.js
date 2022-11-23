import sveltePreprocess from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';
import svelte from 'rollup-plugin-svelte';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { babel } from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';

// rollup -c -w
const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.ts',
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: 'public/assets/bundle.js',
  },
  context: 'window',
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
    }),
    svelte({
      preprocess: sveltePreprocess({
        sourceMap: !production,
        postcss: true,
        typescript: {
          compilerOptions: {
            target: 'ES2015',
            module: 'ES2015',
          },
        },
        replace: [[/process\.env\.(\w+)/g, (_, prop) => JSON.stringify(process.env[prop])]],
      }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: 'bundle.css' }),
    image(),

    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': !production ? "'development'" : "'production'",
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),
    nodePolyfills(),
    babel({
      extensions: ['.js', '.ts', '.html', '.svelte'],
      babelHelpers: 'runtime',
      exclude: ['node_modules/@babel/**'],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { firefox: '48' },
            exclude: ['@babel/plugin-transform-regenerator'],
          },
        ],
      ],
      plugins: [
        '@babel/plugin-syntax-dynamic-import',
        [
          '@babel/plugin-transform-runtime',
          {
            useESModules: true,
            regenerator: false,
          },
        ],
      ],
    }),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
