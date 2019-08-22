import { Linter } from 'bpmnlint';

import {
  assign,
  groupBy,
  reduce
} from 'min-dash';

import {
  domify,
  query as domQuery,
  remove as domRemove
} from 'min-dom';

import ErrorSvg from '../assets/svg/error.svg';
import WarningSvg from '../assets/svg/warning.svg';
import SuccessSvg from '../assets/svg/success.svg';

var OFFSET_TOP = -5,
    OFFSET_RIGHT = -5;

var LOW_PRIORITY = 500;

var emptyConfig = {
  resolver: {
    resolveRule: function() {
      return null;
    }
  },
  config: {}
};


export default function Linting(
    config, bpmnjs, canvas,
    elementRegistry, eventBus,
    overlays
) {

  this._bpmnjs = bpmnjs;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._overlays = overlays;

  this._issues = {};
  this._lintingActive = false;
  this._linterConfig = emptyConfig;

  this._overlayIds = {};

  var self = this;

  eventBus.on([
    'elements.changed',
    'linting.configChanged',
    'linting.toggle'
  ], LOW_PRIORITY, function(e) {
    if (self.lintingActive()) {
      self.update();
    }
  });

  eventBus.on('diagram.clear', function() {
    self.clearIssues();
  });

  var linterConfig = config && config.bpmnlint;

  linterConfig && eventBus.once('diagram.init', function() {
    // bail out if config was already provided
    // during initialization of other modules
    if (self.getLinterConfig()) {
      return;
    }

    try {
      self.setLinterConfig(linterConfig);
    } catch (err) {
      console.error(
        '[bpmn-js-bpmnlint] Invalid lint rules configured. ' +
        'Please doublecheck your linting.bpmnlint configuration, ' +
        'cf. https://github.com/bpmn-io/bpmn-js-bpmnlint#configure-lint-rules'
      );
    }
  });

  this._init();
}

Linting.prototype.setLinterConfig = function(linterConfig) {

  if (!linterConfig.config || !linterConfig.resolver) {
    throw new Error('Expected linterConfig = { config, resolver }');
  }

  this._linterConfig = linterConfig;

  this._eventBus.fire('linting.configChanged');
};

Linting.prototype.getLinterConfig = function() {
  return this._linterConfig;
};

Linting.prototype._init = function(config) {
  var self = this;

  var button = this._button = domify(
    '<button class="bpmn-js-bpmnlint-button inactive"></button>'
  );

  this.updateButton();

  button.addEventListener('click', function() {
    self.toggleLinting();
  });

  this._canvas.getContainer().appendChild(button);
};

Linting.prototype.lintingActive = function() {
  return this._lintingActive;
};

Linting.prototype.formatIssues = function(issues) {

  const reports = reduce(issues, function(reports, ruleReports, rule) {

    return reports.concat(ruleReports.map(function(report) {
      report.rule = rule;

      return report;
    }));

  }, []);

  return groupBy(reports, function(report) {
    return report.id;
  });
};

Linting.prototype.toggleLinting = function() {
  if (this.lintingActive()) {
    this.deactivateLinting();
  } else {
    this.activateLinting();
  }
};

Linting.prototype.activateLinting = function() {
  this.setActive(true);
};

Linting.prototype.deactivateLinting = function() {
  this.setActive(false);

  this.clearIssues();

  this.updateButton();
};

Linting.prototype.setActive = function(active) {

  if (this._lintingActive === active) {
    return;
  }

  this._lintingActive = active;

  this._eventBus.fire('linting.toggle', { active: active });
};

/**
 * Update overlays. Always lint and check wether overlays need update or not.
 */
Linting.prototype.update = function() {
  var self = this;

  var lintStart = this._lintStart = Math.random();

  this.lint().then(function(newIssues) {

    if (self._lintStart !== lintStart) {
      return;
    }

    newIssues = self.formatIssues(newIssues);

    var remove = {},
        update = {},
        add = {};

    for (var id1 in self._issues) {
      if (!newIssues[id1]) {
        remove[id1] = self._issues[id1];
      }
    }

    for (var id2 in newIssues) {
      if (!self._issues[id2]) {
        add[id2] = newIssues[id2];
      } else {
        if (newIssues[id2] !== self._issues[id2]) {
          update[id2] = newIssues[id2];
        }
      }
    }

    remove = assign(remove, update);
    add = assign(add, update);

    self.removeProcessIssues();

    self.removeIssues(remove);
    self.createIssues(add);

    self._issues = newIssues;

    self.updateButton();

    self._fireComplete(newIssues);
  });
};

Linting.prototype._fireComplete = function(issues) {
  this._eventBus.fire('linting.completed', { issues: issues });
};

Linting.prototype.createIssues = function(issues) {
  for (var id in issues) {
    this.createElementIssues(id, issues[id]);
  }
};

/**
 * Create overlays for an elements issues.
 *
 * @param {String} elementId - Elements ID.
 * @param {Array} elementIssues - All element issues including warnings and errors.
 */
