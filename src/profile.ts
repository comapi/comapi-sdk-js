import { injectable, inject } from "inversify";

import {
    ILocalStorageData,
    IProfile,
    IProfileManager,
    INetworkManager
} from "./interfaces";

import { Utils } from "./utils";


import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class Profile implements IProfile {

    /**
     * Profile class constructor.
     * @class Profile
     * @classdesc Class that implements Profile.
     * @parameter {INetworkManager} _networkManager 
     * @parameter {ILocalStorageData} localStorageData 
     * @parameter {IProfileManager} profileManager 
     */
    constructor( @inject(INTERFACE_SYMBOLS.NetworkManager) private _networkManager: INetworkManager,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorage: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.ProfileManager) private _profileManager: IProfileManager) { }

    /**
     * Get a profile
     * @method Profile#getProfile
     * @param {string} profileId - The id of the profile  to get
     * @returns {Promise} - returns a Promise  
     */
    public getProfile(profileId: string): Promise<any> {

        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._profileManager.getProfile(profileId);
            });
    }

    /**
     * Function to query for a list of profiles matching the search criteria
     * @method Profile#queryProfiles 
     * @param {string} [query] - See <a href="https://www.npmjs.com/package/mongo-querystring">mongo-querystring</a> for query syntax.
     * @returns {Promise} 
     */
    public queryProfiles(query?: string): Promise<any> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._profileManager.queryProfiles(query);
            });
    }

    /**
     * Function to update a profile
     * @method Profile#updateProfile    
     * @param {string} profileId - the id of the profile to update
     * @param {any} profile - the profile to update
     * @param {string} [eTag] - the eTag (returned in headers from getProfile())
     * @returns {Promise} 
     */
    public updateProfile(profileId: string, profile: any, eTag?: string): Promise<any> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._profileManager.updateProfile(profileId, profile, eTag);
            });
    }

    /**
     * Function to patch a profile
     * @method Profile#updateProfile    
     * @param {string} profileId - the id of the profile to update
     * @param {any} profile - the profile to patch
     * @param {string} [eTag] - the eTag (returned in headers from getProfile())
     * @returns {Promise} 
     */
    public patchProfile(profileId: string, profile: Object, eTag?: string): Promise<any> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._profileManager.patchProfile(profileId, profile, eTag);
            });
    }

    /**
     * Get current user's profile
     * @method Profile#getMyProfile
     * @param {boolean} [useEtag=true] - Whether to use eTags to maintain consistency of profile data (defaults to true)
     * @returns {Promise} - returns a Promise  
     */
    public getMyProfile(useEtag: boolean = true): Promise<any> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._profileManager.getProfile(sessionInfo.session.profileId);
            })
            .then(result => {
                const myProfileETag = Utils.getHeaderValue(result.headers, "ETag");
                if (useEtag && myProfileETag) {
                    this._localStorage.setString("MyProfileETag", myProfileETag);
                }
                return Promise.resolve(result.response);
            });

    }

    /**
     * Update current user's profile
     * @method Profile#updateMyProfile
     * @param {any} profile - the profile of the logged in user to update
     * @param {boolean} [useEtag=true] - Whether to use eTags to maintain consistency of profile data (defaults to true)
     * @returns {Promise} - returns a Promise  
     */
    public updateMyProfile(profile: any, useEtag: boolean = true): Promise<any> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return Promise.all([sessionInfo, this.getMyProfileETag(useEtag)]);
            })
            .then(([sessionInfo, eTag]) => {
                return this._profileManager.updateProfile(sessionInfo.session.profileId,
                    profile,
                    eTag);
            })
            .then(result => {
                const myProfileETag = Utils.getHeaderValue(result.headers, "ETag");
                if (useEtag && myProfileETag) {
                    this._localStorage.setString("MyProfileETag", myProfileETag);
                }
                return Promise.resolve(result.response);
            });
    }

    /**
     * Patch current user's profile
     * @method Profile#patchMyProfile
     * @param {any} profile - the profile of the logged in user to update
     * @returns {Promise} - returns a Promise  
     */
    public patchMyProfile(profile: any, useEtag: boolean): Promise<any> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return Promise.all([sessionInfo, this.getMyProfileETag(useEtag)]);
            })
            .then(([sessionInfo, eTag]) => {
                return this._profileManager.patchProfile(sessionInfo.session.profileId,
                    profile,
                    eTag);
            })
            .then(result => {
                const myProfileETag = Utils.getHeaderValue(result.headers, "ETag");
                if (useEtag && myProfileETag) {
                    this._localStorage.setString("MyProfileETag", myProfileETag);
                }
                return Promise.resolve(result.response);
            });
    }

    /**
     * 
     * @param useEtag 
     */
    private getMyProfileETag(useEtag: boolean): Promise<string|undefined>{
        if (useEtag) {
            return this._localStorage.getString("MyProfileETag");
        } else {
            return Promise.resolve(undefined);
        }
    }
}
