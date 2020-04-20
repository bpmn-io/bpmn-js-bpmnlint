describe('distro', function() {

  it('should expose CJS bundle', function() {
    const BpmnJSBpmnlint = require('../..');

    expect(BpmnJSBpmnlint).to.exist;
  });


  it('should expose UMD bundle', function() {
    const BpmnJSBpmnlint = require('../../dist/bpmn-js-bpmnlint.umd.js');

    expect(BpmnJSBpmnlint).to.exist;
  });

});
