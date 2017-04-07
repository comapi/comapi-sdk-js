import { Utils, DoUntilTestFunction, DoUntilOperationFunction } from "../src/utils";

/**
 * 
 */
describe("Promise tests", () => {

    var originalTimeout;

    /**
     * 
     */
    beforeEach(() => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;

    });

    /**
     * 
     */
    afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });


    /**
     * 
     */
    it("should call some async function on an array of data", done => {

        function asyncMethod(val: number) {
            console.log(`asyncMethod(${val})`);
            return Promise.resolve(val);
        }

        let data: number[] = [0, 1, 2, 3, 4, 5];

        let sum = 0;
        Utils.eachSeries(data, (val: number) => {
            return asyncMethod(val).then(val => {
                sum += val;
                return sum;
            });
        }).then(result => {
            expect(result).toBe(15);
            done();
        })
    });


    /**
     * 
     */
    it("should call in series", done => {

        var executing = false;
        /**
         * @param val 
         */
        function asyncMethod2(val: number) {
            return new Promise((resolve, reject) => {
                executing = true;
                setTimeout(function () {
                    console.log(`asyncMethod(${val})`);
                    executing = false;
                    resolve();
                }, val * 10);
            });
        }

        let data: number[] = [5, 4, 3, 2, 1, 0];

        Utils.eachSeries(data, (val: number) => {
            expect(executing).toBe(false);
            return asyncMethod2(val);
        }).then(result => {
            done();
        })
    });

    it("should generically repeat something until some condition is met", done => {

        let operationMethod: DoUntilOperationFunction = function (data: any): Promise<any> {
            return new Promise((resolve, reject) => {
                setTimeout(function () {
                    console.log(`operationMethod(${data})`)
                    resolve(data + 1);
                }, 10);
            });
        }

        let compareFunc: DoUntilTestFunction = function (data: any): boolean {
            console.log(`compareFunc(${data})`)
            return data < 5;
        }

        Utils.doUntil(operationMethod, compareFunc, 0)
            .then((val) => {
                expect(val).toBe(5);
                done();
            });
    });

    /**
     * Speculative tests to see if I can dynamically detect a promise being returned ...
     */
    type AsyncEventHandlerFunction = (data: any) => Promise<any>;
    type EventHandlerFunction = (data: any) => void;

    /**
     * 
     */
    it("should dynamically determine whether a promise has been returned", done => {

        let handler1: (EventHandlerFunction | AsyncEventHandlerFunction) = function (x): any {
            console.log(`handler1(${x})`);
        }

        let handler2: (EventHandlerFunction | AsyncEventHandlerFunction) = function (x): Promise<any> {
            console.log(`handler2(${x})`);
            return Promise.resolve(x);
        }

        let result1 = handler1(1);
        expect(result1 instanceof Promise).toBe(false);

        let result2 = handler2("hello");
        expect(result2 instanceof Promise).toBe(true);

        (<Promise<any>>result2).then(val => {
            expect(val).toBe("hello");
            done();
        });
    });

    /**
     * 
     */
    it("should dynamically determine whether a promise has been returned - array option", done => {

        let handler1: (EventHandlerFunction | AsyncEventHandlerFunction) = function (x): any {
            console.log(`handler1(${x})`);
        }

        let handler2: (EventHandlerFunction | AsyncEventHandlerFunction) = function (x): Promise<any> {
            console.log(`handler2(${x})`);
            return Promise.resolve(x);
        }

        let handlers: (EventHandlerFunction | AsyncEventHandlerFunction)[] = [];

        handlers.push(handler1);
        handlers.push(handler2);

        let result1 = handlers[0](1);
        expect(result1 instanceof Promise).toBe(false);

        let result2 = handlers[1]("hello");
        expect(result2 instanceof Promise).toBe(true);

        (<Promise<any>>result2).then(val => {
            expect(val).toBe("hello");
            done();
        });
    });
});
