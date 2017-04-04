import { ComapiConfig } from "../src/comapiConfig";
import { IAuthChallengeOptions } from "../src/interfaces";
/**
 * 
 */
describe("Comapi Options tests", () => {

    /**
     * 
     */
    it("should build an IComapiConfig object with sensible defaults", done => {

        function myAuthChallenge(options: IAuthChallengeOptions, answerAuthenticationChallenge: Function) {
            console.log("myAuthChallenge");
        };

        let comapiConfig = new ComapiConfig()
            .withApiSpace("223597FA-C17F-4D11-83A4-C1690B7A63B3")
            .withAuthChallenge(myAuthChallenge);

        expect(comapiConfig.apiSpaceId).toBe("223597FA-C17F-4D11-83A4-C1690B7A63B3");

        expect(comapiConfig.authChallenge).toBeDefined();
        expect(comapiConfig.urlBase).toBe("https://api.comapi.com");
        expect(comapiConfig.webSocketBase).toBe("wss://api.comapi.com");

        done();
    });


    /**
     * 
     */
    it("should build an IComapiConfig object with overriden values", done => {

        function myAuthChallenge(options: IAuthChallengeOptions, answerAuthenticationChallenge: Function) {
            console.log("myAuthChallenge");
        }

        let comapiConfig = new ComapiConfig()
            .withApiSpace("223597FA-C17F-4D11-83A4-C1690B7A63B3")
            .withAuthChallenge(myAuthChallenge)
            .withLogRetentionTime(5)
            .withUrlBase("https://stage-api.comapi.com")
            .withWebSocketBase("wss://stage-api.comapi.com");

        expect(comapiConfig.apiSpaceId).toBe("223597FA-C17F-4D11-83A4-C1690B7A63B3");

        expect(comapiConfig.authChallenge).toBeDefined();
        expect(comapiConfig.urlBase).toBe("https://stage-api.comapi.com");
        expect(comapiConfig.webSocketBase).toBe("wss://stage-api.comapi.com");
        expect(comapiConfig.logRetentionHours).toBe(5);

        done();
    });


});
