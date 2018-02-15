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
    it("should get users profile with getMyProfile()", done => {

        foundation.services.profile.getMyProfile()
            .then(profile => {
                expect(profile).toBeDefined();
                expect(profile.id).toBe(Config.testUserProfileId);
                done();
            });
    });

    /**
     * Basic end-to-end test ...
     * NOTE the generic version returns the http response so we can examine the headers for the returned eTag
     */
    it("should get users profile with getProfile()", done => {

        foundation.services.profile.getProfile(Config.testUserProfileId)
            .then(result => {
                expect(result).toBeDefined();
                expect(result.response).toBeDefined();
                expect(result.response.id).toBe(Config.testUserProfileId);
                done();
            });
    });

    /**
     * 
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
    it("should patch my profile using patchMyProfile()", done => {

        foundation.services.profile.getMyProfile()
            .then(profile => {
                return foundation.services.profile.patchMyProfile({
                    patchKey1: 1,
                    patchKey2: 2,
                    patchKey3: 3,
                });
            })
            .then(patched => {
                expect(patched).toBeDefined();
                expect(patched.patchKey1).toBe(1);
                expect(patched.patchKey2).toBe(2);
                expect(patched.patchKey3).toBe(3);
                done();
            });
    });

    /**
     * 
     */
    it("should patch my profile using patchProfile()", done => {

        foundation.services.profile.getMyProfile()
            .then(profile => {
                return foundation.services.profile.patchProfile(Config.testUserProfileId, {
                    patchKey1: 1,
                    patchKey2: 2,
                    patchKey3: 3,
                });
            })
            .then(result => {
                expect(result).toBeDefined();
                expect(result.response.patchKey1).toBe(1);
                expect(result.response.patchKey2).toBe(2);
                expect(result.response.patchKey3).toBe(3);
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

