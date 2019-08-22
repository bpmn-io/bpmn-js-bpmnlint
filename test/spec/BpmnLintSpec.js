import {
  insertCSS
} from 'bpmn-js/test/helper';

import Modeler from 'bpmn-js/lib/Modeler';

import LintModule from '../../lib';

import bpmnlintrc from './.bpmnlintrc';

insertCSS('bpmn-js-bpmnlint', require('assets/css/bpmn-js-bpmnlint.css'));


describe('bpmn-js-bpmnlint', function() {

  it('should load specified config', function() {

    // given
    var modeler = new Modeler({
      additionalModules: [
        LintModule
      ],
      linting: {
        bpmnlint: bpmnlintrc
      }
    });

    // when
    var linting = modeler.get('linting');

    // then
    expect(linting).to.exist;
  });


  it('should start without config', function() {

    // given
    var modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    // when
    var linting = modeler.get('linting');

    // then
    expect(linting).to.exist;
  });


  it('should not fail on broken config', function() {

    // given
    var modeler = new Modeler({
      additionalModules: [
        LintModule
      ],
      linting: {
        bpmnlint: 'FOO BAR'
      }
    });

    // when
    var linting = modeler.get('linting');

    // then
    expect(linting).to.exist;
  });


  it('should lazy provide config', function() {

    // given
    var modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    var linting = modeler.get('linting');

    // when
    linting.setLinterConfig(bpmnlintrc);

    // then
    expect(linting.getLinterConfig()).to.eql(bpmnlintrc);
  });


  it('should use eagerly provided custom config', function() {

    // given
    var bpmnlintrcOverride = {
      config: {},
      resolver: {}
    };

    var modeler = new Modeler({
      additionalModules: [
        {
          __init__: [
            function(linting) {
              linting.setLinterConfig(bpmnlintrcOverride);
            }
          ]
        },
        LintModule
      ],
      linting: {
        bpmnlint: bpmnlintrc
      }
    });

    var linting = modeler.get('linting');

    // then
    expect(linting.getLinterConfig()).to.equal(bpmnlintrcOverride);
  });


  it('should throw when lazily providing broken config', function() {

    // given
    var modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    var linting = modeler.get('linting');

    // then
    expect(function() {
      // when
      linting.setLinterConfig('FOO');
    }).to.throw('Expected linterConfig = { config, resolver }');
  });


  it('should re-lint on configuration change', function(done) {

    // given
    var modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    var diagram = require('./diagram.bpmn');

    modeler.importXML(diagram, function(err) {

      if (err) {
        return done(err);
      }

      var linting = modeler.get('linting');

      var eventBus = modeler.get('eventBus');

      // when
      linting.activateLinting();

      eventBus.once('linting.completed', function(event) {

        // then
        var issues = event.issues;

        expect(Object.keys(issues)).to.have.length(3);

        done();
      });

      linting.setLinterConfig(bpmnlintrc);
    });

  });

});
