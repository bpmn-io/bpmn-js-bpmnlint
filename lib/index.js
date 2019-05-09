import Linting from './Linting';

import EditorActions from './EditorActions';

export default {
  __init__: [ 'linting', 'lintingEditorActions' ],
  linting: [ 'type', Linting ],
  lintingEditorActions: ['type', EditorActions]
};