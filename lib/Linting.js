import { Linter } from 'bpmnlint';

import {
  assign,
  groupBy,
  reduce
} from 'min-dash';

import {
  domify
} from 'min-dom';

import {
  escapeHTML
} from 'diagram-js/lib/util/EscapeUtil';

import ErrorSvg from '../assets/svg/error.svg';
import WarningSvg from '../assets/svg/warning.svg';
import SuccessSvg from '../assets/svg/success.svg';

var OFFSET_TOP = -7,
    OFFSET_RIGHT = -7;

var LOW_PRIORITY = 500;

var emptyConfig = {
  resolver: {
    resolveRule: function() {
      return null;
    }
  },
  config: {}
};

var stateToIcon = {
  error: ErrorSvg,
  warning: WarningSvg,
  success: SuccessSvg,
  inactive: SuccessSvg
};

export default function Linting(
    bpmnjs,
    canvas,
    config,
    elementRegistry,
    eventBus,
    overlays,
    translate
) {
  this._bpmnjs = bpmnjs;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._overlays = overlays;
  this._translate = translate;

  this._issues = {};

  this._active = config && config.active || false;
  this._linterConfig = emptyConfig;

  this._overlayIds = {};

  var self = this;

  eventBus.on([
    'import.done',
    'elements.changed',
    'linting.configChanged',
    'linting.toggle'
  ], LOW_PRIORITY, function(e) {
    if (self.isActive()) {
      self.update();
    }
  });

  eventBus.on('linting.toggle', function(event) {

    const active = event.active;

    if (!active) {
      self._clearIssues();
      self._updateButton();
    }
  });

  eventBus.on('diagram.clear', function() {
    self._clearIssues();
  });

  var linterConfig = config && config.bpmnlint;

  linterConfig && eventBus.once('diagram.init', function() {

    // bail out if config was already provided
    // during initialization of other modules
    if (self.getLinterConfig() !== emptyConfig) {
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

Linting.prototype._init = function() {
  this._createButton();

  this._updateButton();
};

Linting.prototype.isActive = function() {
  return this._active;
};

Linting.prototype._formatIssues = function(issues) {

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

/**
 * Toggle linting on or off.
 *
 * @param {boolean} [newActive]
 *
 * @return {boolean} the new active state
 */
Linting.prototype.toggle = function(newActive) {

  newActive = typeof newActive === 'undefined' ? !this.isActive() : newActive;

  this._setActive(newActive);

  return newActive;
};

Linting.prototype._setActive = function(active) {

  if (this._active === active) {
    return;
  }

  this._active = active;

  this._eventBus.fire('linting.toggle', { active: active });
};

/**
 * Update overlays. Always lint and check wether overlays need update or not.
 */
Linting.prototype.update = function() {
  var self = this;

  var definitions = this._bpmnjs.getDefinitions();

  if (!definitions) {
    return;
  }

  var lintStart = this._lintStart = Math.random();

  this.lint().then(function(newIssues) {

    if (self._lintStart !== lintStart) {
      return;
    }

    newIssues = self._formatIssues(newIssues);

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

    self._clearOverlays();
    self._createIssues(add);

    self._issues = newIssues;

    self._updateButton();

    self._fireComplete(newIssues);
  });
};

Linting.prototype._fireComplete = function(issues) {
  this._eventBus.fire('linting.completed', { issues: issues });
};

Linting.prototype._createIssues = function(issues) {
  for (var id in issues) {
    this._createElementIssues(id, issues[id]);
  }
};

/**
 * Create overlays for an elements issues.
 *
 * @param {string} elementId - Elements ID.
 * @param {Array} elementIssues - All element issues including warnings and errors.
 */
Linting.prototype._createElementIssues = function(elementId, elementIssues) {
  var element = this._elementRegistry.get(elementId);

  if (!element) {
    return;
  }

  var menuPosition;
  var position;

  if (element === this._canvas.getRootElement()) {
    menuPosition = 'bottom-right';

    position = {
      top: 20,
      left: 150
    };
  } else {
    menuPosition = 'top-right';

    position = {
      top: OFFSET_TOP,
      left: OFFSET_RIGHT
    };
  }

  var issuesByType = groupBy(elementIssues, function(elementIssue) {
    return elementIssue.category;
  });

  var errors = issuesByType.error,
      warnings = issuesByType.warn;

  if (!errors && !warnings) {
    return;
  }

  var $html = domify(
    '<div class="bjsl-overlay bjsl-issues-' + menuPosition + '"></div>'
  );

  var $icon = errors
    ? domify('<div class="bjsl-icon bjsl-icon-error">' + ErrorSvg + '</div>')
    : domify('<div class="bjsl-icon bjsl-icon-warning">' + WarningSvg + '</div>');

  var $dropdown = domify('<div class="bjsl-dropdown"></div>');
  var $dropdownContent = domify('<div class="bjsl-dropdown-content"></div>');
  var $issues = domify('<div class="bjsl-issues"></div>');
  var $issueList = domify('<ul></ul>');

  $html.appendChild($icon);
  $html.appendChild($dropdown);

  $dropdown.appendChild($dropdownContent);
  $dropdownContent.appendChild($issues);

  $issues.appendChild($issueList);

  if (errors) {
    this._addErrors($issueList, errors);
  }

  if (warnings) {
    this._addWarnings($issueList, warnings);
  }

  this._overlayIds[elementId] = this._overlays.add(element, 'linting', {
    position: position,
    html: $html,
    scale: {
      min: .9
    }
  });
};

Linting.prototype._addErrors = function($ul, errors) {

  var self = this;

  errors.forEach(function(error) {
    self._addEntry($ul, 'error', error);
  });
};

Linting.prototype._addWarnings = function($ul, warnings) {

  var self = this;

  warnings.forEach(function(error) {
    self._addEntry($ul, 'warning', error);
  });
};

Linting.prototype._addEntry = function($ul, state, entry) {

  var rule = entry.rule,
      message = this._translate(entry.message);

  var icon = stateToIcon[state];

  var $entry = domify(
    '<li class="' + state + '">' +
      icon +
      '<a title="' + escapeHTML(rule) + ': ' + escapeHTML(message) + '" ' +
         'data-rule="' + escapeHTML(rule) + '" ' +
         'data-message="' + escapeHTML(message) + '"' +
      '>' +
        escapeHTML(message) +
      '</a>' +
    '</li>'
  );

  $ul.appendChild($entry);
};

Linting.prototype._clearOverlays = function() {
  this._overlays.remove({ type: 'linting' });

  this._overlayIds = {};
};

Linting.prototype._clearIssues = function() {
  this._issues = {};

  this._clearOverlays();
};

Linting.prototype._setButtonState = function(state, errors, warnings) {
  var button = this._button;

  var icon = stateToIcon[state];

  var html = icon + '<span>' + this._translate('{errors} Errors, {warnings} Warnings', { errors: errors.toString(), warnings: warnings.toString() }) + '</span>';

  [
    'error',
    'inactive',
    'success',
    'warning'
  ].forEach(function(s) {
    if (state === s) {
      button.classList.add('bjsl-button-' + s);
    } else {
      button.classList.remove('bjsl-button-' + s);
    }
  });

  button.innerHTML = html;
};

Linting.prototype._updateButton = function() {

  if (!this.isActive()) {
    this._setButtonState('inactive', 0, 0);

    return;
  }

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

  var state = (errors && 'error') || (warnings && 'warning') || 'success';

  this._setButtonState(state, errors, warnings);
};

Linting.prototype._createButton = function() {

  var self = this;

  this._button = domify(
    '<button class="bjsl-button bjsl-button-inactive" title="' + this._translate('Toggle linting') + '"></button>'
  );

  this._button.addEventListener('click', function() {
    self.toggle();
  });

  this._canvas.getContainer().appendChild(this._button);
};

Linting.prototype.lint = function() {
  var definitions = this._bpmnjs.getDefinitions();

  var linter = new Linter(this._linterConfig);

  return linter.lint(definitions);
};

Linting.$inject = [
  'bpmnjs',
  'canvas',
  'config.linting',
  'elementRegistry',
  'eventBus',
  'overlays',
  'translate'
];
