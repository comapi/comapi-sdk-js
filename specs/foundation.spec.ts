import { Foundation } from "../src/foundation";
import { Config } from "./config";


describe("Foundation tests", () => {

    let foundation: Foundation;

    let comapiConfig = {
        apiSpaceId: undefined,
        authChallenge: Config.authChallenge,
        logRetentionHours: 1,
        urlBase: Config.getUrlBase(),
        webSocketBase: Config.getWebSocketBase(),
    };

    beforeEach(done => {

        localStorage.removeItem("comapi.session");

        Foundation.initialise(comapiConfig).then(result => {
            foundation = result;
            done();
        });
    });

    /**
     * 
     */
    it("should return a version number", done => {
        expect(Foundation.version).toBeDefined();
        done();
    });

});
