import Linter from 'bpmnlint/lib/linter';

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
  elementRegistry, eventBus, overlays
) {

  if ('bpmnlint' in config) {
    this._linterConfig = config.bpmnlint;
  }

  if (!this._linterConfig || !this._linterConfig.config || !this._linterConfig.resolver) {

    console.warn(
      '[bpmn-js-bpmnlint] You did not configure any lint rules to use. ' +
      'Ensure you bundle and include your rules via the `linting.bpmnlint` option. ' +
      'See https://github.com/bpmn-io/bpmn-js-bpmnlint#configure-lint-rules'
    );

    this._linterConfig = emptyConfig;
  }

  this._bpmnjs = bpmnjs;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._overlays = overlays;

  this._issues = [];
  this._lintingActive = false;

  this._overlayIds = {};

  var self = this;

  eventBus.on('elements.changed', LOW_PRIORITY, function(e) {
    if (self.lintingActive()) {
      self.update();
    }
  });

  eventBus.on('diagram.clear', function() {
    self.clearIssues();
  });

  this._init();
};

Linting.prototype._init = function() {
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
  var self = this;

  if (this.lintingActive()) {
    return;
  }

  this.setActive(true);

  this.lint()
    .then(function(issues) {
      self._issues = self.formatIssues(issues);
      self.createIssues(self._issues);

      self.updateButton();
    });
};

Linting.prototype.deactivateLinting = function() {
  this.setActive(false);

  this.clearIssues();

  this.updateButton();
};

Linting.prototype.setActive = function(active) {
  this._lintingActive = active;

  this._eventBus.fire('linting.toggle', { active: active });
};

/**
 * Update overlays. Always lint and check wether overlays need update or not.
 */
Linting.prototype.update = function() {
  var self = this;

  this.lint()
    .then(function(newIssues) {
      newIssues = self.formatIssues(newIssues);

      var remove = {},
          update = {},
          add = {};

      for (var id in self._issues) {

        const idNotFound = newIssues[id] === undefined;
        if (idNotFound) {
          remove[id] = self._issues[id];
        } else {
          let issueDoesNotPersist = true;

          self._issues[id].forEach((oldIssue) => {
            newIssues[id].forEach((newIssue) => {

              const issueFound = oldIssue.message === newIssue.message;
              if (issueFound) {
                issueDoesNotPersist = false;
              }
            });
          });

          if (issueDoesNotPersist) {
            remove[id] = self._issues[id];
          }

        }
      }

      for (var id in newIssues) {
        if (!self._issues[id]) {
          add[id] = newIssues[id];
        } else {
          if (newIssues[id] !== self._issues[id]) {
            update[id] = newIssues[id];
          }
        }
      }

      if(self.lintingActive()) {
        remove = assign(remove, update);
        add = assign(add, update);

        self.removeProcessIssues();

        self.removeIssues(remove);
        self.createIssues(add);

        self.updateButton();
      }

      self._issues = newIssues;
    });
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

    return;
  }

  var isProcess = element.type === 'bpmn:Process';

  var position = { top: OFFSET_TOP, right: OFFSET_RIGHT };

  elementIssues = groupBy(elementIssues, function(elementIssue) {
    return elementIssue.category
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

  this._issues = [];

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
}

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

}

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
