import { RestClient } from "../src/restClient";
import { ApiSpaceManager } from "../src/apiSpaceManager";
import { IRestClient, IAuthChallengeOptions, IApiSpaceAuthInfo, IApiSpaceManager } from "../src/interfaces";

/**
 * 
 */
export class Config {


    public static testUserProfileId: string = "testUser";

    /**
     * Url base for all Comapi REST API calls
     * "http://192.168.99.100:8000"
     * "http://localhost:6971"
     */
    public static getUrlBase() {

        let urBase: string = localStorage.getItem("urlBase");
        return urBase ? urBase : "http://localhost:6971";
    }

    /**
     * Web Socket base for all Comapi REST API calls
     * "http://192.168.99.100:8000"
     * "http://localhost:6971"
     */
    public static getWebSocketBase() {

        let webSocketBase: string = localStorage.getItem("getWebSocketBase");
        return webSocketBase ? webSocketBase : "ws://localhost:4080";
    }

    /**
     * 
     */
    public static uuid(): string {
        let d = new Date().getTime();
        let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    /**
     * Re-usable auth challenge for unit tests
     */
    public static authChallenge(options: IAuthChallengeOptions, answerAuthenticationChallenge: Function) {
        "use strict";

        let restClient: IRestClient = new RestClient();

        console.log("calling authenticate ...");

        restClient.post("http://localhost:6971/authenticate",
            { "Content-Type": "application/json" },
            {
                audience: "*",
                issuer: "https://sitf.co.uk",
                nonce: options.nonce,
                password: "Passw0rd!",
                sharedSecret: "205BD61A-B86E-4A3D-9023-F2B1880A0F8F",
                username: Config.testUserProfileId,
            }).then(result => {
                console.log(JSON.stringify(result));
                answerAuthenticationChallenge(result.response.jwt);
            }).catch(error => {
                console.log(JSON.stringify(error));
            });
    }

    /**
     * 
     */
    public static createAppSpace(): Promise<any> {

        let appSpaceId: string;

        let _token: string;
        let restClient = new RestClient();

        let appSpaceManager: IApiSpaceManager = new ApiSpaceManager(restClient, this.getUrlBase());

        return appSpaceManager.getToken("1969", "stevan.lepojevic")
            .then(token => {
                console.log("getToken() : ", token);
                _token = token;
                return appSpaceManager.createApiSpace(_token, "Test App Space");
            })
            .then(appSpace => {
                console.log("createAppSpace() : ", appSpace);

                appSpaceId = appSpace.id;

                let authInfo: IApiSpaceAuthInfo = {
                    audience: "*",
                    idClaim: "sub",
                    issuer: "https://sitf.co.uk",
                    sharedSecret: "205BD61A-B86E-4A3D-9023-F2B1880A0F8F",
                };

                return appSpaceManager.updateAuth(_token, appSpace.id, authInfo);
            })
            .then(auth => {
                console.log("updateAuth() : ", auth);
                return Promise.resolve(appSpaceId);
            });
    }

    /**
     * 
     */
    constructor() {
        throw new Error("Cannot new this class");
    }

}

