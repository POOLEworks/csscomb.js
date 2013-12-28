/**
 * Command line implementation for CSScomb
 *
 * Usage example:
 * ./node_modules/.bin/csscomb [options] file1 [dir1 [fileN [dirN]]]
 */
var fs = require('fs');
var path = require('path');
var vow = require('vow');
var Comb = require('./csscomb');

var CombCli = function() {
    this.comb = new Comb();
    this.program = require('commander');
};

CombCli.prototype = {

    init: function() {
        this.program
            .version(require('../package.json').version)
            .usage('[options] <file ...>')
            .option('-v, --verbose', 'verbose mode')
            .option('-c, --config [path]', 'configuration file path')
            .option('-d, --detect', 'detect mode (would return detected options)')
            .option('-l, --lint', 'in case some fixes needed returns an error')
            .parse(process.argv);
    },

    /**
     * Run program
     * @returns {Promise}
     */
    run: function() {
        var comb = this.comb;
        var program = this.program;
        var configPath;
        var config;

        this.init();

        if (!program.args.length) {
            console.log('No input paths specified');
            program.help();
        }

        // TODO: Check file's extension: exit(1) if it's not `.css`
        if (program.detect) {
            console.log(JSON.stringify(comb.detectInFile(program.args[0]), false, 4));
            process.exit(0);
        }

        configPath = program.config || this.getConfigPath();
        config = this.getConfig(configPath);
        comb.configure(config);
        return this.processFiles(config.verbose, config.lint);
    },

    /**
     * Look for a config file: recursively from current (process) directory
     * up to HOME dir or root
     * @param {String} configPath Path to config file
     * @returns {String}
     */
    getConfigPath: function(configPath) {
        var HOME = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

        // Since `process.cwd()` can be absolutely anything, build default path
        // relative to current directory:
        var defaultConfigPath = path.join(__dirname, '../config/csscomb.json');

        configPath = configPath || path.join(process.cwd(), '.csscomb.json');

        // If we've finally found a config, return its path:
        if (fs.existsSync(configPath)) return configPath;

        // If we are in HOME dir already and yet no config file, return a default
        // one from our package.
        // If project is located not under HOME, compare to root instead.
        // Since there appears to be no good way to get root path in
        // Windows, assume that if current dir has no parent dir, we're in
        // root.
        var dirname = path.dirname(configPath);
        var parentDirname = path.dirname(dirname);
        if (dirname === HOME || dirname === parentDirname) return defaultConfigPath;

        // If there is no config in this directory, go one level up and look for
        // a config there:
        configPath = path.join(parentDirname, '.csscomb.json');
        return this.getConfigPath(configPath);
    },

    /**
     * Get content of configuration file
     * @param {String} configPath Path to config file
     * @returns {Object}
     */
    getConfig: function(configPath) {
        var program = this.program;
        var config;

        if (!fs.existsSync(configPath)) {
            console.log('Configuration file ' + configPath + ' was not found.');
            process.exit(1);
        }

        if (configPath.match(/\.css$/)) {
            config = this.comb.detectInFile(configPath);
        } else {
            config = require(configPath);
        }

        if (config.template) config = this.extendTemplate(config);
        if (program.verbose) config.verbose = true;
        if (program.lint) config.lint = true;
        return config;
    },

    /**
     * Extend config with options found in template file
     * @param {Object} config
     * @returns {Object} Extended config
     */
    extendTemplate: function(config) {
        var templateConfig;

        if (!fs.existsSync(config.template)) {
            console.log('Template configuration file ' + config.template + ' was not found.');
            process.exit(1);
        }

        templateConfig = this.comb.detectInFile(config.template);
        for (var attrname in templateConfig) {
            if (!config[attrname]) config[attrname] = templateConfig[attrname];
        }
        return config;
    },

    /**
     * Comb files
     * @param {Boolean} verbose
     * @param {Boolean} lint
     * @returns {Promise}
     */
    processFiles: function(verbose, lint) {
        var comb = this.comb;
        var program = this.program;

        console.time('spent');
        return vow.all(program.args.map(comb.processPath.bind(comb)))
        .then(function() {
            if (verbose) {
                console.log('');
                console.log(comb.processed + ' file' + (comb.processed === 1 ? '' : 's') + ' processed');
                console.log(comb.changed + ' file' + (comb.changed === 1 ? '' : 's') + ' fixed');
                console.timeEnd('spent');
            }
            if (lint && comb.tbchanged) {
                process.exit(1);
            }
        })
        .fail(function(e) {
            console.log('stack: ', e.stack);
            process.exit(1);
        });
    }
};

module.exports = CombCli;
