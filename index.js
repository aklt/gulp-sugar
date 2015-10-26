/*global console*/

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

    var tasksDir = [ ];

    // ./gulp/<script>.js
    tasksDir.push(projectDir + '/' + (conf.taskDir || 'gulp') + '/');

    // ./node_modules/<conf.(name|module|'gulp-sugar-simple')>/lib/<script>.js
    tasksDir.push(projectDir + '/node_modules/' + (conf.name || conf.module || 'gulp-sugar-simple') + '/lib/');

    // ./lib/<script>.js
    tasksDir.push(projectDir + '/lib/');

    // <script>.js
    tasksDir.push('');

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

        for (var i = 0; i < tasksDir.length; i += 1) {
            try {
                taskPath = tasksDir[i] + taskScript;
                task = require(taskPath);
            } catch (e) {
            }
            if (task) break;
        }

        if (!task) {
            var loc = new Error("Couldn't find task " + taskScript +
                ' in \n\t' + tasksDir.join('\n\t'));
            console.warn('Warning', loc);
        }
        gulp.task(taskName, deps, task(gulp, taskConf));
        added += 1; // TODO: Handle added tasks
    }

    return gulp;
};
