import {
  bootstrapModeler,
  injectCSS,
  inject
} from 'bpmn-js/test/helper';

import LintModule from '../../lib';

import bpmnlintrc from './.bpmnlintrc';


describe('bpmn-js-bpmnlint', function() {

  const bpmnDiagram = require('./diagram.bpmn');

  beforeEach(bootstrapModeler(bpmnDiagram, {
    additionalModules: [
      LintModule
    ],
    linting: {
      bpmnlint: bpmnlintrc
    }
  }));


  it('should work', inject(function(linting) {
    expect(linting).to.exist;
  }));

});
