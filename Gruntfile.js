module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      build: {
        files:{
          'static/js/app.min.js' : 'static/js/app.js',
        }
      }
    },
    cssmin: {
      min:{
        files:{
          'static/css/main.min.css' : 'static/css/main.css'
        }
      }
    },
    watch: {
      scripts: {
        files: ['static/js/app.js'],
        tasks: ['uglify:build']
      },
      styles: {
        files: ['static/css/main.css'],
        tasks: ['cssmin:min']
      }
    }
  });

  // Load the plugin
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  // Default task(s).
  grunt.registerTask('default', ['cssmin', 'uglify', 'watch']);

};