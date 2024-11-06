import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

const files = {
  build: [
    '*.js',
    '*.mjs',
    'test/distro/karma.conf.js'
  ],
  ignored: [
    'dist'
  ],
  test: [
    'test/**/*.js'
  ]
};


export default [
  {
    ignores: files.ignored
  },

  // build
  ...bpmnIoPlugin.configs.node.map(config => {
    return {
      ...config,
      files: files.build
    };
  }),

  // lib + test
  ...bpmnIoPlugin.configs.browser.map(config => {
    return {
      ...config,
      ignores: files.build
    };
  }),

  // test
  ...bpmnIoPlugin.configs.mocha.map(config => {
    return {
      ...config,
      files: files.test
    };
  }),
  {
    languageOptions: {
      globals: {
        require: false,
        sinon: false
      }
    },
    files: files.test
  }
];
