module.exports = function (grunt) {

    console.log(grunt.cli.tasks);

    var pkg = grunt.file.readJSON('package.json');

    // these will get overwritten ...
    var versionNumber = pkg.version + "." + pkg.build;
    var outputDirectory = "dist/" + versionNumber + "/";


    // grunt.log.writeln( "outputDirectory: " + outputDirectory );

    grunt.initConfig({
        /**
         * Invoke typescript complier ...
         */
        ts: {
            options: {
                compile: true,                 // perform compilation. [true (default) | false]
                comments: false,               // same as !removeComments. [true | false (default)]
                target: 'es5',                 // target javascript language. [es3 | es5 (grunt-ts default) | es6]
                "lib": [
                    "es6",
                    "dom"
                ],
                module: 'commonjs',                 // target javascript module style. [amd (default) | commonjs]
                sourceMap: true,               // generate a source map for every output js file. [true (default) | false]                                                                    // Both html templates accept the ext and filename parameters.
                noImplicitAny: false,          // set to true to pass --noImplicitAny to the compiler. [true | false (default)]
                fast: "watch",                  // see https://github.com/TypeStrong/grunt-ts/blob/master/docs/fast.md ["watch" (default) | "always" | "never"]
                rootDir: "build/src/",
                "experimentalDecorators": true,
                "emitDecoratorMetadata": true,
            },
            default: {
                src: ["build/src/**/*.ts"],
                outDir: "build/output/",

            }
        },
        tslint: {
            options: {
                // can be a configuration object or a filepath to tslint.json 
                configuration: "tslint.json"
            },
            files: {
                src: ['src/**/*.ts', 'specs/**/*.ts'],
            }
        },
        /**
         * Generate documentation
         */
        jsdoc: {
            dist: {
                src: [
                    'build/output/*.js',
                ],
                options: {
                    destination: 'JSdoc',
                    template: "node_modules/ink-docstrap/template",
                    // configure: "node_modules/ink-docstrap/template/jsdoc.conf.json"
                    configure: "jsdoc.conf.json"
                }
            }
        },
        /**
         * Increment the build number
         */
        buildnumber: {
            options: {
                // Task-specific options go here. 
            },
            your_target: {
                // Target-specific file lists and/or options go here. 
            },
        },
        /**
         * Copy everything out of the build folder
         */
        copy: {
            specs: {
                expand: true, cwd: 'specs/', src: ['**/*.ts'], dest: "build/specs",
            },
            src: {
                expand: true, cwd: 'src/', src: ['**'], dest: "build/src",
            },
            build: {
                expand: true, cwd: 'build/', src: ['**'], dest: outputDirectory,
            },
            docs: {
                expand: true, cwd: 'JSDoc/', src: ['**'], dest: outputDirectory + "/JSDoc",
            },
        },
        /**
         * create outputDirectory based on version number
         */
        buildfolder: {
            default: {
                options: {}
            },
        },
        /**
         * Lint all javascript files - running this on tsc output is presumably redundant but if there is a mix of files it will be useful 
         */
        jshint: {
            files: [
                'build/src/*.js'
            ],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true
                }
            }
        },
        express: {
            dev: {
                options: {
                    background: true,
                    script: 'specs/server.js'
                }
            },
            ws: {
                options: {
                    background: true,
                    script: 'specs/webSocket.js'
                }
            },
        },
        uglify: {
            dist: {
                files: {
                    'build/bundle/comapi-foundation.min.js': ['build/bundle/comapi-foundation.js']
                }
            }
        },
        /**
         * 
         */
        clean: {
            tempfolders: {
                src: ["build", "JSDoc", "tests", "coverage"]
            },
        },
        replace: {
            src: {
                src: ['build/**/*.*'],             // source files array (supports minimatch)
                overwrite: true,             // destination directory or file
                replacements: [{
                    from: '_SDK_VERSION_',                   // string replacement
                    to: versionNumber
                }]
            },

        },
        webpack: {
            build: {

                entry: './build/output/foundation.js',
                output: {
                    path: './build/bundle',
                    filename: "comapi-foundation.js",
                    library: ["COMAPI"],
                    libraryTarget: "var",
                },
            },
        },
        run: {
            karma_typescript: {
                cmd: 'npm',
                args: [
                    'test'
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-build-number');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks("grunt-tslint");
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-run');

    grunt.task.registerMultiTask('buildfolder', 'creates output folder', function () {
        var pkg = grunt.file.readJSON('package.json');

        grunt.log.writeln(pkg.version + "." + pkg.build);

        versionNumber = pkg.version + "." + pkg.build;
        outputDirectory = "dist/" + versionNumber + "/";

    });

    // the default task can be run just by typing "grunt" on the command line - this does everything
    grunt.registerTask('default', [
        'clean',
        'tslint',
        'buildnumber',
        'buildfolder',
        'copy:specs',
        'copy:src',
        //        'typescript',
        'ts',
        'webpack',
        'replace',
        'jsdoc',
        'copy:build',
        'copy:docs',
    ]);

    // Just create the docs ...    
    grunt.registerTask('docs', [
        'jsdoc',
    ]);

    // Just create the docs ...    
    grunt.registerTask('compile', [
        'clean',
        'tslint',
        'buildnumber',
        'buildfolder',
        'copy:specs',
        'copy:src',
        //        'typescript',
        'ts',
        'webpack',
        'replace',
        'uglify',
        'jsdoc',
    ]);

    // Just create the docs ...    
    grunt.registerTask('lint', [
        'jshint',
    ]);

    // Just create the docs ...    
    grunt.registerTask('test', [
        'express:dev',
        'express:ws',
        'run:karma_typescript',
        'express:dev:stop',
        'express:ws:stop',
    ]);

    // Just create the docs ...    
    grunt.registerTask('tidy', [
        'clean',
    ]);


};