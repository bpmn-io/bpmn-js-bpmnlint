# bpmn-js-bpmnlint

Integrates [bpmnlint](https://github.com/bpmn-io/bpmnlint) into [bpmn-js](https://github.com/bpmn-io/bpmn-js).

![Screenshot](docs/screenshot.png)


## Usage

Integrate the linter into [bpmn-js](https://github.com/bpmn-io/bpmn-js):

```javascript
import lintModule from 'bpmn-js-bpmnlint';

import BpmnModeler from 'bpmn-js/lib/Modeler';

var modeler = new BpmnModeler({
  additionalModules: [
    lintModule
  ]
});
```


## Rules

Checkout [`./features/rules.json`](./features/rules.json) for the lint configuration used.


## Development Setup

```
npm install && npm run dev
```


## License

MIT