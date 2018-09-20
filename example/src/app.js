import lintModule from 'bpmn-js-bpmnlint';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import bpmnlintConfig from '../.bpmnlintrc';

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

modeler.on('linting.toggle', function(event) {

  var active = event.active;

  setUrlParam('linting', active);
});


function setUrlParam(name, value) {

  var url = new URL(window.location.href);

  if (value) {
    url.searchParams.set(name, 1);
  } else {
    url.searchParams.delete(name);
  }

  window.history.replaceState({}, null, url.href);
}

function getUrlParam(name) {
  var url = new URL(window.location.href);

  return url.searchParams.has(name);
}


modeler.on('import.done', function() {
  const active = getUrlParam('linting');

  const linting = modeler.get('linting');

  if (active) {
    linting.activateLinting();
  } else {
    linting.deactivateLinting();
  }
});