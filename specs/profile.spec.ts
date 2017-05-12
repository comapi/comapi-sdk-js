import { Foundation } from "../src/foundation";
import { Config } from "./config";


/**
 * 
 */
describe("Profile Tests", () => {
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
                comapiConfig.apiSpaceId = appSpaceId;
                done();
            })
            .catch(error => {
                fail(error.message);
            });

    });

    beforeEach(done => {

        localStorage.removeItem("comapi.session");

        Foundation.initialise(comapiConfig)
            .then(result => {
                foundation = result;
                return foundation.startSession();
            })
            .then(sessionInfo => {
                console.log("session started", sessionInfo);
                done();
            })
            .catch(error => {
                fail("beforeEach failed: " + error.message);
                done();
            });
    });


    /**
     * Basic end-to-end test ...
     */
    it("should get users profile", done => {

        foundation.services.profile.getMyProfile()
            .then(profile => {
                expect(profile).toBeDefined();
                expect(profile.id).toBeDefined();
                done();
            });

    });


    /**
     * sad path eTag
     */
    it("should update my profile", done => {

        foundation.services.profile.getMyProfile()
            .then(profile => {
                profile.key1 = "value1";
                return foundation.services.profile.updateMyProfile(profile);
            })
            .then(profile => {
                expect(profile).toBeDefined();
                expect(profile.key1).toBeDefined();
                expect(profile.key1).toBe("value1");
                done();
            });

    });

    /**
     * 
     */
    it("should allow querying", done => {

        foundation.services.profile.queryProfiles()
            .then(result => {
                expect(result.response.length).toBeDefined();
                done();
            });

    });


});

