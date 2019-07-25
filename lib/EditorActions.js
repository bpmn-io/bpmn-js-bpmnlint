export default function EditorActions(injector, linting) {
  var editorActions = injector.get('editorActions', false);

  editorActions && editorActions.register({
    toggleLinting: function() {
      linting.toggleLinting();
    }
  });
}

EditorActions.$inject = [
  'injector',
  'linting'
];