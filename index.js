/*global console*/

var fs = require('fs');

function clone(dest) {
    var r = {};
    if (Array.isArray(dest))
        r = [];
    for (var dk in dest) {
        r[dk] = dest[dk];
    }
    return r;
}

module.exports = function (gulp, conf) {
    var projectDir = module.parent.filename.replace(/^(.+)\/[^\/\\]+$/, '$1');

    var taskDirs = [ ];

    // ./gulp/<script>.js
    taskDirs.push(projectDir + '/' + (conf.taskDir || 'gulp') + '/');

    // ./node_modules/<conf.(name|module|'gulp-sugar-simple')>/lib/<script>.js
    taskDirs.push(projectDir + '/node_modules/' + (conf.name || conf.module || 'gulp-sugar-simple') + '/lib/');

    // ./lib/<script>.js
    taskDirs.push(projectDir + '/lib/');

    // <script>.js
    taskDirs.push('');

    var added = 0;
    for (var taskName in conf) {
        if (taskName === 'dest' || taskName === 'src' || taskName === 'module')
            continue;
        var taskConf = clone(conf[taskName]);

        // Allow placing .src and .dest on the parent object
        if (!taskConf.src && conf.src) taskConf.src = conf.src;
        if (!taskConf.dest && conf.dest) taskConf.dest = conf.dest;

        var deps = taskConf.deps || [];
        if ('string' === typeof deps) deps = [deps];

        var taskScript = taskConf.task || taskName,
            task = null,
            taskPath = '';

        if (taskConf.skip) {
            task = function () {
                var skip = taskName;
                return function () {
                    console.log('Skipping task', skip);
                };
            };
        } else {
            for (var i = 0; i < taskDirs.length; i += 1) {
                taskPath = taskDirs[i] + taskScript + '.js';
                if (fs.existsSync(taskPath)) {
                    try {
                        task = require(taskPath);
                    } catch (e) {
                        console.warn('Error loading "' + taskPath + '"\n\t' +
                                                        e.message);
                        return 1;
                    }
                }
                if (task) break;
            }
        }

        if ('function' !== typeof task) {
            throw new Error("Couldn't find task " + taskScript +
                            ' in \n\t' + taskDirs.join('\n\t'));
        }
        gulp.task(taskName, deps, task(gulp, taskConf));
        added += 1; // TODO: Handle added tasks
    }

    return gulp;
};
