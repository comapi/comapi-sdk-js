import {
    ILocalStorageData,
    IProfileManager,
    INetworkManager
} from "./interfaces";

export class Profile {

    /**        
     * Profile class constructor.
     * @class Profile
     * @classdesc Class that implements Profile.
     * @parameter {INetworkManager} _networkManager 
     * @parameter {ILocalStorageData} localStorageData 
     * @parameter {IProfileManager} profileManager 
     */
    constructor(private _networkManager: INetworkManager, private _localStorage: ILocalStorageData, private _profileManager: IProfileManager) { }

    /**
     * Get a profile
     * @method Profile#getProfile
     * @param {string} profileId - The id of the profile  to get
     * @returns {Promise} - returns a Promise  
     */
    public getProfile(profileId: string): Promise<any> {

        return this._networkManager.ensureSessionAndSocket()
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
        return this._networkManager.ensureSessionAndSocket()
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
        return this._networkManager.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._profileManager.updateProfile(profileId, profile, eTag);
            });
    }

    /**
     * Get current user's profile
     * @method Profile#getMyProfile
     * @param {boolean} [useEtag=true] - Whether to use eTags to maintain consistency of profile data (defaults to true)
     * @returns {Promise} - returns a Promise  
     */
    public getMyProfile(useEtag: boolean = true): Promise<any> {
        return this._networkManager.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._profileManager.getProfile(sessionInfo.session.profileId)
                    .then(result => {
                        if (useEtag) {
                            this._localStorage.setString("MyProfileETag", result.headers.ETag);
                        }
                        return Promise.resolve(result.response);
                    });
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
        return this._networkManager.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._profileManager.updateProfile(sessionInfo.session.profileId,
                    profile,
                    useEtag ? this._localStorage.getString("MyProfileETag") : undefined)
                    .then(result => {
                        if (useEtag) {
                            this._localStorage.setString("MyProfileETag", result.headers.ETag);
                        }
                        return Promise.resolve(result.response);
                    });
            });

    }
}
