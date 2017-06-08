module.exports = function (config) {
    config.set({

        singleRun: true,

        frameworks: ["jasmine", "karma-typescript"],

        files: [
            'lib/es5-promise-polyfill.js',
            'lib/array-find-polyfill.js',
            "src/**/*.ts",
            // "specs/**/*.ts",
            "chatLayer/**/*.ts",
            // "chatLayerSpecs/**/*.spec.ts",
            // "chatLayerSpecs/conversation-crud.spec.ts",
            "chatLayerSpecs/config.spec.ts",
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
                jsx: "react",
                module: "commonjs",
                sourceMap: false,
                target: "ES5"
            }
        }
    });
};
