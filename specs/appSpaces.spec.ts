import { IApiSpaceAuthInfo, IApiSpaceManager, ILogger, IRestClient } from "../src/interfaces";
import { Logger } from "../src/logger";
import { RestClient } from "../src/restClient";
import { ApiSpaceManager } from "../src/apiSpaceManager";
import { Config } from "./config";

describe("App Space tests", () => {

    var appSpaceManager: IApiSpaceManager;

    beforeEach(done => {
        var logger: ILogger = new Logger();
        var restClient: IRestClient = new RestClient(logger);
        appSpaceManager = new ApiSpaceManager(restClient, Config.getUrlBase());

        // TODO: WHY DO I NEED THIS TIMEOUT ? CHROME LOCKS IF IT ISNT THERE!!!
        setTimeout(() => {
            done();
        },
            0);
    });

    it("Should get a token", done => {

        appSpaceManager.getToken("1969", "stevan.lepojevic")
            .then(token => {
                console.log("getToken() : ", token);
                expect(token).toBeDefined();
                var bits = token.split(".");
                expect(bits.length).toBe(3);
                // var header = JSON.parse(atob(bits[0]));
                var payload = JSON.parse(atob(bits[1]));
                expect(payload.exp).toBeDefined();
                // var signature = bits[2];
                done();
            })
            .catch(error => {
                fail(error.message);
            });

    });

    it("Should create an app space", done => {
        appSpaceManager.getToken("1969", "stevan.lepojevic")
            .then(token => {
                console.log("getToken() : ", token);
                return appSpaceManager.createApiSpace(token, "Test App Space");
            })
            .then(result => {
                console.log("createAppSpace() : ", result);
                expect(result).toBeDefined();
                expect(result.createdOn).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.name).toBe("Test App Space");
                expect(result.updatedOn).toBeDefined();
                done();
            })
            .catch(error => {
                fail(error.message);
            });

    });

    it("Should update app space AUTH settings", done => {

        var _token: string;

        appSpaceManager.getToken("1969", "stevan.lepojevic")
            .then(token => {
                console.log("getToken() : ", token);
                _token = token;
                return appSpaceManager.createApiSpace(token, "Test App Space");
            })
            .then(appSpace => {
                console.log("createAppSpace() : ", appSpace);

                var authInfo: IApiSpaceAuthInfo = {
                    audience: "*",
                    idClaim: "sub",
                    issuer: "https://sitf.co.uk",
                    sharedSecret: "205BD61A-B86E-4A3D-9023-F2B1880A0F8F",
                };

                return appSpaceManager.updateAuth(_token, appSpace.id, authInfo);
            })
            .then(result => {
                console.log("updateAuth() : ", result);
                expect(result).toBeDefined();
                expect(result.audience).toBe("*");
                expect(result.idClaim).toBe("sub");
                expect(result.issuer).toBe("https://sitf.co.uk");
                expect(result.sharedSecret).toBe("205BD61A-B86E-4A3D-9023-F2B1880A0F8F");
                done();
            })
            .catch(error => {
                fail(error.message);
            });
    });

    it("Should fail to create with invalid token", done => {

        appSpaceManager.createApiSpace("invalid", "Test App Space")
            .then(result => {
                fail("should not succeed");
            })
            .catch(error => {
                console.log("createAppSpace() : ", error);
                expect(error).toBeDefined();
                done();
            });
    });


});
