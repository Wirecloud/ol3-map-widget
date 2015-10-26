/*!
 *   Copyright 2014-2015 CoNWeT Lab., Universidad Politecnica de Madrid
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({

        pkg: grunt.file.readJSON('src/config.json'),

        bower: {
            install: {
                options: {
                    layout: function (type, component, source) {
                        return type;
                    },
                    targetDir: './build/lib/lib'
                }
            }
        },

        jshint: {
            options: {
                jshintrc: true
            },
            all: {
                files: {
                    src: ['src/js/**/*.js']
                }
            },
            grunt: {
                options: {
                    jshintrc: '.jshintrc-node'
                },
                files: {
                    src: ['Gruntfile.js']
                }
            },
            test: {
                options: {
                    jshintrc: '.jshintrc-jasmine'
                },
                files: {
                    src: ['src/test/**/*.js', '!src/test/fixtures/']
                }
            }
        },

        jscs: {
            widget: {
                src: 'src/js/**/*.js',
                options: {
                    config: ".jscsrc"
                }
            },
            grunt: {
                src: 'Gruntfile.js',
                options: {
                    config: ".jscsrc"
                }
            }
        },

        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'src/js',
                    src: '*',
                    dest: 'build/src/js'
                }]
            }
        },

        strip_code: {
            multiple_files: {
                src: ['build/src/js/**/*.js']
            },
            imports: {
                options: {
                    start_comment: 'import-block',
                    end_comment: 'end-import-block'
                },
                src: ['src/js/*.js']
            }
        },

        compress: {
            widget: {
                options: {
                    mode: 'zip',
                    archive: 'dist/<%= pkg.vendor %>_<%= pkg.name %>_<%= pkg.version %>.wgt'
                },
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: [
                        'DESCRIPTION.md',
                        'css/**/*',
                        'doc/**/*',
                        'images/**/*',
                        'index.html',
                        'config.xml'
                    ]
                }, {
                    expand: true,
                    cwd: 'build/lib',
                    src: [
                        'lib/**/*'
                    ]
                }, {
                    expand: true,
                    cwd: 'node_modules/openlayers/dist',
                    src: ['ol.js'],
                    dest: "lib/js"
                }, {
                    expand: true,
                    cwd: 'node_modules/openlayers/dist',
                    src: ['ol.css'],
                    dest: "lib/css"
                }, {
                    expand: true,
                    cwd: 'build/src',
                    src: [
                        'js/**/*'
                    ]
                }, {
                    expand: true,
                    cwd: '.',
                    src: [
                        'LICENSE'
                    ]
                }]
            }
        },

        clean: {
            build: {
                src: ['build', 'bower_components']
            },
            temp: {
                src: ['build/src']
            }
        },

        jsbeautifier: {
            files: ["Gruntfile.js"],
            options: {
                js: {
                    spaceAfterAnonFunction: true,
                    endWithNewline: false,
                    jslintHappy: true
                }
            }
        },

        jasmine: {
            test: {
                src: ['src/js/*.js', '!src/js/main.js'],
                options: {
                    specs: 'src/test/js/*Spec.js',
                    helpers: ['src/test/helpers/*.js'],
                    vendor: [
                        'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
                        'node_modules/mock-applicationmashup/lib/vendor/mockMashupPlatform.js',
                        'src/test/vendor/*.js'
                    ]
                }
            },
            coverage: {
                src: '<%= jasmine.test.src %>',
                options: {
                    helpers: '<%= jasmine.test.options.helpers %>',
                    specs: '<%= jasmine.test.options.specs %>',
                    vendor: '<%= jasmine.test.options.vendor %>',
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: 'build/coverage/json/coverage.json',
                        report: [{
                            type: 'html',
                            options: {
                                dir: 'build/coverage/html'
                            }
                        }, {
                            type: 'cobertura',
                            options: {
                                dir: 'build/coverage/xml'
                            }
                        }, {
                            type: 'text-summary'
                        }]
                    }
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine'); // when test?
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-strip-code');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-jsbeautifier');

    grunt.registerTask('test', [
        'bower:install',
        'jshint',
        'jshint:grunt',
        'jscs',
        'jasmine:coverage'

    ]);

    grunt.registerTask('build', [
        'clean:temp',

        'copy:main',
        'strip_code',
        'compress:widget'
    ]);

    grunt.registerTask('default', [
        'jsbeautifier',

        'test',
        'build'
    ]);

    grunt.registerTask('publish', [
        'default'

    ]);
};