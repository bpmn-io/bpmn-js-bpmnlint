const { expect } = require('chai');


describe('distro', function() {

  it('should expose CJS bundle', function() {
    const BpmnJSBpmnlint = require('bpmn-js-bpmnlint');

    expect(BpmnJSBpmnlint).to.exist;
    expect(BpmnJSBpmnlint.__init__).to.exist;
  });

});
