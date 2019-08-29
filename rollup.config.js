import pkg from './package.json';

import { string } from 'rollup-plugin-string';

function pgl(plugins=[]) {
  return [
    string({
      include: '**/*.svg'
    }),
    ...plugins
  ];
}

const srcEntry = pkg.source;

export default [
  {
    input: srcEntry,
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    external: [
      'bpmnlint',
      'min-dom',
      'min-dash',
      'diagram-js/lib/util/EscapeUtil',
      'moddle'
    ],
    plugins: pgl()
  }
];