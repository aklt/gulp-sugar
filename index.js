
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

    for (var taskName in conf) {
        if (taskName === 'dest' || taskName === 'src')
            continue;
        var taskConf = clone(conf[taskName]);

        // Allow placing .src and .dest on the parent object
        if (!taskConf.src && conf.src) taskConf.src = conf.src;
        if (!taskConf.dest && conf.dest) taskConf.dest = conf.dest;

        var deps = taskConf.deps || [];
        if ('string' === typeof deps) deps = [deps];

        var taskScript = taskConf.task || taskName,
            tasks = [
                projectDir + '/' + (conf.taskDir || 'gulp') + '/' + taskScript,
                taskScript
            ],
            task = null;

        for (var i = 0; i < tasks.length; i += 1) {
            try {
                task = require(tasks[i]);
            } catch (e) {
            }
            if (task) break;
        }

        if (!task) throw new Error("No such task found: " + taskScript);
        gulp.task(taskName, deps, task(gulp, taskConf));
    }
    return gulp;
};
