module.exports = function (config) {
    config.set({

        singleRun: true,

        frameworks: ["jasmine", "karma-typescript"],

        files: [
            'lib/es5-promise-polyfill.js',
            'lib/array-find-polyfill.js',
            'lib/es6-map-shim.js',
            "src/inversify.config.ts",
            "src/**/*.ts",
            "specs/config.ts",
            "specs/**/*.spec.ts",
            // "specs/conversations.spec.ts"
            // "specs/interfaceManager.spec.ts"
            //"specs/indexedDBLogger.spec.ts"
        ],

        preprocessors: {
            "**/*.ts": ["karma-typescript"],
        },

        reporters: ["progress", "karma-typescript", "teamcity"],

        browsers: ["ChromeHeadless"],

        customLaunchers: {
            ChromeHeadless: {
                base: 'Chrome',
                flags: [
                    '--no-sandbox',
                    // See https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
                    '--headless',
                    '--disable-gpu',
                    // Without a remote debugging port, Google Chrome exits immediately.
                    ' --remote-debugging-port=9222',
                ]
            }
        },

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,

        client: {
            captureConsole: true
        },

        karmaTypescriptConfig: {
            reports:
                {
                    "html": {
                        "directory": "coverage",    // optional, defaults to 'coverage'
                        "subdirectory": "report" // optional, defaults to the name of the browser running the tests
                    },
                    "text-summary": ""
                },
            coverageOptions: {
                instrumentation: true
            },
            compilerOptions: {
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                module: "commonjs",
                sourceMap: true,
                "moduleResolution": "node",
                target: "ES5",
                "lib": [
                    "es6",
                    "dom"
                ],
                "types": [
                    "jasmine",
                    "reflect-metadata"
                ]
            }
        }
    });
};
