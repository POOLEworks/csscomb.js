var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;

describe('CLI:', function() {
    var exampleFile = 'test/core/cli/source.css';
    var expectedFile = 'test/core/cli/expected-csscomb.css';
    var templateFile = 'test/core/cli/template.css';
    var tmpFile = 'test/core/cli/tmp.css';
    var configFile = 'test/core/cli/expected-template.json';

    var args;
    var callback;
    var output;

    function run() {
        args.unshift('bin/csscomb');

        // Use `spawn` instead of `fork` to be able to manipulate stdout:
        var child = spawn('node', args);

        // Prevent child's stdout from showing but collect all logs.
        // Set encoding to convert buffer to string:
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', function(data) {
            output.push(data);
        });

        child.on('close', callback);
    }

    beforeEach(function() {
        args = [];
        output = [];
    });

    it('no path specified => should exit with error', function(done) {
        // Run `csscomb`:
        callback = function() {
            assert.equal(output[0].trim(), 'No input paths specified');
            done();
        };
        run();
    });

    it.skip('path is specified but file does not exist => should exit with error', function() {});

    it.skip('one of files does not exist => should show warning and comb the files that exist', function() {});

    it.skip('--detect + template file does not exist => should exit with error', function() {});

    it.skip('--detect + template file has unsupported extension (not .css) => should exit with error', function() {});

    it('--detect + template file is ok => should return detected config', function(done) {
        // Run `csscomb -d test/core/cli/template.css`:
        args = ['-d', templateFile];
        callback = function() {
            assert.equal(
                JSON.stringify(JSON.parse(output[0]), false, 4),
                JSON.stringify(require('./cli/expected-template.json'), false, 4)
            );
            done();
        };
        run();
    });

    it('--config + config file does not exist => should exit with error', function(done) {
        // Copy example css to a temp file:
        var css = fs.readFileSync(exampleFile, 'utf8');
        fs.writeFileSync(tmpFile, css);

        // Run `csscomb -c test/core/csscomb.json test/core/cli/example.css`:
        args = ['-c', 'test/core/csscomb.json', tmpFile];
        callback = function() {
            // Remove temp file:
            fs.unlinkSync(tmpFile);
            assert.equal(output[0].trim(), 'Configuration file test/core/csscomb.json was not found.');
            done();
        };
        run();
    });

    it.skip('--config + config file has unsupported extension (nor .css, neither .json) => should exit with error', function() {});

    it.skip('--config + json config file => should comb example file and result should be as expected', function(done) {
        // Copy example css to a temp file:
        var css = fs.readFileSync(exampleFile, 'utf8');
        fs.writeFileSync(tmpFile, css);

        // Run `csscomb -c test/core/cli/csscomb.json test/core/cli/example.css`:
        args = ['-c', configFile, tmpFile];
        callback = function() {
            console.log('OUTPUT:');
            console.log(output);
            var input = fs.readFileSync(tmpFile, 'utf8');
            var expected = fs.readFileSync(expectedFile, 'utf8');
            // Remove temp file:
            fs.unlinkSync(tmpFile);
            assert.equal(input, expected);
            done();
        };
        run();
    });

    it.skip('--config + json config file with template option + template file ok => should comb example file and result should be as expected', function() {});

    it.skip('--config + json config file with template option + template file does not exist => should exit with error', function() {});

    it.skip('--config + css config file => should comb example file and result should be as expected', function() {});

    it('default config => should comb example file and result should be as expected', function(done) {
        // Copy example css to a temp file:
        var css = fs.readFileSync(exampleFile, 'utf8');
        fs.writeFileSync(tmpFile, css);

        // Run `csscomb test/core/cli/tmp.css`:
        args = [tmpFile];
        callback = function() {
            var input = fs.readFileSync(tmpFile, 'utf8');
            var expected = fs.readFileSync(expectedFile, 'utf8');
            // Remove temp file:
            fs.unlinkSync(tmpFile);
            assert.equal(input, expected);
            done();
        };
        run();
    });

    it.skip('config in HOME dir => should comb example file and result should be as expected', function() {});

    it.skip('--verbose + default config => should show info, comb example file and result should be as expected', function() {});

    it.skip('--lint + default config => should not comb example file', function() {});

    it.skip('--verbose + --lint + default config => should show info and not comb example file', function() {});
});
