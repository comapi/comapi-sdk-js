
import { IProfileManager, ISessionManager, ILogger, IRestClient, ILocalStorageData, IComapiConfig } from "./interfaces";

import { Utils } from "./utils";

export class ProfileManager implements IProfileManager {

    /**        
     * ProfileManager class constructor.
     * @class ProfileManager
     * @ignore
     * @classdesc Class that implements Profile Management.
     * @parameter {ILogger} logger 
     * @parameter {IRestClient} restClient 
     * @parameter {ILocalStorageData} localStorageData 
     * @parameter {IComapiConfig} comapiConfig 
     * @parameter {ISessionManager} sessionManager 
     */
    constructor(private _logger: ILogger,
        private _restClient: IRestClient,
        private _localStorageData: ILocalStorageData,
        private _comapiConfig: IComapiConfig,
        private _sessionManager: ISessionManager) { }

    /**
     * Function to retrieve a user's profile
     * @method ProfileManager#getProfile 
     * @param {string} id
     * @returns {Promise} 
     */
    public getProfile(id: string): Promise<any> {
        let url = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/profiles/${id}`;

        return this._restClient.get(url);
    }

    /**
     * Function to query for a list of profiles matching the search criteria
     * @method ProfileManager#getProfile 
     * @param {string} [query] - See https://www.npmjs.com/package/mongo-querystring for query syntax.
     * @returns {Promise} 
     */
    public queryProfiles(query?: string): Promise<any> {

        let url = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/profiles`;

        if (query) {
            url += ("?" + query);
        }

        return this._restClient.get(url);
    }

    /**
     * Function to update a profile
     * @method ProfileManager#updateProfile    
     * @param {string} id
     * @param {Object} profile 
     * @param {string} [eTag] 
     * @returns {Promise} 
     */
    public updateProfile(id: string, profile: Object, eTag?: string): Promise<any> {
        let headers = {};

        if (eTag) {
            headers["If-Match"] = eTag;
        }

        // take a copy of it prior to messing with it ...
        let data = Utils.clone(profile);

        if (data.id === undefined) {
            data.id = id;
        }

        let url = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/profiles/${id}`;

        return this._restClient.put(url, headers, data);
    }


    /**
     * Function to patch a profile
     * @method ProfileManager#updateProfile    
     * @param {string} id
     * @param {Object} profile 
     * @returns {Promise} 
     */
    public patchProfile(id: string, profile: Object): Promise<any> {

        // take a copy of it prior to messing with it ...
        let data = Utils.clone(profile);

        if (data.id === undefined) {
            data.id = id;
        }

        let url = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/profiles/${id}`;

        return this._restClient.patch(url, {}, data);
    }

}
