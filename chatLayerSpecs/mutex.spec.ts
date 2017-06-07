import { Mutex } from "../chatLayer/src/mutex"

/**
 * 
 */
describe("Mutex tests", () => {

    let mutex: Mutex;

    function incWithPromise(x: number): Promise<number> {
        return Promise.resolve(++x);
    }

    function decWithPromise(x: number): Promise<number> {
        return Promise.resolve(--x);
    }

    function doStuff(x: number): Promise<number> {
        return incWithPromise(x)
            .then(result => {
                return decWithPromise(result);
            })
    }

    function doStuff2(x: number): Promise<number> {
        return mutex.runExclusive(() => {
            return incWithPromise(x)
                .then(result => {
                    return decWithPromise(result);
                });
        })
    }


    /**
     * 
     */
    beforeEach(() => {
        mutex = new Mutex();
    });


    /**
     * 
     */
    it("should work", done => {

        mutex.runExclusive<number>(() => 10)
            .then(value => {
                expect(value).toBe(10);
                done();
            });
    });


    // it("should be exclusive", done => {
    //     let flag = false;

    //     mutex.runExclusive(() => new Promise(
    //         resolve => setTimeout(
    //             () => {
    //                 flag = true;
    //                 resolve();
    //             }, 50
    //         )
    //     ));

    //     return mutex.runExclusive(() => {
    //         expect(flag).toBeTruthy();
    //         done();
    //     });
    // });

    // it("should be exclusive", done => {
    //     let flag = false;

    //     mutex.runExclusive(() => new Promise((resolve, reject) => {

    //         setTimeout(() => {
    //             flag = true;
    //             reject();
    //         }, 1000);
    //     }));

    //     return mutex.runExclusive(() => {
    //         expect(flag).toBeTruthy();
    //         done();
    //     });
    // });


    it("should doStuff ...", done => {

        let val = 5;
        mutex.runExclusive(() => {
            return doStuff(val);
        }).then(result => {
            expect(result).toBe(5);
            done();
        });

    });


    it("should doStuff2 ...", done => {

        let val = 5;

        doStuff2(val)
            .then(result => {
                expect(result).toBe(5);
                done();
            });

    });


});