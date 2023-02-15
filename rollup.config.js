import { string } from 'rollup-plugin-string';

import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import pkg from './package.json';

const srcEntry = pkg.source;
const umdDist = pkg[ 'umd:main' ];
const umdName = 'BpmnJSBpmnlint';


function pgl(plugins = []) {
  return [
    string({
      include: '**/*.svg'
    }),
    ...plugins
  ];
}

export default [

  // browser-friendly UMD build
  {
    input: srcEntry,
    output: {
      file: umdDist.replace(/\.js$/, '.prod.js'),
      format: 'umd',
      name: umdName,
      exports: 'auto'
    },
    plugins: pgl([
      resolve(),
      commonjs(),
      terser()
    ])
  },
  {
    input: srcEntry,
    output: {
      file: umdDist,
      format: 'umd',
      name: umdName,
      exports: 'auto'
    },
    plugins: pgl([
      resolve(),
      commonjs()
    ])
  },

  {
    input: srcEntry,
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    external: [
      'bpmnlint',
      'min-dom',
      'min-dash',
      'diagram-js/lib/util/EscapeUtil',
      'bpmn-js/lib/util/ModelUtil',
      'moddle'
    ],
    plugins: pgl()
  }
];