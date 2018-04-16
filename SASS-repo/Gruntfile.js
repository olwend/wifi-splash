module.exports = function (grunt) {
// load all grunt tasks matching the `grunt-*` pattern
require('load-grunt-tasks')(grunt);

grunt.initConfig({

			//clean main compiled css file and minified version.
			clean: {
				css: ['.sass-cache']
			},

			//compile SCSS files into CSS.
			sass: {
				wifisplash: {
					files: {
						'../css/wifi-splash-page.css': 'scss/styles.scss'
					},
					options: {
						sourceMap: true,
						outputStyle: 'expanded'
					}
				}
			},

			//watch for changes to SCSS files.
			watch: {
				wifisplash: {
					files: ['scss/**/*.scss'],
					tasks: ['sass','notify:sass']
				}
			},

			notify: {
				sass: {
					options: {
						title: "SCSS Compilation",
						message: "CSS compiled successfully",
						success: true
					}
				}
			}
		});

	grunt.registerTask('develop-wifisplash', ['clean', 'sass:wifisplash', 'watch:wifisplash','notify:sass']);
};