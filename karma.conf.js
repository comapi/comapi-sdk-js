module.exports = function (config) {
    config.set({

        singleRun: true,

        frameworks: ["jasmine", "karma-typescript"],

        files: [
            'lib/es5-promise-polyfill.js',
            "src/**/*.ts",
            "specs/**/*.ts",
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
            }
        }
    });
};
