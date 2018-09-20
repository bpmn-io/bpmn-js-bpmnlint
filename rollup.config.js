import pkg from './package.json';

import json from 'rollup-plugin-json';
import string from 'rollup-plugin-string';

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';


function pgl(plugins=[]) {
  return [
    resolve(),
    json(),
    string({
      include: '**/*.svg'
    }),
    ...plugins,
    commonjs()
  ];
}

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    plugins: pgl(),
    external: [
      'min-dash',
      'min-dom',
      'bpmnlint'
    ]
  }
];