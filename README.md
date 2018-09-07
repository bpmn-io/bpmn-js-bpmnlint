# bpmn-js-bpmnlint

[bpmn-js](https://github.com/bpmn-io/bpmn-js) integration for [bpmnlint](https://github.com/siffogh/bpmnlint).

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


## Development Setup

```
npm install && npm run dev
```


## License

MIT