import lintModule from 'bpmn-js-bpmnlint';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import { config, resolver } from './config-bundle';

import diagramXML from '../resources/example.bpmn';

var modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    lintModule
  ],
  linting: {
    bpmnlint: {
      config,
      resolver
    }
  }
});

modeler.importXML(diagramXML);