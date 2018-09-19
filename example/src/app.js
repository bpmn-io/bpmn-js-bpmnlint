import lintModule from 'bpmn-js-bpmnlint';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import bpmnlintConfig from './.bpmnlintrc';

import diagramXML from '../resources/example.bpmn';

var modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    lintModule
  ],
  linting: {
    bpmnlint: bpmnlintConfig
  }
});

modeler.importXML(diagramXML);