'use strict';

var gaze = require('../lib/gaze.js');
var path = require('path');
var fs = require('fs');

// Node v0.6 compat
fs.existsSync = fs.existsSync || path.existsSync;

// Clean up helper to call in setUp and tearDown
function cleanUp(done) {
  [
    'sub/tmp.js',
    'sub/tmp'
  ].forEach(function(d) {
    var p = path.resolve(__dirname, 'fixtures', d);
    if (fs.existsSync(p)) { fs.unlinkSync(p); }
  });
  done();
}

exports.watch = {
  setUp: function(done) {
    process.chdir(path.resolve(__dirname, 'fixtures'));
    cleanUp(done);
  },
  tearDown: cleanUp,
  remove: function(test) {
    test.expect(2);
    gaze('**/*', function() {
      this.remove(path.resolve(__dirname, 'fixtures', 'sub', 'two.js'));
      this.remove(path.resolve(__dirname, 'fixtures'));
      var result = this.relative();
      test.deepEqual(result['sub'], ['one.js']);
      test.notDeepEqual(result['.'], ['one.js']);
      this.close();
      test.done();
    });
  },
  changed: function(test) {
    test.expect(1);
    gaze('**/*', function(err, watcher) {
      watcher.on('changed', function(filepath) {
        var expected = path.relative(process.cwd(), filepath);
        test.equal(path.join('sub', 'one.js'), expected);
        watcher.close();
        test.done();
      });
      this.on('added', function() { test.ok(false, 'added event should not have emitted.'); });
      this.on('deleted', function() { test.ok(false, 'deleted event should not have emitted.'); });
      setTimeout(function() {
        fs.writeFileSync(path.resolve(__dirname, 'fixtures', 'sub', 'one.js'), 'var one = true;');
      }, 100);
    });
  },
  added: function(test) {
    test.expect(1);
    gaze('**/*', function(err, watcher) {
      watcher.on('added', function(filepath) {
        var expected = path.relative(process.cwd(), filepath);
        test.equal(path.join('sub', 'tmp.js'), expected);
        watcher.close();
        test.done();
      });
      this.on('changed', function() { test.ok(false, 'changed event should not have emitted.'); });
      this.on('deleted', function() { test.ok(false, 'deleted event should not have emitted.'); });
      setTimeout(function() {
        fs.writeFileSync(path.resolve(__dirname, 'fixtures', 'sub', 'tmp.js'), 'var tmp = true;');
      }, 100);
    });
  },
  dontAddUnmatchedFiles: function(test) {
    test.expect(2);
    gaze('**/*.js', function(err, watcher) {
      setTimeout(function() {
        test.ok(true, 'Ended without adding a file.');
        watcher.close();
        test.done();
      }, 1000);
      this.on('added', function(filepath) {
        test.equal(path.relative(process.cwd(), filepath), 'sub/tmp.js');
      });
      setTimeout(function() {
        fs.writeFileSync(path.resolve(__dirname, 'fixtures', 'sub', 'tmp'), 'Dont add me!');
        fs.writeFileSync(path.resolve(__dirname, 'fixtures', 'sub', 'tmp.js'), 'add me!');
      }, 100);
    });
  },
  deleted: function(test) {
    test.expect(1);
    var tmpfile = path.resolve(__dirname, 'fixtures', 'sub', 'deleted.js');
    fs.writeFileSync(tmpfile, 'var tmp = true;');
    gaze('**/*', function(err, watcher) {
      watcher.on('deleted', function(filepath) {
        test.equal(path.join('sub', 'deleted.js'), path.relative(process.cwd(), filepath));
        watcher.close();
        test.done();
      });
      this.on('changed', function() { test.ok(false, 'changed event should not have emitted.'); });
      this.on('added', function() { test.ok(false, 'added event should not have emitted.'); });
      fs.unlinkSync(tmpfile);
    });
  },
  nomark: function(test) {
    test.expect(1);
    gaze('**/*', {mark:false}, function(err, watcher) {
      watcher.on('changed', function(filepath) {
        var expected = path.relative(process.cwd(), filepath);
        test.equal(path.join('sub', 'one.js'), expected);
        watcher.close();
        test.done();
      });
      setTimeout(function() {
        fs.writeFileSync(path.resolve(__dirname, 'fixtures', 'sub', 'one.js'), 'var one = true;');
      }, 100);
    });
  }
};
