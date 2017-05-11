import {
    NetworkManager
} from "../src/networkManager";

import {
    ISessionManager,
    IWebSocketManager,
    ISessionInfo,
    INetworkManager
} from "../src/interfaces";

/**
 * 
 */
describe("networkManager tests", () => {


    let sessionManager: ISessionManager;
    let socketManager: IWebSocketManager;
    let networkManager: INetworkManager;


    /**
     * Mock MockSessionmanager - we just need getValidAuthHeader
     */
    class MockSessionmanager implements ISessionManager {

        private _sessionInfo: ISessionInfo = {
            session: {
                createdOn: new Date().toISOString(),
                deviceId: "2ED8EA5F-19B8-45AA-9CD1-32C517B1553B",
                expiresOn: new Date().toISOString(),
                id: "A78B9D3A-B9B4-4612-BE8A-4221A198DD62",
                isActive: true,
                platform: "Web",
                platformVersion: "1.2.3",
                profileId: "unitTestUser",
                sdkType: "SDK",
                sdkVersion: "1.2.3",
                sourceIp: "127.0.0.1",
            },
            token: "1.2.3",
        };

        get sessionInfo(): ISessionInfo { return this._sessionInfo; }
        public getValidToken(): Promise<string> { return Promise.resolve(this._sessionInfo.token); }
        public startSession(): Promise<ISessionInfo> { return Promise.resolve(this._sessionInfo); }
        public endSession(): Promise<boolean> { return Promise.resolve(true); }
        public ensureSession(): Promise<ISessionInfo> { return Promise.resolve(this.sessionInfo); }
    }

    class MockWebSocketManager implements IWebSocketManager {
        public connect(): Promise<boolean> { return Promise.resolve(true); };
        public disconnect(): Promise<boolean> { return Promise.resolve(true); };
        public isConnected(): boolean { return false; };
        public hasSocket(): boolean { return false; };
        public send(data: any): void { console.log("send"); };
        public generateInterval(k: number): number { return 1000; };
    }

    beforeEach(done => {
        sessionManager = new MockSessionmanager();
        socketManager = new MockWebSocketManager();
        networkManager = new NetworkManager(sessionManager, socketManager);
        done();
    });


    /**
     * 
     */
    it("should GET the active session", done => {
        var session = networkManager.session;
        expect(session.id).toBe("A78B9D3A-B9B4-4612-BE8A-4221A198DD62");
        done();
    });


    /**
     * 
     */
    it("should end a session", done => {

        networkManager.startSession()
            .then(sessionInfo => {
                expect(sessionInfo.session.id).toBe("A78B9D3A-B9B4-4612-BE8A-4221A198DD62");
                done();
            });
    });


    /**
     * 
     */
    it("should stop a session", done => {

        spyOn(socketManager, "disconnect").and.callThrough();
        spyOn(sessionManager, "endSession").and.callThrough();

        networkManager.endSession()
            .then(sessionInfo => {
                expect(socketManager.disconnect).toHaveBeenCalled();
                expect(sessionManager.endSession).toHaveBeenCalled();
                done();
            });
    });

    /**
     * 
     */
    it("should restart a session", done => {

        spyOn(socketManager, "connect").and.callThrough();
        spyOn(socketManager, "disconnect").and.callThrough();
        spyOn(sessionManager, "startSession").and.callThrough();

        networkManager.restartSession()
            .then(sessionInfo => {
                expect(socketManager.disconnect).toHaveBeenCalled();
                expect(sessionManager.startSession).toHaveBeenCalled();
                expect(socketManager.connect).toHaveBeenCalled();
                done();
            });
    });

});
