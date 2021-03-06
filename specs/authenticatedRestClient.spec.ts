import { IComapiConfig } from "../src/interfaces";
import { Logger } from "../src/logger";
import { Config } from "./config";
import { AuthenticatedRestClient } from "../src/authenticatedRestClient";
import { SessionManager } from "../src/sessionManager";
import { WebSocketManager } from "../src/webSocketManager";
import { NetworkManager } from "../src/networkManager";
import { EventManager } from "../src/eventManager";
import { LocalStorageData } from "../src/localStorageData";
import { RestClient } from "../src/restClient";
import { FoundationRestUrls } from "../src/urlConfig";
import { EventMapper } from "../src/eventMapper";

/**
 * 
 */
describe("AUTHENTICATED REST API TESTS", () => {

    /**
     * Helper for testing all the permeutations of prettyDate filter 
     */
    function dateAdd(date, interval, units) {
        let ret = new Date(date); // don't change original date
        switch (interval.toLowerCase()) {
            case "year": ret.setFullYear(ret.getFullYear() + units); break;
            case "quarter": ret.setMonth(ret.getMonth() + 3 * units); break;
            case "month": ret.setMonth(ret.getMonth() + units); break;
            case "week": ret.setDate(ret.getDate() + 7 * units); break;
            case "day": ret.setDate(ret.getDate() + units); break;
            case "hour": ret.setTime(ret.getTime() + units * 3600000); break;
            case "minute": ret.setTime(ret.getTime() + units * 60000); break;
            case "second": ret.setTime(ret.getTime() + units * 1000); break;
            default: ret = undefined; break;
        }
        return ret;
    }

    /**
     * 
     */
    let comapiConfig: IComapiConfig = {
        apiSpaceId: "9308C588-CA74-42A1-A2AF-0FB9B02DA7A3",
        authChallenge: Config.authChallenge,
        foundationRestUrls: new FoundationRestUrls(),
        logRetentionHours: 1,
        urlBase: Config.getUrlBase(),
        webSocketBase: Config.getWebSocketBase(),
    };

    let authenticatedRestClient: AuthenticatedRestClient;
    let sessionManager: SessionManager;
    /**
     * 
     */
    beforeEach(done => {

        let localStorageData = new LocalStorageData(undefined);
        let eventManager = new EventManager();
        let logger = new Logger(eventManager, localStorageData);
        let restClient = new RestClient(logger);
        sessionManager = new SessionManager(logger, restClient, localStorageData, comapiConfig);

        let eventMapper = new EventMapper();
        let webSocketManager = new WebSocketManager(logger, localStorageData, comapiConfig, sessionManager, eventManager, eventMapper);

        let networkManager = new NetworkManager(logger, sessionManager, webSocketManager);

        authenticatedRestClient = new AuthenticatedRestClient(logger, restClient, networkManager);

        sessionManager.startSession()
            .then(sessionInfo => {
                console.log("session created", sessionInfo);
                done();
            })
            .catch(error => {
                fail("beforeEach failed: " + error.message);
            });
    });

    /**
     * 
     */
    it("should get a new token on the fly if needed", done => {

        let expired = dateAdd(new Date(), "hour", -1).toISOString();
        sessionManager.sessionInfo.session.expiresOn = expired;

        // just call the refresh method as it validates the auth token

        let headers = {
            "Content-Type": "application/json"
        };

        authenticatedRestClient.get("http://localhost:6971/refresh", headers)
            .then(result => {
                done();
            });

    });

});
