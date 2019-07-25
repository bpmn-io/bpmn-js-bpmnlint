# bpmn-js-bpmnlint

Integrates [bpmnlint](https://github.com/bpmn-io/bpmnlint) into [bpmn-js](https://github.com/bpmn-io/bpmn-js).

![Screenshot](docs/screenshot.png)

See this extension in action as part of the [bpmnlint playground](https://github.com/bpmn-io/bpmnlint-playground).


## Usage

Integrate the linter into [bpmn-js](https://github.com/bpmn-io/bpmn-js):

```javascript
import lintModule from 'bpmn-js-bpmnlint';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import bpmnlintConfig from './.bpmnlintrc';

var modeler = new BpmnModeler({
  linting: {
    bpmnlint: bpmnlintConfig
  },
  additionalModules: [
    lintModule
  ]
});
```


## Configure Lint Rules

When instantiating bpmn-js you _must_ use the `linting.bpmnlint` option to provide linter configuration.

The option takes a packed bpmnlint configuration which you may create from your local `.bpmnlintrc`
by using the [bpmnlint-pack-config](https://github.com/nikku/bpmnlint-pack-config) utility:

```shell
bpmnlint-pack-config -c .bpmnlintrc -o bundled-config.js
```

Alternatively you may use an appropriate plugin/loader for your module bundler (cf. [rollup-plugin-bpmnlint](https://github.com/nikku/rollup-plugin-bpmnlint), [bpmnlint-loader](https://github.com/nikku/bpmnlint-loader)) to bundle and consume the  configuration directly as [shown above](#usage).


## Resources

* [Issues](./issues)
* [Playground Project](https://github.com/bpmn-io/bpmnlint-playground)


## Development Setup

```
npm install
npm run dev
```


## License

MIT