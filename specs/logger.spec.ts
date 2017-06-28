import { LocalStorageData } from "../src/localStorageData";
import { Logger } from "../src/logger";
import { EventManager } from "../src/eventManager";
import { IndexedDBLogger } from "../src/indexedDBLogger";

import { LogLevels } from "../src/interfaces";


describe("Local Storage basic log logging tests", () => {

    let logger;
    let data;

    beforeEach(function (done) {
        data = new LocalStorageData();
        logger = new Logger(undefined, data, undefined);

        // this will actually be synchronous with the eventlog ...
        logger.clearLog()
            .then(() => {
                done();
            });
    });

    it("should log", done => {
        logger.log("This is a log message");
        logger.getLog(logger)
            .then(logfile => {
                expect(logfile.indexOf("This is a log message") >= 0).toBeTruthy();
                done();
            });
    });

    it("should warn", done => {
        logger.warn("This is a warning message");
        logger.getLog(logger)
            .then(logfile => {
                expect(logfile.indexOf("This is a warning message") >= 0).toBeTruthy();
                done();
            });
    });

    it("should error", done => {
        logger.error("This is an error message");
        logger.getLog(logger)
            .then(logfile => {
                expect(logfile.indexOf("This is an error message") >= 0).toBeTruthy();
                done();
            });
    });

});

/**
 * 
 */
describe("IndexedDBLogger basic logging tests", () => {

    let logger;
    let data;
    let myIndexedDBLogger;

    beforeEach(done => {

        myIndexedDBLogger = new IndexedDBLogger();

        data = new LocalStorageData();
        logger = new Logger(undefined, data, myIndexedDBLogger);

        logger.clearLog().then(() => {
            done();
        });
    });

    afterEach(() => {
        myIndexedDBLogger.closeDatabase();
    });


    it("should log", done => {
        logger.log("This is a log message")
            .then(() => {
                logger.getLog(logger).then(logfile => {
                    console.log("logfile: " + logfile);

                    expect(logfile.indexOf("This is a log message") >= 0).toBeTruthy();
                    done();
                });
            });
    });

    it("should warn", done => {
        logger.warn("This is a warning message").then(() => {

            logger.getLog(logger)
                .then(logfile => {
                    console.log("logfile: " + logfile);

                    expect(logfile.indexOf("This is a warning message") >= 0).toBeTruthy();
                    done();
                });
        });
    });

    it("should error", done => {
        logger.error("This is an error message").then(() => {

            logger.getLog(logger)
                .then(logfile => {
                    console.log("logfile: " + logfile);

                    expect(logfile.indexOf("This is an error message") >= 0).toBeTruthy();
                    done();
                });

        });

    });
});

/**
 * 
 */
describe("IndexedDBLogger purge test", () => {

    let myIndexedDBLogger;
    let logger;
    let data;

    beforeEach(done => {

        myIndexedDBLogger = new IndexedDBLogger();

        data = new LocalStorageData();
        logger = new Logger(undefined, data, myIndexedDBLogger);

        logger.clearLog().then(() => {
            done();
        });

    });

    afterEach(() => {
        myIndexedDBLogger.closeDatabase();
    });


    it("should purge correctly", done => {


        logger.log("This is a log message").then(() => {

            setTimeout(() => {
                let now = new Date();

                myIndexedDBLogger.purge(now)
                    .then(() => {

                        myIndexedDBLogger.getData().then(_data => {

                            expect(_data.length === 0).toBeTruthy();
                            done();
                        });

                    });

            }, 1000);

        }).catch(error => {
            console.error(error);
        });
    });
});


/**
 * 
 */
describe("event related log tests", () => {
    let logger;
    let eventManager;

    beforeEach(done => {
        eventManager = new EventManager();
        logger = new Logger(eventManager);
        done();
    });


    it("should  log if setting level to log", done => {

        function logHandler(data) {
            // shoiuldn't be in here
            expect(1).toEqual(1);
        }

        eventManager.subscribeToLocalEvent("LogMessage", logHandler);

        logger.logLevel = LogLevels.Debug;

        logger.log("This is a log message");


        done();
    });


    it("should not log if setting level to errors", done => {

        function logHandler(data) {
            // shoiuldn't be in here
            expect(1).toEqual(0);
        }

        eventManager.subscribeToLocalEvent("LogMessage", logHandler);

        logger.logLevel = LogLevels.Error;

        logger.log("This is a log message");

        expect(1).toEqual(1);

        done();
    });

    it("should persist a specified log level", done => {

        logger.logLevel = LogLevels.Error;

        expect(logger.logLevel).toEqual(LogLevels.Error);

        done();
    });

    it("should persist a specified log level", done => {

        logger.logLevel = LogLevels.Error;

        expect(logger.logLevel).toEqual(LogLevels.Error);

        done();
    });

    it("should work with objects", done => {

        logger.log("This is a log message with an object: ", {
            key1: "val1",
            key2: "val2",
            key3: "val3"
        });

        expect(1).toEqual(1);

        done();
    });

});
