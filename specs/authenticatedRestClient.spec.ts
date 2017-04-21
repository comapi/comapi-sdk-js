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

/**
 * 
 */
describe("AUTHENTICATED REST API TESTS", () => {

    /**
     * Helper for testing all the permeutations of prettyDate filter 
     */
    function dateAdd(date, interval, units) {
        var ret = new Date(date); // don't change original date
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
    var comapiConfig: IComapiConfig = {
        apiSpaceId: undefined,
        authChallenge: Config.authChallenge,
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

        let localStorageData = new LocalStorageData();
        var eventManager = new EventManager();
        var data = new LocalStorageData();
        var logger = new Logger(eventManager, data);
        var restClient = new RestClient(logger);

        sessionManager = new SessionManager(logger, restClient, data, comapiConfig);

        let webSocketManager = new WebSocketManager(logger, localStorageData, comapiConfig, sessionManager, eventManager);

        let networkManager = new NetworkManager(sessionManager, webSocketManager);


        authenticatedRestClient = new AuthenticatedRestClient(logger, networkManager);

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

        var expired = dateAdd(new Date(), "hour", -1).toISOString();
        sessionManager.sessionInfo.session.expiresOn = expired;

        // just call the refresh method as it validates the auth token

        let headers = {
            "Content-Type": "application/json"
        };

        authenticatedRestClient.get("http://localhost:6969/refresh", headers)
            .then(result => {
                done();
            });

    });

});
