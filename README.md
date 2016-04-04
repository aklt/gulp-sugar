# gulp-sugar - Write readable gulpfiles and share tasks

This is a wrapper for `gulp` making it easier to write more readable gulpfiles.

Each build is defined in a `.js` file and will be passed the `gulp` instance
which it will use as appropriate to create a gulp the set of tasks for this
build.

When running `gulp` tasks are searched for in directories under
`node_modules`, `lib/` and some others.  This makes it possible to write
project specific tasks as well as NPM modules containing tasks.

A few simple tasks are in [gulp-sugar-simple](https://github.com/aklt/gulp-sugar-simple).

Here is an example `gulpfile.coffee`:

```coffee
   gulp = require 'gulp'
   sugar = require('gulp-sugar')(gulp)

   sugar.task('clean',
     clean:
       rm: 'build')

   sugar.task('build',
     dir:
       task: 'shell'
       cmd:  'mkdir -p build'
     script:
       src:  'lib/*.js'
       dest: 'build/script.js'
       deps: 'dir'

       task: 'uglify'
       deps: 'script'
       dest: 'build/script.min.js')
```

This will create super tasks `clean` and `build` and `build` will also become
the default task.  

Within each `sugar.task` declaration the following tasks all depend on the
previous tasks, so `minify` depends on `script` and `dir` and `script` on
`dir`.


## Keys in the Gulpfile

Each key names a task that will be exposed by the gulpfile and may also name
the task script. Some special keys may be present:

  * `module` The name of the tasks in `node_modules`
  * `src`    The default source for tasks
  * `dest`   The default destination

Other keys name task objects that are passed to task scripts. Optional
keys are

  * `task` The name of the build `.js` file to run for this task
  * `deps` The dependencies of this task

Tasks are attempted required in the following order:

  1. in the `gulp` directory in the project root
  2. in `conf.module/lib` directory in `node_modules`
  3. in the project root possibly searching `NODE_PATH`

For examples of tasks see
[gulp-sugar-simple](http://github.com/aklt/gulp-sugar-simple).  An example
gulpfile is in [gulp-sugar-test](https://github.com/aklt/gulp-sugar-test).

`gulp-sugar` can be used with `gulpfile.js` or `gulpfile.coffee`.
