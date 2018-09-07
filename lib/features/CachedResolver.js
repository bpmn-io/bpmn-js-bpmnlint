/**
 * A resolver that caches rules and configuration as part of the bundle,
 * making them accessible in the browser.
 */

function CachedResolver() {}

module.exports = CachedResolver;


CachedResolver.prototype.resolveRule = function(pkg, ruleName) {

  if (pkg === 'bpmnlint') {
    return require('bpmnlint/rules/' + ruleName);
  }

  throw new Error('cannot resolve rule <' + pkg + '/' + ruleName + '>');
};

CachedResolver.prototype.resolveConfig = function(pkg, configName) {

  if (pkg === 'bpmnlint') {
    return require('bpmnlint/config/' + configName);
  }

  throw new Error(
    'cannot resolve config <' + configName + '> in <' + pkg +'>'
  );
};