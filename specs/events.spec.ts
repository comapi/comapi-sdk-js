import { EventManager } from "../src/eventManager";

/**
 * 
 */
describe("Event tests ...", () => {
    let eventManager: EventManager;

    let data = {
        key1: "val1",
        key2: "val2",
        key3: "val3"
    };


    beforeEach(done => {
        eventManager = new EventManager();
        done();
    });


    it("event handler should register and be called", done => {

        function myHandler(result) {
            expect(result.key1).toBe("val1");
            expect(result.key2).toBe("val2");
            expect(result.key3).toBe("val3");
            done();
        }

        eventManager.subscribeToLocalEvent("TestEvent", myHandler);

        expect(eventManager.isSubscribedToLocalEvent("TestEvent")).toBeTruthy();

        eventManager.publishLocalEvent("TestEvent", data);

    });

    it("event handler should be removable", done => {

        function myHandler() {
            // shouldn't end up in here
            fail("Event handler incorrectly called");
        }

        eventManager.subscribeToLocalEvent("TestEvent", myHandler);

        expect(eventManager.isSubscribedToLocalEvent("TestEvent")).toBeTruthy();

        eventManager.unsubscribeFromLocalEvent("TestEvent", myHandler);

        expect(eventManager.isSubscribedToLocalEvent("TestEvent")).toBeFalsy();

        eventManager.publishLocalEvent("TestEvent", data);

        expect(true).toBe(true);
        done();
    });


});  