Linting.prototype.createElementIssues = function(elementId, elementIssues) {

  var element = this._elementRegistry.get(elementId);

  if (!element) {
    // gracefully handle element not found
    return;
  }

  var isProcess = element.type === 'bpmn:Process';

  var position = { top: OFFSET_TOP, right: OFFSET_RIGHT };

  elementIssues = groupBy(elementIssues, function(elementIssue) {
    return elementIssue.category;
  });

  var errors = elementIssues.error,
      warnings = elementIssues.warn;

  var html = domify('<div class="bpmn-js-bpmnlint-issues"><div class="icons"></div></div>');

  var icons = domQuery('.icons', html);

  var group;

  if (errors) {
    icons.appendChild(domify('<span class="icon error">' + ErrorSvg + '</span>'));

    group = this.createGroup(errors, 'error', 'Errors', ErrorSvg);

    html.appendChild(group);
  }

  if (warnings) {
    icons.appendChild(domify('<span class="icon warning">' + WarningSvg + '</span>'));

    group = this.createGroup(warnings, 'warning', 'Warnings', WarningSvg);

    html.appendChild(group);
  }

  if (isProcess) {
    this.createProcessIssues(html);
  } else {
    this._overlayIds[elementId] = this._overlays.add(element, 'bpmnlint', {
      position: position,
      html: html,
      scale: {
        min: 1,
        max: 1
      }
    });
  }

};

Linting.prototype.createGroup = function(issues, type, label, icon) {

  var group = domify(
    '<div class="group">' +
      '<div class="header ' + type + '">' + icon + label + '</div>' +
    '</div>'
  );

  issues.forEach(function(issue) {
    var collapsable = domify(
      '<div class="collapsable ' + type + '">' +
      issue.message +
      '</div>'
    );

    group.appendChild(collapsable);
  });

  return group;
};

Linting.prototype.removeIssues = function(issues) {
  var overlayId;

  for (var id in issues) {
    if (id === 'Process') {
      this.removeProcessIssues();
    } else {
      overlayId = this._overlayIds[id];

      // ignore process
      if (overlayId) {
        this._overlays.remove(overlayId);
      }
    }
  }
};

/**
 * Removes all overlays and clears cached issues.
 */
Linting.prototype.clearIssues = function() {
  var overlayId;

  for (var id in this._overlayIds) {
    overlayId = this._overlayIds[id];

    this._overlays.remove(overlayId);
  }

  this._issues = {};

  this.removeProcessIssues();
};

/**
 * Sets button state to reflect if linting is active.
 *
 * @param {String} state
 */
Linting.prototype.setButtonState = function(state, html) {
  if (state === 'success') {
    this._button.classList.add('success');
    this._button.classList.remove('error');
    this._button.classList.remove('inactive');
    this._button.classList.remove('warning');
  } else if (state === 'error') {
    this._button.classList.add('error');
    this._button.classList.remove('inactive');
    this._button.classList.remove('success');
    this._button.classList.remove('warning');
  } else if (state === 'warning') {
    this._button.classList.add('warning');
    this._button.classList.remove('error');
    this._button.classList.remove('inactive');
    this._button.classList.remove('success');
  } else if (state === 'inactive') {
    this._button.classList.add('inactive');
    this._button.classList.remove('error');
    this._button.classList.remove('success');
    this._button.classList.remove('warning');
  }

  this._button.innerHTML = html;
};

Linting.prototype.updateButton = function() {
  if (this._lintingActive) {
    var errors = 0,
        warnings = 0;

    for (var id in this._issues) {
      this._issues[id].forEach(function(issue) {
        if (issue.category === 'error') {
          errors++;
        } else if (issue.category === 'warn') {
          warnings++;
        }
      });
    }

    if (errors) {
      this.setButtonState('error', ErrorSvg + '<span>' + errors + ' Errors, ' + warnings + ' Warnings</span>');
    } else if (warnings) {
      this.setButtonState('warning', WarningSvg + '<span>' + errors + ' Errors, ' + warnings + ' Warnings</span>');
    } else {
      this.setButtonState('success', SuccessSvg + '<span>0 Errors, 0 Warnings</span>');
    }

  } else {
    this.setButtonState('inactive', SuccessSvg + '<span>0 Errors, 0 Warnings</span>');
  }

};

Linting.prototype.createProcessIssues = function(html) {
  var container = this._canvas.getContainer();

  html.classList.add('bpmn-js-bpmnlint-process-issues');

  container.appendChild(html);
};

Linting.prototype.removeProcessIssues = function() {
  var container = this._canvas.getContainer();

  var html = domQuery('.bpmn-js-bpmnlint-process-issues', container);

  if (html) {
    domRemove(html);
  }
};

Linting.prototype.lint = function() {

  var definitions = this._bpmnjs.getDefinitions();

  var linter = new Linter(this._linterConfig);

  return linter.lint(definitions);
};

Linting.$inject = [
  'config.linting',
  'bpmnjs',
  'canvas',
  'elementRegistry',
  'eventBus',
  'overlays'
];