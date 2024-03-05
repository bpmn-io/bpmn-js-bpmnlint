import EditorActions from './EditorActions.js';
import Linting from './Linting.js';

export default {
  __init__: [ 'linting', 'lintingEditorActions' ],
  linting: [ 'type', Linting ],
  lintingEditorActions: [ 'type', EditorActions ]
};