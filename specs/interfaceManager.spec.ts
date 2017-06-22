import { Foundation } from "../src/foundation";
import { IComapiConfig, LogPersistences, ISessionManager, ISessionInfo, ILogger, LogLevels } from "../src/interfaces";
import { Config } from "./config";
import { InterfaceManager } from "../src/interfaceManager";

import { initInterfaces } from "../src/inversify.config";

describe("Foundation tests", () => {

    let foundation: Foundation;

    let comapiConfig: IComapiConfig = {
        apiSpaceId: undefined,
        authChallenge: Config.authChallenge,
        logPersistence: LogPersistences.IndexedDB,
        logRetentionHours: 1,
        urlBase: Config.getUrlBase(),
        webSocketBase: Config.getWebSocketBase(),
    };


    afterEach(() => {
        initInterfaces();
    });

    /**
     * 
     */
    it("should allow replacement of session interface", done => {

        class MockSessionManager implements ISessionManager {

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
            public startSession(): Promise<ISessionInfo> { return Promise.resolve(this.sessionInfo); }
            public endSession(): Promise<boolean> { return Promise.resolve(true); }
            public ensureSession(): Promise<ISessionInfo> { return Promise.resolve(this.sessionInfo); }
        }
        InterfaceManager.ISessionManager = new MockSessionManager();

        Foundation.initialise(comapiConfig).then(result => {
            foundation = result;
            return foundation.startSession();
        })
            .then(session => {
                expect(session.profileId).toBe("unitTestUser");
                done();
            });
    });

    /**
     * want to get the existing logger and extend it
     */
    it("should allow overide of log interface", done => {

        class OverriddenLogger implements ILogger {
            public logLevel: LogLevels;

            constructor(public logger: ILogger) { }

            public log(message: String, data?: Object): Promise<boolean> {
                return this.logger.log(message, data);
            }

            public warn(message: String, data?: Object): Promise<boolean> {
                throw new Error("Method not implemented.");
            }

            public error(message: String, data?: Object): Promise<boolean> {
                throw new Error("Method not implemented.");
            }

            public clearLog(): Promise<boolean> {
                throw new Error("Method not implemented.");
            }

            public getLog(): Promise<string> {
                throw new Error("Method not implemented.");
            }
        }

        let stockLogger = InterfaceManager.ILogger;

        expect(stockLogger).toBeDefined();

        let overridden = new OverriddenLogger(stockLogger);

        spyOn(overridden, "log").and.callThrough();

        InterfaceManager.ILogger = overridden;

        Foundation.initialise(comapiConfig).then(result => {
            foundation = result;
            return foundation.logger.log("hello");
        })
            .then(result => {
                expect(result).toBeTruthy();
                expect(overridden.log).toHaveBeenCalledWith("hello");
                done();
            });
    });


});
