
"use strict"

var fs = require('fs')
var path = require('path')

function clone(dest) {
    if ('string' === typeof dest) {
        return dest;
    }
    var r = {};
    if (Array.isArray(dest))
        r = [];
    for (var dk in dest) {
        r[dk] = dest[dk];
    }
    return r;
}

class Sugar {
    constructor(gulp, o) {
        this.gulp = gulp;
        this.o = o;
    }
    task(superTask, maybeDeps, o) {
        if (!o) {
            o = maybeDeps;
            maybeDeps = [];
        }
        o = o || {};
        var projectDir = module.parent.filename.replace(/^(.+)\/[^\/\\]+$/, '$1');

        // Find the first dir containing a node_modules dir
        function findNodeModulesDir(fromDir) {
          fromDir = fromDir.replace(/\/+$/, '')
          if (fromDir.length === 0) {
            return null
          }
          if (fs.existsSync(fromDir + '/node_modules')) {
            return fromDir
          }
          return findNodeModulesDir(path.dirname(fromDir))
        }
        var rootDir = findNodeModulesDir(projectDir)

        var taskDirs = [ ];

        // Check a handful of dirs for task definitions
        taskDirs.push(rootDir + '/' + (o.taskDir || 'gulp') + '/');
        if (process.env.GULP_SUGAR_TASKS) {
          var envTasks = process.env.GULP_SUGAR_TASKS;
          if (envTasks[0] !== '/') {
            envTasks = rootDir + '/' + envTasks;
          }
          if (envTasks[envTasks.length - 1] !== '/') {
            envTasks = envTasks + '/';
          }
          taskDirs.push(envTasks);
        }

        if (o.name || o.module) {
          taskDirs.push(rootDir + '/node_modules/' + (o.name || o.module) + '/');
        }
        taskDirs.push(rootDir + '/node_modules/gulp-sugar-simple/lib/');
        taskDirs.push(rootDir + '/node_modules/gulp-sugar-tasks/lib/');
        taskDirs.push(rootDir + '/lib/');
        taskDirs.push('');

        var added = 0;
        var taskNames = [];
        for (var taskName in o) {
            if (taskName === 'dest' || taskName === 'src' || taskName === 'module')
                continue;
            var taskConf = clone(o[taskName]);

            // Allow placing .src and .dest on the parent object
            if (!taskConf.src && o.src) taskConf.src = o.src;
            if (!taskConf.dest && o.dest) taskConf.dest = o.dest;

            var deps = taskConf.deps || [];
            if ('string' === typeof deps) deps = deps.split(/\s+/);

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
            this.gulp.task(taskName, deps.concat(taskNames), task(this.gulp, taskConf));
            taskNames.unshift(taskName);
            added += 1; // TODO: Handle added tasks
        }
        return module.exports = this.gulp.task(superTask, maybeDeps.concat(taskNames));
    }
}

module.exports = function (gulp) {
    var s1 = new Sugar(gulp);
    return s1;
};
