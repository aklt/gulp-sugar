# gulp-sugar - Write readable gulpfiles and share tasks

This is a wrapper for gulp that allows specifying the tasks to run as an
object.  Each key in the object names a task that will be exposed by the
gulpfile and may also name the task script.  

Task objects are passed to task scripts. Optional keys are

  * `task` (optional) The name of the script to run for this task
  * `deps` (optional) The dependencies of this task

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

`gulp-sugar` can be used with `gulpfile.js` or `gulpfile.coffee`.
