# gulp-sugar - Write readable gulpfiles and share tasks

This is a wrapper for gulp that allows specifying the tasks to run as an
object.  require('gulp-sugar') returns a single function:

    gulpSugar(gulp, conf);

Each key in the conf object names a task that will be exposed by the gulpfile
and may also name the task script. Some special keys may be present:

  * `module` The name of the tasks in `node_modules`
  * `src`    The default source for tasks
  * `dest`   The default destination

Other keys name task objects that are passed to task scripts. Optional
keys are

  * `task` The name of the script to run for this task
  * `deps` The dependencies of this task

Tasks are attempted required in the following order:

  1. in the `gulp` directory in the project root
  2. in `conf.module/lib` directory in `node_modules`
  3. in the project root possibly searching `NODE_PATH`

Here is an example `gulpfile.coffee` using `gulp-sugar`:

```coffee
   gulp = require 'gulp'
   require('gulp-sugar')(gulp,
     dir:
       task: 'shell'
       cmd:  'mkdir -p build'
     script:
       src:  'lib/*.js'
       dest: 'build/script.js'
       deps: 'dir'
     minify:
       task: 'uglify'
       deps: 'script'
       dest: 'build/script.min.js'
     clean:
       rm: 'build'
   )
```

For examples of tasks see
[gulp-sugar-simple](http://github.com/aklt/gulp-sugar-simple).  An example
gulpfile is in [gulp-sugar-test](https://github.com/aklt/gulp-sugar-test).

`gulp-sugar` can be used with `gulpfile.js` or `gulpfile.coffee`.
