import { ISessionManager, ISessionInfo } from "../src/interfaces";
import { RestClient } from "../src/restClient";
import { Logger } from "../src/logger";

/**
 * 
 */
describe("REST API 401 retry tests", () => {

    let restClient: RestClient;

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
    class MockSessionManager implements ISessionManager {

        private _sessionInfo: ISessionInfo = {
            expiry: "",
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

        get sessionInfo(): ISessionInfo { return this._sessionInfo; }
        get expiry(): string { return null; }
        get isAuthenticated(): boolean { return true; }
        public getValidToken(): Promise<string> { return Promise.resolve(this._sessionInfo.token); }
        public startSession(): Promise<ISessionInfo> { return Promise.resolve(this.sessionInfo); }
        public endSession(): Promise<boolean> { return Promise.resolve(true); }
        public ensureSession(): Promise<ISessionInfo> { return Promise.resolve(this.sessionInfo); }
    }

    let sessionManager: MockSessionManager;

    beforeEach(done => {
        let logger = new Logger();
        sessionManager = new MockSessionManager();
        restClient = new RestClient(logger, sessionManager);
        done();
    });


    /**
     * 
     * 
     * 
     */
    it("should handle retry 401's", done => {

        spyOn(sessionManager, "startSession").and.callThrough();

        restClient.post("http://localhost:6969/testUnauthorized", headers, data)
            .then(result => {

                expect(sessionManager.startSession).toHaveBeenCalled();
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
