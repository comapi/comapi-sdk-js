import { Foundation } from "../src/foundation";
import { IComapiConfig, LogPersistences } from "../src/interfaces";
import { Config } from "./config";


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

    beforeEach(done => {

        localStorage.removeItem("comapi.session");

        Foundation.initialise(comapiConfig).then(result => {
            foundation = result;
            done();
        }).catch(done.fail);
    });

    it("should return a version number", () => {
        expect(Foundation.version).toBeDefined();
        expect(foundation).toBeDefined();
    });

    describe("Foundation tests / deep links", () => {
        it("should get deep link url", async () => {
            const inputs = [JSON.stringify({ trackingUrl: "tUrl", url: "url" }), { trackingUrl: "tUrl", url: "url" }];
            inputs.forEach(async input => {
                foundation["_get"] = (url) => Promise.resolve();
                let obj = {};
                obj["dd_deepLink"] = input;
                let result = await foundation.handlePush(obj);
                expect(result).toEqual({url: "url", ddOriginated: false});
            }
        });
    
        it("should call deep link trackingUrl", async () => {
            const inputs = [JSON.stringify({ trackingUrl: "tUrl", url: "url" }), { trackingUrl: "tUrl", url: "url" }];
            for (const input of inputs) {
                let trackingUrl;
                foundation["_get"] = (url) => {
                    trackingUrl = url;
                    return Promise.resolve();
                };
                let obj = {};
                obj["dd_deepLink"] = input;
                await foundation.handlePush(obj);
                expect(trackingUrl).toBe("tUrl");
            }
        });
        
        it("should call deep link trackingUrl in additionalData", async () => {
            let trackingUrl;
            foundation["_get"] = (url) => {
                trackingUrl = url;
                return Promise.resolve();
            };
            await foundation.handlePush({ additionalData: { dd_deepLink: { trackingUrl: "tUrl", url: "url" }}});
            expect(trackingUrl).toBe("tUrl");
        });

        it("should handle payload without dd_deepLink", async () => {
            let url;
            let obj = {};
            await foundation.handlePush(obj);
            expect(url).toBeUndefined();
        });

        it("should handle payload with partial dd_deepLink", async () => {
            let url;
            let obj = JSON.stringify({ url: "url" });
            await foundation.handlePush(obj);
            expect(url).toBeUndefined();
        });

        it("should read dd-originated flag from payload", async () => {
            foundation["_get"] = (url) => Promise.resolve();
            let result = await foundation.handlePush({ "dd-originated": true, dd_deepLink: { trackingUrl: "tUrl", url: "url" } });
            expect(result.ddOriginated).toBe(true);
        });

        it("should read dd-originated flag from payload without deep link", async () => {
            let result = await foundation.handlePush({ "dd-originated": true });
            expect(result.ddOriginated).toBe(true);
        });

        it("should default dd-originated to false when not present", async () => {
            let result = await foundation.handlePush({ dd_deepLink: { url: "url" } });
            expect(result.ddOriginated).toBe(false);
        });
    });
});
