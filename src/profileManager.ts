import { injectable, inject } from "inversify";

import { IProfileManager, ISessionManager, ILogger, IRestClient, ILocalStorageData, IComapiConfig } from "./interfaces";

import { Utils } from "./utils";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";
@injectable()
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
    constructor( @inject(INTERFACE_SYMBOLS.Logger) private _logger: ILogger,
        @inject(INTERFACE_SYMBOLS.AuthenticatedRestClient) private _restClient: IRestClient,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorageData: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig,
        @inject(INTERFACE_SYMBOLS.SessionManager) private _sessionManager: ISessionManager) { }

    /**
     * Function to retrieve a user's profile
     * @method ProfileManager#getProfile 
     * @param {string} id
     * @returns {Promise} 
     */
    public getProfile(id: string): Promise<any> {

        let url = Utils.format(this._comapiConfig.foundationRestUrls.profile, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            profileId: id,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.get(url);
    }

    /**
     * Function to query for a list of profiles matching the search criteria
     * @method ProfileManager#getProfile 
     * @param {string} [query] - See https://www.npmjs.com/package/mongo-querystring for query syntax.
     * @returns {Promise} 
     */
    public queryProfiles(query?: string): Promise<any> {

        let url = Utils.format(this._comapiConfig.foundationRestUrls.profiles, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            urlBase: this._comapiConfig.urlBase,
        });

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

        let url = Utils.format(this._comapiConfig.foundationRestUrls.profile, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            profileId: id,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.put(url, headers, data);
    }


    /**
     * Function to patch a profile
     * @method ProfileManager#updateProfile    
     * @param {string} id
     * @param {Object} profile 
     * @param {string} [eTag] 
     * @returns {Promise} 
     */
    public patchProfile(id: string, profile: Object, eTag?: string): Promise<any> {
        let headers = {};

        if (eTag) {
            headers["If-Match"] = eTag;
        }

        // take a copy of it prior to messing with it ...
        let data = Utils.clone(profile);

        if (data.id === undefined) {
            data.id = id;
        }

        let url = Utils.format(this._comapiConfig.foundationRestUrls.profile, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            profileId: id,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.patch(url, headers, data);
    }

}
