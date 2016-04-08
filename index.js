
'use strict'

var fs = require('fs')
var path = require('path')
var extend = require('util')._extend

class Sugar {
  constructor (gulp, o) {
    this.gulp = gulp
    this.o = o
    this.tasksSeen = {}
  }
  task (superTask, tasksOrDeps, o) {
    var type = typeof tasksOrDeps
    if (type === 'string' || Array.isArray(tasksOrDeps)) {
      if (type === 'string') tasksOrDeps = tasksOrDeps.split(/\s+/)
      this.gulp.task(superTask, tasksOrDeps)
      this.gulp.task('default', [superTask])
    }

    if (!o) {
      o = tasksOrDeps
      tasksOrDeps = []
    }

    if (typeof o === 'object' && o !== null) {
      o = o || {}
      var projectDir = module.parent.filename.replace(/^(.+)\/[^\/\\]+$/, '$1')
      var rootDir = findNodeModulesDir(projectDir)
      var taskDirs = []

      // Check a handful of dirs for task definitions
      taskDirs.push(rootDir + '/' + (o.taskDir || 'gulp') + '/')
      if (process.env.GULP_SUGAR_TASKS) {
        var envTasks = process.env.GULP_SUGAR_TASKS
        if (envTasks[0] !== '/') {
          envTasks = rootDir + '/' + envTasks
        }
        if (envTasks[envTasks.length - 1] !== '/') {
          envTasks = envTasks + '/'
        }
        taskDirs.push(envTasks)
      }

      if (o.name || o.module) {
        taskDirs.push(rootDir + '/node_modules/' + (o.name || o.module) + '/')
      }
      taskDirs.push(rootDir + '/node_modules/gulp-sugar-simple/lib/')
      taskDirs.push(rootDir + '/node_modules/gulp-sugar-tasks/lib/')
      taskDirs.push(rootDir + '/node_modules/gulp-sugar/lib/')
      taskDirs.push(rootDir + '/lib/')
      taskDirs.push('')

      var added = 0
      var taskNames = []
      for (var taskName in o) {
        if (taskName === 'dest' || taskName === 'src' || taskName === 'module') {
          continue
        }
        var oldSuper = this.tasksSeen[taskName]
        if (oldSuper) {
          die(1,
          'Error: Task ' + taskName + ' already defined in superTask ' +
                                        oldSuper + '\nplease rename it')
        }
        this.tasksSeen[taskName] = superTask

        var taskConf = extend({}, o[taskName])

        // Allow placing .src and .dest on the parent object
        if (!taskConf.src && o.src) taskConf.src = o.src
        if (!taskConf.dest && o.dest) taskConf.dest = o.dest

        var deps = taskConf.deps || []
        if (typeof deps === 'string') {
          deps = deps.split(/\s+/)
        }
        deps = tasksOrDeps.concat(deps)
        var taskScript = taskConf.task || taskName
        var task = null
        var taskPath = ''

        if (taskConf.skip) {
          task = function () {
            var skip = taskName
            return function () {
              console.log('Skipping task', skip)
            }
          }
        } else {
          for (var i = 0; i < taskDirs.length; i += 1) {
            taskPath = taskDirs[i] + taskScript + '.js'
            if (fs.existsSync(taskPath)) {
              try {
                task = require(taskPath)
              } catch (e) {
                die(3, 'Error loading "' + taskPath + '"\n\t' + e.message + '\n' +
                        e.stack)
              }
            }
            if (task) break
          }
        }

        if (typeof task !== 'function') {
          die(2,
            "Couldn't find task " + taskScript + ' in \n\t' + taskDirs.join('\n\t'))
        }

        this.gulp.task(taskName, deps.concat(taskNames), task(this.gulp, taskConf))
        taskNames.push(taskName)
        added += 1
      }
      this.gulp.task(superTask, taskNames)
      this.gulp.task('default', [superTask])
    }
    return this
  }
  skip (superTask, tasksOrDeps, o) {
    console.log('Skipping', superTask)
  }
}

function die (code, msg) {
  console.warn(msg)
  process.exit(code)
}

function findNodeModulesDir (fromDir) {
  // Find the first dir containing a node_modules dir
  fromDir = fromDir.replace(/\/+$/, '')
  if (fromDir.length === 0) {
    return null
  }
  if (fs.existsSync(fromDir + '/node_modules')) {
    return fromDir
  }
  return findNodeModulesDir(path.dirname(fromDir))
}

module.exports = function (gulp) {
  return new Sugar(gulp)
}
