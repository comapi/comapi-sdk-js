import { Config } from "./config";
import { Foundation } from "../src/foundation";
import { IComapiConfig, IContentData } from "../src/interfaces";

import { ContentData } from "../src/contentData";

/**
 * 
 */
describe("contentData tests", () => {

    let foundation: Foundation;

    let comapiConfig: IComapiConfig = {
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

    it("should upload base64 data", done => {
        let contentData: IContentData = ContentData.createFromBase64("iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==", "image.png", "image/png");

        foundation.services.appMessaging.uploadContent(contentData)
            .then(result => {
                expect(result).toBeDefined();
                done();
            });
    });

});
