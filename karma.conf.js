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

        browsers: ["Chrome"],

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,

        client: {
            captureConsole: true
        },

        karmaTypescriptConfig: {
            reports:
            {
                "cobertura": {
                    "directory": "coverage",
                    "filename": "coverage.xml",
                    "subdirectory": "cobertura"
                },
                "html": "coverage",
                "text-summary": "",
                "teamcity": ""
            },
            coverageOptions: {
                instrumentation: false
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
