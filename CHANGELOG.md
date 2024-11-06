# Changelog

All notable changes to [bpmn-js-bpmnlint](https://github.com/bpmn-io/bpmn-js-bpmnlint) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

* `CHORE`: update to `diagram-js@15.1.0`
* `CHORE`: update to `bpmn-js@18.0.0`

## 0.22.1

* `FIX`: translate child issues string
* `DEPS`: update dependencies

## 0.22.2

* `FIX`: apply fixed icon size

## 0.22.1

* `FIX`: correct icon rendering with custom box-sizing

## 0.22.0

* `FEAT`: support `info` type ([`35e799ff`](https://github.com/bpmn-io/bpmn-js-bpmnlint/commit/35e799fffcd78752b5ea8b19feeca0241c2f2637))
* `FEAT`: unify + centralize style definitions ([`0b3d214`](https://github.com/bpmn-io/bpmn-js-bpmnlint/commit/0b3d214477e0711615410b4968eb9d910763c438))
* `FEAT`: eagerly validate ([`18c4f4d`](https://github.com/bpmn-io/bpmn-js-bpmnlint/commit/18c4f4de86ce2ab7053cce0f44c08bbfaeeba3d8))
* `FEAT`: improve scaling behavior ([`ea1018f`](https://github.com/bpmn-io/bpmn-js-bpmnlint/commit/ea1018fd35358fd077f3012edbcf3a00bcc31953))
* `DEPS`: update to `bpmnlint@10`
* `DEPS`: update to `bpmn-js@16`

## 0.21.0

* `DEPS`: update to `bpmnlint@8.3.1`
* `DEPS`: update to `bpmn-js@12`

## 0.20.1

* `FIX`: correct middle alignment of issue markers
* `DEPS`: update dependencies

## 0.20.0

* `DEPS`: make `bpmn-js` a peer dependency
* `DEPS`: make `diagram-js` a peer dependency
* `DEPS`: support `bpmnlint@8`

## 0.19.0

* `FEAT`: support overlays in subprocess view ([#33](https://github.com/bpmn-io/bpmn-js-bpmnlint/pull/33))
* `DEPS`: bump to `bpmn-js@9`

## 0.18.3

_Re-release of 0.18.2._

## 0.18.2

_Re-release of 0.18.1 without pending feature commit._

## 0.18.1

* `FIX`: display root element warnings ([#34](https://github.com/bpmn-io/bpmn-js-bpmnlint/pull/34))

## 0.18.0

* `FEAT`: display process errors in collaboration on linked participant ([#31](https://github.com/bpmn-io/bpmn-js-bpmnlint/pull/31))
* `FIX`: correct related element pill height

## 0.17.0

* `CHORE`: bump to `bpmn-js@8.3.0` and `bpmnlint@7.2.1`
* `FIX`: display issues for elements without bpmndi on root element level ([#27](https://github.com/bpmn-io/bpmn-js-bpmnlint/issues/27))

## 0.16.0

* `CHORE`: bump to `bpmnlint@0.16.0`
* `FIX`: prevent icon shrinks on longer lint messages ([#24](https://github.com/bpmn-io/bpmn-js-bpmnlint/issues/24))

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
