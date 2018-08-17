import bpmnlint from '../lib';

import BpmnJS from 'bpmn-js/lib/Modeler';

import exampleXML from './resources/starter.bpmn';

var viewer = new BpmnJS({
  container: '#canvas',
  additionalModules: [
    bpmnlint
  ],
  keyboard: {
    bindTo: document
  }
});

viewer.importXML(exampleXML, function(err) {
  if (!err) {
    viewer.get('canvas').zoom('fit-viewport');
  } else {
    console.log('something went wrong:', err);
  }
});

window.viewer = viewer;