export default function Log(eventBus) {
  eventBus.on('elements.changed', function(e) {
    console.log(e);
  });
};