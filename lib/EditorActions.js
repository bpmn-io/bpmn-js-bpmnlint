export default function EditorActions(linting, editorActions) {
  editorActions.register({
    toggleLinting: function() {
      linting.toggleLinting();
    }
  });
}

EditorActions.$inject = [
  'linting',
  'editorActions'
];