import EditorActions from './EditorActions';
import Linting from './Linting';

export default {
  __init__: [ 'linting', 'lintingEditorActions' ],
  linting: [ 'type', Linting ],
  lintingEditorActions: ['type', EditorActions]
};