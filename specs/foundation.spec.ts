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
        });
    });

    it("should return a version number", done => {
        expect(Foundation.version).toBeDefined();
        expect(foundation).toBeDefined();
        done();
    });

    describe("Foundation tests / deep links", () => {
        it("should get deep link url", async done => {
            const inputs = [JSON.stringify({ trackingUrl: "tUrl", url: "url" }), { trackingUrl: "tUrl", url: "url" }];
            inputs.forEach(async input => {
                foundation["_get"] = (url) => Promise.resolve();
                let obj = {};
                obj["dd_deepLink"] = input;
                let result = await foundation.handleLink(obj);
                expect(result).toBe("url");
                done();
            });
        });
    
        it("should call deep link trackingUrl", async done => {
            const inputs = [JSON.stringify({ trackingUrl: "tUrl", url: "url" }), { trackingUrl: "tUrl", url: "url" }];
            inputs.forEach(async input => {
                let trackingUrl;
                foundation["_get"] = (url) => {
                    trackingUrl = url;
                    return Promise.resolve();
                };
                let obj = {};
                obj["dd_deepLink"] = input;
                await foundation.handleLink(obj);
                expect(trackingUrl).toBe("tUrl");
            })
            done();
        });
        
        it("should call deep link trackingUrl in additionalData", async done => {
            let trackingUrl;
            foundation["_get"] = (url) => {
                trackingUrl = url;
                return Promise.resolve();
            };
            await foundation.handleLink({ additionalData: { dd_deepLink: { trackingUrl: "tUrl", url: "url" }}});
            expect(trackingUrl).toBe("tUrl");
            done();
        });

        it("should handle payload without dd_deepLink", async done => {
            let url;
            let obj = {};
            await foundation.handleLink(obj);
            expect(url).toBeUndefined();
            done();
        });

        it("should handle payload with partial dd_deepLink", async done => {
            let url;
            let obj = JSON.stringify({ url: "url" });
            await foundation.handleLink(obj);
            expect(url).toBeUndefined();
            done();
        });
    });
});
