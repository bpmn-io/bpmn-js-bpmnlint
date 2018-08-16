import linter from 'bpmnlint/lib/linter';

import {
  assign,
  groupBy,
  keys,
  forEach
} from 'min-dash';

import isEqual from 'lodash/isEqual';

import {
  domify,
  query as domQuery
} from 'min-dom';

import LintSvg from '../../assets/svg/lint.svg';
import ErrorSvg from '../../assets/svg/error.svg';
import WarningSvg from '../../assets/svg/warning.svg';

var OFFSET_TOP = -5,
    OFFSET_RIGHT = -5;

var LOW_PRIORITY = 500;

var LINTER_CONFIG = {
  "label-required": 2,
  "start-event-required": 2,
  "end-event-required": 2,
  "no-implicit-parallel-gateway": 2
};

var issuesMock = {
  errors: [
    {
      id: 'Task_1upmjgh',
      message: 'Missing Label'
    },
    {
      id: 'Task_128fg2b',
      message: 'Missing Label'
    }
  ],
  warnings: [
    {
      id: 'Task_128fg2b',
      message: 'Use Gateways Instead of Conditional Flows'
    }
  ]
};

var otherIssuesMock = {
  errors: [
    {
      id: 'Task_128fg2b',
      message: 'Missing Label'
    },
    {
      id: 'Task_128fg2b',
      message: 'Missing Label'
    }
  ],
  warnings: [
    {
      id: 'Task_128fg2b',
      message: 'Use Gateways Instead of Conditional Flows'
    },
    {
      id: 'IntermediateThrowEvent_02yoqsl',
      message: 'Use XOR Gateway Markers'
    }
  ]
};


export default function Linting(bpmnjs, canvas, elementRegistry, eventBus, overlays) {

  this._bpmnjs = bpmnjs;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._overlays = overlays;

  this._issues = null;
  this._lintingActive = false;

  this._overlayIds = {};

  var self = this;
  
  eventBus.on('elements.changed', LOW_PRIORITY, function(e) {
    if (self.lintingActive()) {
      self.update();
    }
  });

  this._init();
};

Linting.prototype._init = function() {
  var self = this;

  var button = this._button = domify(
    '<button class="bpmn-js-bpmnlint-button">' +
      LintSvg +
      '<span>Linting Inactive</span></button>'
  );

  button.addEventListener('click', function() {
    self.toggleLinting();
  });

  this._canvas.getContainer().appendChild(button);
};

Linting.prototype.lintingActive = function() {
  return this._lintingActive;
};

Linting.prototype.formatIssues = function(issues) {
  var warnings = issues.warnings,
      errors = issues.errors;

  warnings = warnings.map(function(warning) {
    return assign(warning, {
      type: 'warning'
    });
  });
  
  errors = errors.map(function(error) {
    return assign(error, {
      type: 'error'
    });  
  });

  var issues = warnings.concat(errors);

  return groupBy(issues, function(issue) {
    return issue.id;
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

  this.lint()
    .then(function(issues) {
      self._issues = self.formatIssues(issues);

      self.createIssues(self._issues);

      self._lintingActive = true;

      self.setButtonState('activated');
    });
};

Linting.prototype.deactivateLinting = function() {
  this.clearIssues();

  this._lintingActive = false;

  this.setButtonState('deactivated');
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
        if (!newIssues[id]) {
          remove[id] = self._issues[id];
        }
      }
    
      for (var id in newIssues) {
        if (!self._issues[id]) {
          add[id] = newIssues[id];
        } else {
          if (!isEqual(newIssues[id], self._issues[id])) {
            update[id] = newIssues[id];
          }
        }
      }
    
      remove = assign(remove, update);
      add = assign(add, update);
    
      self.removeIssues(remove);
      self.createIssues(add);
    
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
    console.log('element <' + elementId + '> not found');

    return;
  }

  var position = { top: OFFSET_TOP, right: OFFSET_RIGHT };

  elementIssues = groupBy(elementIssues, function(elementIssue) {
    return elementIssue.type
  });

  var errors = elementIssues.error,
      warnings = elementIssues.warning;

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

  this._overlayIds[elementId] = this._overlays.add(element, 'bpmnlint', {
    position: position,
    html: html,
    scale: {
      min: 1,
      max: 1
    }
  });
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
    overlayId = this._overlayIds[id];

    this._overlays.remove(overlayId);
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

  this._issues = null;
};

/**
 * Sets button state to reflect if linting is active.
 * 
 * @param {String} state 
 */
Linting.prototype.setButtonState = function(state) {
  var span = domQuery('span', this._button);
  
  if (state === 'activated') {
    this._button.classList.add('activated');

    span.textContent = 'Linting Active';
  } else if (state === 'deactivated') {
    this._button.classList.remove('activated');

    span.textContent = 'Linting Inactive';
  }
}

Linting.prototype.lint = function() {
  return linter({
    moddleRoot: this._bpmnjs.getDefinitions(),
    config: LINTER_CONFIG
  });
};

Linting.$inject = [ 'bpmnjs', 'canvas', 'elementRegistry', 'eventBus', 'overlays' ];