import { Foundation } from "../src/foundation";
import { Environment } from "../src/interfaces";
import { Config } from "./config";
import { Utils } from "../src/utils";


describe("Utils userAgent tests", () => {

    it("should handle chrome user agent strings", done => {

        let userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36";
        let browserInfo = Utils.getBrowserInfo(userAgent);

        expect(browserInfo.name).toBe("Chrome");
        expect(browserInfo.version).toBe("49");

        done();
    });

    it("should handle firefox user agent strings", done => {

        let userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0";
        let browserInfo = Utils.getBrowserInfo(userAgent);

        expect(browserInfo.name).toBe("Firefox");
        expect(browserInfo.version).toBe("42");

        done();
    });

    it("should handle safari user agent strings", done => {

        let userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/601.5.17 (KHTML, like Gecko) Version/9.1 Safari/601.5.17";
        let browserInfo = Utils.getBrowserInfo(userAgent);

        expect(browserInfo.name).toBe("Safari");
        expect(browserInfo.version).toBe("9");

        done();
    });

    it("should handle I.E. user agent strings", done => {

        let userAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729;" +
            " .NET CLR 3.0.30729; Media Center PC 6.0; InfoPath.3; .NET4.0C; .NET4.0E; Zune 4.7; rv:11.0) like Gecko";
        let browserInfo = Utils.getBrowserInfo(userAgent);

        expect(browserInfo.name).toBe("IE");
        expect(browserInfo.version).toBe("11");

        done();
    });


    it("should handle opera user agent strings", done => {

        let userAgent = "Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16";
        let browserInfo = Utils.getBrowserInfo(userAgent);

        expect(browserInfo.name).toBe("Opera");
        expect(browserInfo.version).toBe("12");

        done();
    });

});


/**
 * 
 */
describe("Foundation Auth Tests", () => {
    let foundation: Foundation;

    let comapiConfig = {
        apiSpaceId: undefined,
        authChallenge: Config.authChallenge,
        logRetentionHours: 1,
        urlBase: Config.getUrlBase(),
        webSocketBase: Config.getWebSocketBase(),
    };

    beforeAll(done => {
        // Create a new app space for this test ...
        Config.createAppSpace()
            .then(appSpaceId => {
                console.log("created app space for test: " + appSpaceId);
                comapiConfig.apiSpaceId = appSpaceId;
                done();
            })
            .catch(error => {
                fail(error.message);
            });

    });


    beforeEach(done => {

        // just in case we don't adopt some session from another test ...
        localStorage.removeItem("comapi.session");

        Foundation.initialise(comapiConfig).then(result => {
            foundation = result;
            done();
        });
    });

    /**
     * Clear out any sessions (ignoring errors)
     */
    afterEach(done => {
        foundation.endSession()
            .then(() => {
                done();
            })
            .catch(() => {
                done();
            });
    });

    /**
     *
     */
    it("should fail if stopping a non-existent authenticated session", done => {

        foundation.endSession()
            .catch(() => {
                expect(true).toBeTruthy();
                done();
            });

    });

    /**
     * 
     */
    it("should start a new authenticated session", done => {

        foundation.startSession()
            .then(session => {
                console.log("startSession() resolved with: ", JSON.stringify(session, null, 4));
                expect(session).toBeDefined();
                done();
            }).catch(error => {
                fail("startSession() failed with:" + JSON.stringify(error, null, 4));
                done();
            });

    });

    /**
     * 
     */
    it("should set FCM push details on an active session", done => {
        // foundation.startSession()
        //    .then(sessionInfo => {

        foundation.device.setFCMPushDetails("myPackageName", "3A0531EE-0E24-4B9D-9C4A-DC90F59854853A0531EE-0E24-4B9D-9C4A-DC90F59854853A0531EE-0E24-4B9D-9C4A-DC90F5985485")
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                done();
            });

        //   }).catch(error => {
        //       console.log("startSession() failed with:", JSON.stringify(error, null, 4));
        //   });

    });

    /**
     * 
     */
    it("should set APNS push details on an active session", done => {
        // foundation.startSession()
        //    .then(sessionInfo => {

        foundation.device.setAPNSPushDetails("myBundleId", Environment.development, "3A0531EE-0E24-4B9D-9C4A-DC90F59854853A0531EE-0E24-4B9D-9C4A-DC90F59854853A0531EE-0E24-4B9D-9C4A-DC90F5985485")
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                done();
            });

        //    }).catch(error => {
        //        console.log("startSession() failed with:", JSON.stringify(error, null, 4));
        //    });

    });


    /**
     * 
     */
    it("should delete push details on an active session", done => {
        // foundation.startSession()
        //    .then(sessionInfo => {

        foundation.device.removePushDetails()
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                done();
            });

        //    }).catch(error => {
        //        console.log("startSession() failed with:", JSON.stringify(error, null, 4));
        //    });;

    });


    /**
     * 
     */
    it("should set facebook state on an active session", done => {
        // foundation.startSession()
        //    .then(sessionInfo => {

        foundation.channels.createFbOptInState({})
            .then(result => {
                expect(result.response).toBeDefined();
                done();
            });

        //    }).catch(error => {
        //        console.log("startSession() failed with:", JSON.stringify(error, null, 4));
        //    });;

    });

    /**
     * 
     */
    it("should start and stop an authenticated session", done => {

        foundation.startSession()
            .then(session => {

                expect(session).toBeDefined();

                foundation.endSession()
                    .then(() => {
                        expect(true).toBeTruthy();
                        done();
                    });

            });

    });

});
