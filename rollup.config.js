import { string } from 'rollup-plugin-string';

import pkg from './package.json';

const srcEntry = pkg.source;


function pgl(plugins = []) {
  return [
    string({
      include: '**/*.svg'
    }),
    ...plugins
  ];
}

export default [
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