module.exports = function (config) {
    config.set({

        singleRun: true,

        frameworks: ["jasmine", "karma-typescript"],

        files: [
            'lib/es5-promise-polyfill.js',
            "src/**/*.ts",
            // "specs/**/*.ts",
            "chatLayer/**/*.ts",
            "chatLayerSpecs/**/logic-new-device.spec.ts",
        ],

        preprocessors: {
            "**/*.ts": ["karma-typescript"],
        },

        reporters: ["progress", "karma-typescript", "teamcity"],

        browsers: ["Chrome"],

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
            },/*
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
            }*/

        }
    });
};
