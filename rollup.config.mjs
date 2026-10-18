import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: 'json' };

const banner = `/*! cabelo v${pkg.version} | MIT License | https://github.com/felipemarcos/cabelo */`;

const umd = {
  format: 'umd',
  name: 'cabelo',
  exports: 'default',
  banner
};

export default [
  {
    input: 'src/index.js',
    output: { file: 'dist/cabelo.mjs', format: 'es', banner }
  },
  {
    input: 'src/umd.js',
    output: [
      Object.assign({ file: 'dist/cabelo.js' }, umd),
      Object.assign({ file: 'dist/cabelo.min.js', plugins: [terser({ format: { comments: /^!/ } })] }, umd)
    ]
  }
];
