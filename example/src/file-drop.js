'use strict';

var debug = console.log;

import {
  domify,
  event as domEvent,
  closest as domClosest
} from 'min-dom';

var OVERLAY_HTML = '<div class="drop-overlay">' +
                     '<div class="box">' +
                        '<div>Drop diagrams here</div>' +
                     '</div>' +
                   '</div>';

/**
 * Add file drop functionality to the given element,
 * calling fn(files...) on drop.
 *
 * @example
 *
 * var node = document.querySelector('#container');
 *
 * var dropHandler = fileDrop(handleFiles);
 *
 * node.addEventListener('dragover', dropHandler);
 *
 * @param {Function} fn
 *
 * @return {Function} drag start callback function
 */
export default function fileDrop(fn) {

  var self;
  var extraArgs;

  var overlay;

  /** prevent drop onto other elements which would show default behaviour */
  domEvent.bind(document, 'dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });

  domEvent.bind(document, 'drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  });

  /** handle actual drop */
  function onDrop(event) {

    event.preventDefault();

    asyncMap(event.dataTransfer.files, readFile, function(err, files) {

      if (err) {
        debug('file drop failed', err);
      } else {

        debug('file drop', files);

        var args = extraArgs.concat([ files, event ]);

        // cleanup on drop
        // onEnd(event);

        // call provided fn with extraArgs..., files, event
        fn.apply(self, args);
      }
    });
  }

  function isDragAllowed(dataTransfer) {

    if (!dataTransfer || !dataTransfer.items.length) {
      return false;
    }

    var hasFile = false;

    for (var i = 0; i < dataTransfer.items.length; i++) {
      if (dataTransfer.items[i].type === 'file' || dataTransfer.items[i].kind === 'file') {
        hasFile = true;
      }
    }

    return hasFile;
  }

  /** drag over */
  var onDragover = function onDragover() {

    // (0) extract extra arguments (extraArgs..., event)
    var args = slice(arguments),
        event = args.pop();

    var dataTransfer = event.dataTransfer,
        target = event.target;

    if (!isDragAllowed(dataTransfer)) {
      return;
    }

    // make us a drop zone
    event.preventDefault();

    dataTransfer.dropEffect = 'copy';

    // only register if we do not drag and drop already
    if (overlay) {
      return;
    }

    overlay = domify(OVERLAY_HTML);

    document.body.appendChild(overlay);


    self = this;
    extraArgs = args;


    // do not register events during testing
    if (!target) {
      return;
    }


    // (2) setup drag listeners

    // detach on end
    var onEnd = function(event) {

      // prevent defaults, i.e. native browser drop
      event.preventDefault();

      overlay.removeEventListener('drop', onDrop);
      overlay.removeEventListener('dragleave', onEnd);
      overlay.removeEventListener('dragend', onEnd);
      overlay.removeEventListener('drop', onEnd);

      if (overlay) {
        document.body.removeChild(overlay);
        overlay = null;
      }
    };

    // attach drag + cleanup event
    overlay.addEventListener('drop', onDrop);
    overlay.addEventListener('dragleave', onEnd);
    overlay.addEventListener('dragend', onEnd);
    overlay.addEventListener('drop', onEnd);
  };

  onDragover.onDrop = onDrop;

  return onDragover;
}

function readFile(dropFile, done) {

  if (!window.FileReader) {
    return done();
  }

  var reader = new FileReader();

  // Closure to capture the file information.
  reader.onload = function(e) {

    done(null, {
      name: dropFile.name,
      path: dropFile.path,
      contents: e.target.result
    });
  };

  reader.onerror = function(event) {
    done(event.target.error);
  };

  // Read in the image file as a data URL.
  reader.readAsText(dropFile);
}


function asyncMap(elements, iterator, done) {

  var idx = 0,
      results = [];

  function next() {

    if (idx === elements.length) {
      done(null, results);
    } else {

      iterator(elements[idx], function(err, result) {

        if (err) {
          return done(err);
        } else {
          results[idx] = result;
          idx++;

          next();
        }
      });
    }
  }

  next();
}


function slice(arr) {
  return Array.prototype.slice.call(arr);
}