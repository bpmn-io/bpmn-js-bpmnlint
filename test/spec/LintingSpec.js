import {
  insertCSS
} from 'bpmn-js/test/helper';

import Modeler from 'bpmn-js/lib/Modeler';

import LintModule from '../../lib';

import bpmnlintrc from './.bpmnlintrc';

insertCSS('bpmn-js-bpmnlint', require('assets/css/bpmn-js-bpmnlint.css'));

insertCSS('diagram-js', require('bpmn-js/dist/assets/diagram-js.css'));
insertCSS('bpmn-font', require('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'));


describe('linting', function() {

  it('should load specified config', function() {

    // given
    const modeler = new Modeler({
      additionalModules: [
        LintModule
      ],
      linting: {
        bpmnlint: bpmnlintrc
      }
    });

    // when
    const linting = modeler.get('linting');

    // then
    expect(linting).to.exist;

    expect(linting.getLinterConfig()).to.eql(bpmnlintrc);
  });


  it('should start without config', function() {

    // given
    const modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    // when
    const linting = modeler.get('linting');

    // then
    expect(linting).to.exist;

    expect(linting.getLinterConfig()).to.exist;
  });


  it('should not fail on broken config', function() {

    // given
    const modeler = new Modeler({
      additionalModules: [
        LintModule
      ],
      linting: {
        bpmnlint: 'FOO BAR'
      }
    });

    // when
    const linting = modeler.get('linting');

    // then
    expect(linting).to.exist;
  });


  it('should lazy provide config', function() {

    // given
    const modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    const linting = modeler.get('linting');

    // when
    linting.setLinterConfig(bpmnlintrc);

    // then
    expect(linting.getLinterConfig()).to.eql(bpmnlintrc);
  });


  it('should use eagerly provided custom config', function() {

    // given
    const bpmnlintrcOverride = {
      config: {},
      resolver: {}
    };

    const modeler = new Modeler({
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

    const linting = modeler.get('linting');

    // then
    expect(linting.getLinterConfig()).to.equal(bpmnlintrcOverride);
  });


  it('should throw when lazily providing broken config', function() {

    // given
    const modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    const linting = modeler.get('linting');

    // then
    expect(function() {

      // when
      linting.setLinterConfig('FOO');
    }).to.throw('Expected linterConfig = { config, resolver }');
  });


  it('should re-lint on configuration change', function(done) {

    // given
    const modeler = new Modeler({
      additionalModules: [
        LintModule
      ]
    });

    const diagram = require('./diagram.bpmn');

    modeler.importXML(diagram)
      .then(function() {
        const linting = modeler.get('linting'),
              eventBus = modeler.get('eventBus');

        // when
        linting.toggle(true);

        eventBus.once('linting.completed', function(event) {

          // then
          const issues = event.issues;

          expect(Object.keys(issues)).to.have.length(3);

          done();
        });

        linting.setLinterConfig(bpmnlintrc);
      })
      .catch(function(err) { done(err); });

  });


  describe('activation', function() {

    it('should start inactive', function() {

      // given
      const modeler = new Modeler({
        additionalModules: [
          LintModule
        ]
      });

      // when
      const linting = modeler.get('linting');

      // then
      expect(linting.isActive()).to.be.false;
    });


    it('should start active, overriding default', function() {

      // given
      const modeler = new Modeler({
        additionalModules: [
          LintModule
        ],
        linting: {
          active: true
        }
      });

      // when
      const linting = modeler.get('linting');

      // then
      expect(linting.isActive()).to.be.true;
    });

  });


  describe('integration', function() {

    it('should lint with multiple issues', function() {

      const el = document.createElement('div');
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.position = 'fixed';

      document.body.appendChild(el);

      // given
      const modeler = new Modeler({
        container: el,
        additionalModules: [
          LintModule
        ],
        linting: {
          active: true,
          bpmnlint: bpmnlintrc
        }
      });

      const diagram = require('./diagram-with-issues.bpmn');

      modeler.importXML(diagram);
    });

  });

});


describe('i18n', function() {

  it('should translate lint issues text', function(done) {

    const el = document.createElement('div');
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.position = 'fixed';

    document.body.appendChild(el);

    const translations = {
      'Toggle linting': 'Перемкнути перевірку',
      'Process is missing end event': 'У процеса відсутня завершальна подія',
      '{errors} Errors, {warnings} Warnings': '{errors} помилок, {warnings} попередженнь'
    };

    function translateModule(template, replacements = {}) {

      // Translate
      let transTemplate = translations[template] || template;

      // Replace
      return transTemplate.replace(/{([^}]+)}/g, function(_, key) {
        return key in replacements ? replacements[key] : '{' + key + '}';
      });
    }

    // given
    const modeler = new Modeler({
      container: el,
      additionalModules: [
        LintModule,
        {
          translate: [ 'value', translateModule ]
        }
      ],
      linting: {
        bpmnlint: bpmnlintrc
      }
    });

    const diagram = require('./diagram-with-issues.bpmn');

    modeler.importXML(diagram)
      .then(function() {
        const linting = modeler.get('linting'),
              eventBus = modeler.get('eventBus');

        linting.toggle(true);

        eventBus.once('linting.completed', function() {

          const button = el.querySelector('button.bjsl-button.bjsl-button-error');
          expect(button).to.exist;
          expect(button.title).to.equal('Перемкнути перевірку');

          const buttonTextSpan = button.querySelector('span');
          expect(buttonTextSpan).to.exist;
          expect(buttonTextSpan.innerText).to.equal('12 помилок, 1 попередженнь');

          const endEventRequiredMessage = el.querySelector('a[data-rule="end-event-required"]');
          expect(endEventRequiredMessage).to.exist;
          expect(endEventRequiredMessage.dataset.message).to.equal('У процеса відсутня завершальна подія');

          done();
        });
      })
      .catch(function(err) { done(err); });

  });

});
