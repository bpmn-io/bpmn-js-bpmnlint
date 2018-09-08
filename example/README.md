# bpmn-js-bpmnlint Example

This example shows how to add rule validation powered by [bpmn-js-bpmnlint](https://github.com/bpmn-io/bpmn-js-bpmnlint) to [bpmn-js](https://github.com/bpmn-io/bpmn-js).


## Run the Example

```
npm install
npm run dev
```


## Lint Rules

Checkout [`./src/config.json`](./src/config.json) for the lint rules used in the example.

The rules are packed to a browser consumable bundle using [bpmnlint-pack-config](https://github.com/nikku/bpmnlint-pack-config) and [consumed in the app](./src/app.js).


## License

MIT
