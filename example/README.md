# bpmn-js-bpmnlint Example

This example shows how to add rule validation powered by [bpmn-js-bpmnlint](https://github.com/bpmn-io/bpmn-js-bpmnlint) to [bpmn-js](https://github.com/bpmn-io/bpmn-js).


## Run the Example

```
npm install
npm run dev
```


## Lint Rules

Checkout the [`.bpmnlintrc` file](./.bpmnlintrc) for the lint rules used in the example.

The rules are consumed by webpack via the [bpmnlint-loader](https://github.com/nikku/bpmnlint-loader) and [consumed in the app](./src/app.js).


## License

MIT
