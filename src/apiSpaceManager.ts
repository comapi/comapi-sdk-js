
import { IRestClient, IApiSpaceManager, IApiSpaceInfo, IApiSpaceAuthInfo } from "./interfaces";

export class ApiSpaceManager implements IApiSpaceManager {

    constructor(private _restClient: IRestClient,
        private _urlBase: string) { }


    /** 
     * 
     */
    public getToken(accountId: string, profileId: string): Promise<any> {
        return this._restClient.get(`${this._urlBase}/token/${accountId}/${profileId}`)
            .then(function (result) {
                console.log("resolving with " + result.response.token);
                return Promise.resolve(result.response.token);
            });
    }

    /**
     * 
     */
    public createApiSpace(token: string, name: string): Promise<IApiSpaceInfo> {
        let headers = {
            "Content-Type": "application/json",
            "authorization": "Bearer " + token
        };

        return this._restClient.post(`${this._urlBase}/apispaces`, headers, { name: name })
            .then(function (result) {
                return Promise.resolve(result.response);
                /*
                    {
                    "id": "1783e4b7-f9d6-4ea0-807b-f8e1bc5a313a",
                    "name": "App Space No. 14",
                    "createdOn": "2016-08-02T14:24:42.802Z",
                    "updatedOn": "2016-08-02T14:24:42.802Z"
                    } 
                */
            });
    }

    /**
     * 
     */
    public updateAuth(token: string, apiSpaceId: string, authInfo: IApiSpaceAuthInfo): Promise<IApiSpaceAuthInfo> {
        let headers = {
            "authorization": "Bearer " + token
        };

        return this._restClient.put(`${this._urlBase}/apispaces/${apiSpaceId}/auth`, headers, authInfo)
            .then(function (result) {
                return Promise.resolve(result.response);
            });
    }
}
