import "reflect-metadata";

import { INetworkManager, ISessionInfo, ISession } from "../src/interfaces";
import { RestClient } from "../src/restClient";
import { AuthenticatedRestClient } from "../src/authenticatedRestClient";
import { Logger } from "../src/logger";

/**
 * 
 */
describe("REST API 401 retry tests", () => {

    let restClient: AuthenticatedRestClient;

    let data = {
        key1: "val1",
        key2: "val2",
        key3: "val3"
    };

    let headers = {
        "Content-Type": "application/json"
    };

    /**
     * Mock MockSessionmanager - we just need getValidAuthHeader
     */
    class MockNetworkManager implements INetworkManager {

        private _sessionInfo: ISessionInfo = {
            session: {
                createdOn: "",
                deviceId: "",
                expiresOn: "",
                id: "",
                isActive: true,
                platform: "",
                platformVersion: "",
                profileId: "",
                sdkType: "",
                sdkVersion: "",
                sourceIp: "",
            },
            token: "1.2.3",
        };

        get session(): ISession { return this._sessionInfo.session; }
        // an invalid token
        public getValidToken(): Promise<string> { return Promise.resolve(""); }
        public startSession(): Promise<ISessionInfo> { return Promise.resolve(this._sessionInfo); }
        public restartSession(): Promise<ISessionInfo> { return Promise.resolve(this._sessionInfo); }
        public endSession(): Promise<boolean> { return Promise.resolve(true); }
        public ensureSession(): Promise<ISessionInfo> { return Promise.resolve(this._sessionInfo); }
        public ensureSessionAndSocket(): Promise<ISessionInfo> { return Promise.reject<ISessionInfo>({ message: "Not implemented" }); }
    }

    let networkManager: MockNetworkManager;

    beforeEach(done => {
        let logger = new Logger();
        networkManager = new MockNetworkManager();
        let rc = new RestClient(logger);
        restClient = new AuthenticatedRestClient(logger, rc, networkManager);
        done();
    });


    /**
     * 
     * 
     * 
     */
    it("should handle retry 401's", done => {

        spyOn(networkManager, "restartSession").and.callThrough();

        restClient.post("http://localhost:6971/testUnauthorized", headers, data)
            .then(result => {

                expect(networkManager.restartSession).toHaveBeenCalled();
                expect(result.statusCode).toBe(204);

                done();
            })
            .catch(result => {

                console.log(JSON.stringify(result, null, 4));

                fail("should have worked");
                done();
            });


    });


});
