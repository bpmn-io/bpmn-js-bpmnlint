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


export default function Linting(
    bpmnjs,
    canvas,
    config,
    elementRegistry,
    eventBus,
    overlays
) {
  this._bpmnjs = bpmnjs;
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._overlays = overlays;

  this._issues = {};
  this._lintingActive = config && config.lintingActive || false;
  this._linterConfig = emptyConfig;

  this._overlayIds = {};

  var self = this;

  eventBus.on([
    'import.done',
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

  eventBus.on('element.hover', function(context) {
    var element = context.element,
        id = element.id,
        overlayId = self._overlayIds[ id ];

    var overlay;

    if (overlayId) {
      overlay = self._overlays.get(overlayId);

      overlay.html.classList.add('open', 'hover');
    }
  });

  eventBus.on('element.click', function(context) {
    var element = context.element,
        id = element.id,
        overlayId = self._overlayIds[ id ];

    var overlay;

    function close(event) {
      var target = event.target;

      if (target === overlay.html || overlay.html.contains(target)) {
        return;
      }

      overlay.html.classList.remove('open', 'click');

      window.removeEventListener('click', close);
    }

    if (overlayId) {
      overlay = self._overlays.get(overlayId);

      overlay.html.classList.add('open', 'click');

      setTimeout(function() {
        window.addEventListener('click', close);
      }, 0);
    }
  });

  eventBus.on('element.out', function(context) {
    var element = context.element,
        id = element.id,
        overlayId = self._overlayIds[ id ];

    var overlay;

    if (overlayId) {
      overlay = self._overlays.get(overlayId);

      overlay.html.classList.remove('hover');

      if (overlay.html.classList.contains('click')) {
        return;
      }

      setTimeout(function() {
        if (overlay.html.classList.contains('mouseenter')) {
          return;
        }

        overlay.html.classList.remove('open', 'click');
      }, 500);
    }
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

  var definitions = this._bpmnjs.getDefinitions();

  if (!definitions) {
    return;
  }

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
 * @param {string} elementId - Elements ID.
 * @param {Array} elementIssues - All element issues including warnings and errors.
 */
Linting.prototype.createElementIssues = function(elementId, elementIssues) {
  var element = this._elementRegistry.get(elementId);

  if (!element) {
    return;
  }

  if (element === this._canvas.getRootElement()) {
    this.createRootElementIssues(elementIssues);

    return;
  }

  var position = { top: OFFSET_TOP, left: OFFSET_RIGHT };

  elementIssues = groupBy(elementIssues, function(elementIssue) {
    return elementIssue.category;
  });

  var errors = elementIssues.error,
      warnings = elementIssues.warn;

  var $html = domify('<div class="bpmn-js-bpmnlint-issues"></div>');

  $html.addEventListener('mouseenter', function() {
    console.log('mouseenter');

    $html.classList.add('mouseenter');

    function onMouseOut(event) {
      if ($html.contains(event.relatedTarget)) {
        return;
      }

      $html.classList.remove('mouseenter');

      setTimeout(function() {
        if (!$html.classList.contains('click')) {
          $html.classList.remove('open');
        }
      });
    }

    $html.addEventListener('mouseout', onMouseOut);
  });

  var $icon, $errors, $warnings;

  if (errors) {
    $icon = domify('<div class="icon error">' + ErrorSvg + '</div>');

    $errors = this.createErrors(errors);

    $html.appendChild($errors);
  }

  if (warnings) {
    if (!$icon) {
      $icon = domify('<div class="icon warning">' + WarningSvg + '</div>');
    }

    $warnings = this.createWarnings(warnings);

    $html.appendChild($warnings);
  }

  // icon
  if ($icon) {
    this._overlays.add(element, 'linting', {
      position: position,
      html: $icon
    });
  }

  // issues
  this._overlayIds[elementId] = this._overlays.add(element, 'linting', {
    position: position,
    html: $html,
    scale: {
      min: 1,
      max: 1
    }
  });
};

Linting.prototype.createErrors = function(errors) {
  var $ul = domify('<ul></ul>');

  errors.forEach(function(error) {
    var $li = domify(
      '<li class="error">' +
        ErrorSvg +
        '<a title="Open Documentation" href="https://github.com/bpmn-io/bpmnlint/blob/master/docs/RULES.md#' + error.rule + '">' +
          error.message +
        '</a>' +
      '</li>'
    );

    $ul.appendChild($li);
  });

  return $ul;
};

Linting.prototype.createWarnings = function(warnings) {
  var $ul = domify('<ul></ul>');

  warnings.forEach(function(warning) {
    var $li = domify(
      '<li class="warning">' +
        WarningSvg +
        '<a title="Open Documentation" href="https://github.com/bpmn-io/bpmnlint/blob/master/docs/RULES.md#' + warning.rule + '">' +
          warning.message +
        '</a>' +
      '</li>'
    );

    $ul.appendChild($li);
  });

  return $ul;
};

Linting.prototype.removeIssues = function() {
  this.removeRootElementIssues();

  this._overlays.remove({ type: 'linting' });

  this._overlayIds = {};
};

/**
 * Removes all overlays and clears cached issues.
 */
Linting.prototype.clearIssues = function() {
  this._issues = {};

  this.removeIssues();
};

/**
 * Sets button state to reflect if linting is active.
 *
 * @param {string} state
 */
Linting.prototype.setButtonState = function(state, html) {
  var button = this._button;

  [
    'error',
    'inactive',
    'success',
    'warning'
  ].forEach(function(s) {
    if (state === s) {
      button.classList.add(s);
    } else {
      button.classList.remove(s);
    }
  });

  button.innerHTML = html;
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

Linting.prototype.createRootElementIssues = function(elementIssues) {
  var container = this._canvas.getContainer();

  var $html = domify('<div class="bpmn-js-bpmnlint-issues open bpmn-js-bpmnlint-root-element-issues"></div>');

  elementIssues = groupBy(elementIssues, function(elementIssue) {
    return elementIssue.category;
  });

  var errors = elementIssues.error,
      warnings = elementIssues.warn;

  var $errors, $warnings;

  if (errors) {
    $errors = this.createErrors(errors);

    $html.appendChild($errors);
  }

  if (warnings) {
    $warnings = this.createErrors(warnings);

    $html.appendChild($warnings);
  }

  container.appendChild($html);
};

Linting.prototype.removeRootElementIssues = function() {
  var container = this._canvas.getContainer();

  var html = domQuery('.bpmn-js-bpmnlint-root-element-issues', container);

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
  'bpmnjs',
  'canvas',
  'config.linting',
  'elementRegistry',
  'eventBus',
  'overlays'
];
