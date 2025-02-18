import semver from 'semver';

import {
  insertCSS
} from 'bpmn-js/test/helper';

import Modeler from 'bpmn-js/lib/Modeler';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import StaticResolver from 'bpmnlint/lib/resolver/static-resolver';

import LintModule from '../../lib';

import bpmnlintrc from './.bpmnlintrc';

insertCSS('bpmn-js-bpmnlint', require('assets/css/bpmn-js-bpmnlint.css'));

insertCSS('diagram-js', require('bpmn-js/dist/assets/diagram-js.css'));
insertCSS('bpmn-font', require('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'));

if (bpmnJsSatisfies('>=9')) {
  insertCSS('bpmn-js', require('bpmn-js/dist/assets/bpmn-js.css'));
}

var singleStart = window.__env__ && window.__env__.SINGLE_START === 'true';


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

});


describe('linting - ui', function() {

  let modeler, el;

  beforeEach(function() {
    el = document.createElement('div');
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.position = 'fixed';

    document.body.appendChild(el);

    // given
    modeler = new Modeler({
      container: el,
      additionalModules: [
        LintModule
      ],
      linting: {
        active: true,
        bpmnlint: {
          config: {
            extends: 'bpmnlint:recommended',
            rules: {
              'foo/rule-error': 'error',
              'no-implicit-start': 'info'
            }
          },
          resolver: new StaticResolver({
            'config:bpmnlint/recommended': require('bpmnlint/config/recommended'),
            ...Object.keys(require('bpmnlint/config/recommended').rules).reduce((rules, rule) => {
              return {
                ...rules,
                [`rule:bpmnlint/${ rule }`]: require(`bpmnlint/rules/${ rule }`)
              };
            }, {}),
            'rule:bpmnlint-plugin-foo/rule-error': function() {
              return {
                check(node) {
                  if (is(node, 'bpmn:Process')) {
                    throw new Error('Rule error!');
                  }
                }
              };
            }
          })
        }
      }
    });
  });


  describe('status button', function() {

    describe('style', function() {

      it('should indicate success', async function() {

        // given
        const diagram = require('./no-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const button = el.querySelector('button.bjsl-button.bjsl-button-success');
        expect(button).to.exist;

      });


      it('should indicate error', async function() {

        // given
        const diagram = require('./single-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const button = el.querySelector('button.bjsl-button.bjsl-button-error');
        expect(button).to.exist;
      });


      it('should indicate warning', async function() {

        // given
        const diagram = require('./single-warning.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const button = el.querySelector('button.bjsl-button.bjsl-button-warning');
        expect(button).to.exist;
      });


      it('should indicate error + warning', async function() {

        // given
        const diagram = require('./warning-and-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const button = el.querySelector('button.bjsl-button.bjsl-button-error');
        expect(button).to.exist;
      });

    });


    describe('count', function() {

      (singleStart ? it.only : it)('should indicate counts', async function() {

        // given
        const diagram = require('./errors-and-warnings.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const buttonText = el.querySelector('button.bjsl-button.bjsl-button-error').textContent;
        expect(buttonText.trim()).to.equal('8 Errors, 2 Warnings');
      });

    });

  });


  describe('overlays', function() {

    describe('should show', function() {

      it('error', async function() {

        // given
        const diagram = require('./single-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const overlay = el.querySelectorAll('.bjsl-overlay .bjsl-icon-error');
        expect(overlay).to.exist;
        expect(overlay).to.have.length(1);
      });


      it('warning', async function() {

        // given
        const diagram = require('./single-warning.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const overlay = el.querySelectorAll('.bjsl-overlay .bjsl-icon-warning');
        expect(overlay).to.exist;
        expect(overlay).to.have.length(1);
      });


      it('warning (root level)', async function() {

        // given
        const customConfig = {
          ...bpmnlintrc,
          'config': {
            'rules': {
              'start-event-required': 'warn'
            }
          }
        };
        const diagram = require('./missing-start-event.bpmn');

        // when
        modeler.get('linting').setLinterConfig(customConfig);

        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const processOverlays = el.querySelector('.djs-overlays[data-container-id="Process"]');
        const warningIcon = processOverlays.querySelector('.bjsl-icon-warning');
        expect(warningIcon).to.exist;
      });


      it('error over warning', async function() {

        // given
        const diagram = require('./warning-and-error-combined.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const overlay = el.querySelectorAll('.bjsl-overlay .bjsl-icon-error');
        expect(overlay).to.exist;
        expect(overlay).to.have.length(1);
      });


      it('error + warning messages', async function() {

        // given
        const diagram = require('./warning-and-error-combined.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const issueList = el.querySelector('.bjsl-dropdown .bjsl-dropdown-content .bjsl-issues ul');
        expect(issueList).to.exist;

        const errorEntry = issueList.querySelector('li.error');
        expect(errorEntry).to.exist;

        const errorIcon = errorEntry.querySelector('span.icon');
        expect(errorIcon).to.exist;

        const warningEntry = issueList.querySelector('li.warning');
        expect(warningEntry).to.exist;

        const warningIcon = warningEntry.querySelector('span.icon');
        expect(warningIcon).to.exist;
      });


      it('meta-data on elements', async function() {

        // given
        const diagram = require('./single-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const errorEntry = el.querySelector(
          '[data-rule="label-required"]'
        );
        expect(errorEntry).to.exist;

        const messageEntry = errorEntry.querySelector('.message');
        expect(messageEntry).to.exist;
        expect(messageEntry.textContent).to.eql('Element is missing label/name');

        const ruleEntry = errorEntry.querySelector('.rule');
        expect(ruleEntry).to.exist;
        expect(ruleEntry.textContent).to.eql('(label-required)');

        const documentationLink = ruleEntry.querySelector('a');
        expect(documentationLink).to.exist;
        expect(documentationLink.href).to.eql('https://github.com/bpmn-io/bpmnlint/blob/main/docs/rules/label-required.md');
        expect(documentationLink.textContent).to.eql('label-required');
      });

    });


    describe('positioning', function() {

      it('should position overlay on the task element - task issue', async function() {

        // given
        const diagram = require('./single-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const container = el.querySelector('.djs-overlays[data-container-id="Task_1"]');
        expect(container).to.exist;
        expect(container.style.left).to.equal('240px');
        expect(container.style.top).to.equal('110px');
        expect(container.style.position).to.equal('absolute');
      });


      it('should position overlay on the process - process level issue', async function() {

        // given
        const diagram = require('./root-level-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const container = el.querySelector('.djs-overlays[data-container-id="Process_1"]');
        expect(container).to.exist;

        const lintingOverlay = container.querySelector('.djs-overlay-linting');
        expect(lintingOverlay.style.left).to.equal('150px');
        expect(lintingOverlay.style.top).to.equal('20px');
        expect(lintingOverlay.style.position).to.equal('absolute');
      });


      it('should position overlay on the participant element - process level issue in collaboration', async function() {

        // given
        const diagram = require('./process-collaboration-errors.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const container = el.querySelector('.djs-overlays[data-container-id="Participant_1"]');
        expect(container).to.exist;

        const errorOverlay = container.querySelector('.bjsl-overlay.bjsl-issues-top-right');
        expect(errorOverlay).to.exist;

        const issues = errorOverlay.querySelector('.bjsl-issues');
        expect(issues).to.exist;

        const currentElementIssues = errorOverlay.querySelectorAll('.bjsl-current-element-issues li');
        expect(currentElementIssues).to.have.length(0);

        const childElementIssues = errorOverlay.querySelectorAll('.bjsl-child-issues li');
        expect(childElementIssues).to.have.length(2);

        const childElementIssueIdHints = errorOverlay.querySelectorAll('.bjsl-id-hint');
        expect(childElementIssueIdHints).to.have.length(2);
      });


      it('should position overlay on the process level - task without BPMNDI', async function() {

        // given
        const diagram = require('./no-bpmndi.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const container = el.querySelector('.djs-overlays[data-container-id="Process_1"]');
        expect(container).to.exist;

        const errorOverlay = container.querySelector('.bjsl-overlay.bjsl-issues-bottom-right');
        expect(errorOverlay).to.exist;

        const issues = errorOverlay.querySelector('.bjsl-issues');
        expect(issues).to.exist;

        const currentElementIssues = errorOverlay.querySelectorAll('.bjsl-current-element-issues li');
        expect(currentElementIssues).to.have.length(0);

        const childElementIssues = errorOverlay.querySelectorAll('.bjsl-child-issues li');
        expect(childElementIssues).to.have.length(3);

        const childElementIssueIdHints = errorOverlay.querySelectorAll('.bjsl-id-hint');
        expect(childElementIssueIdHints).to.have.length(3);
      });


      it('should position overlay on the process level - task without BPMNDI & existing process issues', async function() {

        // given
        const diagram = require('./no-bpmndi-and-root-error.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const container = el.querySelector('.djs-overlays[data-container-id="Process_1"]');
        expect(container).to.exist;

        const errorOverlay = container.querySelector('.bjsl-overlay.bjsl-issues-bottom-right');
        expect(errorOverlay).to.exist;

        const issues = errorOverlay.querySelector('.bjsl-issues');
        expect(issues).to.exist;

        const currentElementIssues = errorOverlay.querySelectorAll('.bjsl-current-element-issues li');
        expect(currentElementIssues).to.have.length(1);

        const childElementIssues = errorOverlay.querySelectorAll('.bjsl-child-issues li');
        expect(childElementIssues).to.have.length(3);

        const childElementIssueIdHints = errorOverlay.querySelectorAll('.bjsl-id-hint');
        expect(childElementIssueIdHints).to.have.length(3);
      });


      withBpmnJs('>=9')('should add overlays to subprocess view', async function() {

        // given
        const diagram = require('./multiple-plane-two-errors.bpmn');

        // when
        await modeler.importXML(diagram);

        await toggleLinting(modeler);

        // then
        const collapsedOverlay = el.querySelector('.djs-overlays[data-container-id="Subprocess"]');
        expect(collapsedOverlay).to.exist;

        const collapsedError = collapsedOverlay.querySelector('.bjsl-overlay.bjsl-issues-top-right');
        expect(collapsedError).to.exist;

        const planeOverlay = el.querySelector('.djs-overlays[data-container-id="Subprocess_plane"]');
        expect(planeOverlay).to.exist;

        const planeError = planeOverlay.querySelector('.bjsl-overlay.bjsl-issues-bottom-right');
        expect(planeError).to.exist;

        const internalOverlay = el.querySelector('.djs-overlays[data-container-id="Task_B"]');
        expect(internalOverlay).to.exist;

        const internalError = internalOverlay.querySelector('.bjsl-overlay.bjsl-issues-top-right');
        expect(internalError).to.exist;

      });

    });

  });

});


describe('linting - i18n', function() {

  it('should translate lint issues text', async function() {

    const el = document.createElement('div');
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.position = 'fixed';

    document.body.appendChild(el);

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

    await modeler.importXML(diagram);

    await toggleLinting(modeler);

    const button = el.querySelector('button.bjsl-button.bjsl-button-error');
    expect(button).to.exist;
    expect(button.title).to.equal('Перемкнути перевірку');

    const buttonText = button.textContent;
    expect(buttonText.trim()).to.equal('16 помилок, 0 попередженнь');

    const endEventRequiredMessage = el.querySelector('[data-rule="end-event-required"] .message');
    expect(endEventRequiredMessage).to.exist;
    expect(endEventRequiredMessage.textContent).to.equal('У процеса відсутня завершальна подія');
  });

  it('should translate child issues grouping text', async function() {

    const el = document.createElement('div');
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.position = 'fixed';
    document.body.appendChild(el);

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

    const diagram = require('./diagram-with-child-issues.bpmn');

    await modeler.importXML(diagram);

    await toggleLinting(modeler);

    const issueHeading = el.querySelector('.bjsl-issue-heading');
    expect(issueHeading).to.exist;
    expect(issueHeading.innerText).to.equal('Проблеми дочірніх елементів:');
  });

});

// helper //////////////////

const translations = {
  'Toggle linting overlays': 'Перемкнути перевірку',
  'Process is missing end event': 'У процеса відсутня завершальна подія',
  '{errors} Errors, {warnings} Warnings': '{errors} помилок, {warnings} попередженнь',
  'Issues for child elements': 'Проблеми дочірніх елементів'
};

function translateModule(template, replacements = {}) {

  // Translate
  let transTemplate = translations[template] || template;

  // Replace
  return transTemplate.replace(/{([^}]+)}/g, function(_, key) {
    return key in replacements ? replacements[key] : '{' + key + '}';
  });
}

function toggleLinting(modeler) {

  return new Promise(resolve => {
    const linting = modeler.get('linting'),
          eventBus = modeler.get('eventBus');

    linting.toggle(true);

    eventBus.once('linting.completed', resolve);
  });
}

/**
 * Execute test only if currently installed bpmn-js is of given version.
 *
 * @param {string} versionRange
 * @param {boolean} only
 */
function withBpmnJs(versionRange, only = false) {
  if (bpmnJsSatisfies(versionRange)) {
    return only ? it.only : it;
  } else {
    return it.skip;
  }
}

function bpmnJsSatisfies(versionRange) {
  const bpmnJsVersion = require('bpmn-js/package.json').version;

  return semver.satisfies(bpmnJsVersion, versionRange, { includePrerelease: true });
}
