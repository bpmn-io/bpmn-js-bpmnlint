# Changelog

All notable changes to [bpmn-js-bpmnlint](https://github.com/bpmn-io/bpmn-js-bpmnlint) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 0.15.0

* `FEAT`: add UMD distribution

## 0.14.0

* `FEAT`: add translation of reports

## 0.13.1

* `FIX`: add missing dependency

## 0.13.0

_This is more or less a full rewrite of the extension._

* `FEAT`: add ability to configure initial activation state
* `FEAT`: rework api
* `FEAT`: use `overlays` for root element, too
* `FEAT`: show rule name on tooltip hover
* `FEAT`: improve look and feel
* `FEAT`: reposition validation button and add title hint
* `CHORE`: namespace styles
* `CHORE`: clearly separate public and private methods

## 0.12.4

* `FIX`: correct no configuration set check

## 0.12.3

* `CHORE`: bump bpmnlint version

## 0.12.2

* `FIX`: do not override eagerly provided external config

## 0.12.1

* `CHORE`: support `bpmnlint@6`

## 0.12.0

* `FEAT`: allow manually setting lint rules
* `FEAT`: emit life-cycle events
* `CHORE`: drop debug log statements

## 0.11.1

* `CHORE`: remove unneeded dev asset from bundle
* `FIX`: pack css assets again

## 0.11.0

* `FEAT`: integrate with `editorActions`
* `FEAT`: show human readable error on missing `config.linting`
* `CHORE`: test against `bpmn-js@4`
* `CHORE`: test against `bpmnlint@5.1`

## 0.10.1

* `CHORE`: update to `npm-run-all@4.1.5`
* `CHORE`: drop example, as it got replaced by [bpmnlint-playground](https://github.com/bpmn-io/bpmnlint-playground)

## 0.10.0

* `CHORE`: support `bpmnlint@5`

## 0.9.0

* `CHORE`: make `bpmnlint` a peer dependency

## 0.8.1

* `CHORE`: update to `bpmnlint@3.3.1`

## 0.8.0

* `CHORE`: update to `bpmnlint@3.3.0`

## 0.7.1

* `FIX`: bump dependency to `min-dom@3`

## 0.7.0

* `FEAT`: make `bpmnlint` an external dependency
* `CHORE`: bundle sourcemaps

## 0.6.0

* `FEAT`: emit `linting.toggle` event
* `FIX`: clear issues on `diagram.clear`

## ...

Check `git log` for earlier history.
