
'use strict'

var fs = require('fs')
var path = require('path')
var extend = require('util')._extend

class Sugar {
  constructor (gulp, o) {
    this.gulp = gulp
    this.o = o
  }
  task (superTask, maybeDeps, o) {
    if (!o) {
      o = maybeDeps
      maybeDeps = []
    }
    o = o || {}
    var projectDir = module.parent.filename.replace(/^(.+)\/[^\/\\]+$/, '$1')

    var rootDir = findNodeModulesDir(projectDir)

    var taskDirs = [ ]

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
      var taskConf = extend({}, o[taskName])

      // Allow placing .src and .dest on the parent object
      if (!taskConf.src && o.src) taskConf.src = o.src
      if (!taskConf.dest && o.dest) taskConf.dest = o.dest

      var deps = taskConf.deps || []
      if (typeof deps === 'string') {
        deps = deps.split(/\s+/)
      }
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
              console.warn('Error loading "' + taskPath + '"\n\t' + e.message)
              return 1
            }
          }
          if (task) break
        }
      }

      if (typeof task !== 'function') {
        throw new Error("Couldn't find task " + taskScript + ' in \n\t' +
          taskDirs.join('\n\t'))
      }
      this.gulp.task(taskName, deps.concat(taskNames), task(this.gulp, taskConf))
      taskNames.unshift(taskName)
      added += 1 // TODO: Handle added tasks
    }
    this.gulp.task(superTask, taskNames.concat(maybeDeps))
    this.gulp.task('default', [superTask])
    return this
  }
  skip (superTask, maybeDeps, o) {
    console.log('Skipping', superTask)
  }
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
