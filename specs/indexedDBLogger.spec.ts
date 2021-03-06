import { ILogEvent, LogLevels } from "../src/interfaces";
import { IndexedDBLogger } from "../src/indexedDBLogger";

/**
 * 
 */
describe("Indexed DB DELETE DATABASE", () => {


    let myIndexedDBLogger: IndexedDBLogger;

    beforeEach(done => {
        let name = ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
        myIndexedDBLogger = new IndexedDBLogger();
        myIndexedDBLogger.name = name;
        done();
    });

    // it("should delete a database", done => {

    //     myIndexedDBLogger.deleteDatabase()
    //         .then(() => {
    //             expect(true).toBe(true);
    //             done();
    //         }).catch(() => {
    //             expect(true).toBe(false);
    //             done();
    //         });

    // }, 30000);

});

/**
 * 
 */
describe("Indexed DB end to end test", () => {
    let myIndexedDBLogger: IndexedDBLogger;

    beforeEach(done => {
        let name = ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
        myIndexedDBLogger = new IndexedDBLogger();
        myIndexedDBLogger.name = name;
        done();
    });

    afterEach(() => {
        myIndexedDBLogger.closeDatabase();
        myIndexedDBLogger.deleteDatabase();
    });


    it("should work ;-)", done => {

        /**
         * 
         */
        function addRecords() {

            let promises: Promise<any>[] = [];

            for (let i = 0; i < 5; i++) {

                let record: ILogEvent = {
                    created: new Date().valueOf(),
                    data: i,
                    logLevel: LogLevels.Debug,
                    message: i.toString(),
                    timestamp: new Date().toISOString()
                };

                promises.push(myIndexedDBLogger.addRecord(record));
            }

            return Promise.all(promises);
        }

        /**
         * 
         */
        function queryRecords() {

            return myIndexedDBLogger.getData(/*get all*/undefined, /*insert the index*/true)
                .then(data => {

                    expect(data.length).toBe(5);

                    for (let i = 0; i < 5; i++) {

                        let o: ILogEvent = data[i] as ILogEvent;

                        expect(o.data).toBe(i);
                        expect(o.message).toBe(i.toString());

                    }

                    return Promise.resolve(data);
                });

        }

        /**
         * 
         */
        function clearRecords(data) {
            return myIndexedDBLogger.clearData();
        }

        /**
         * 
         */
        function verifyEmpty(data) {
            return myIndexedDBLogger.getCount()
                .then(count => {
                    expect(count).toBe(0);
                    return Promise.resolve(true);
                });
        }


        // open
        addRecords()
            .then(queryRecords)
            .then(clearRecords)
            .then(verifyEmpty)
            .then(() => {
                done();
            })
            .catch(error => {
                fail(JSON.stringify(error));
                done();
            });
    });

});






