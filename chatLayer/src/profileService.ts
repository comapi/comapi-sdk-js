import { IFoundation, IProfile } from "../../src/interfaces";
import { IComapiChatConfig } from "../interfaces/chatLayer";

export class ProfileService implements IProfile {

    constructor(private _foundation: IFoundation, private _config: IComapiChatConfig) { }

    public getProfile(profileId: string): Promise<any> {
        return this._foundation.services.profile.getProfile(profileId);
    }

    public queryProfiles(query?: string): Promise<any> {
        return this._foundation.services.profile.queryProfiles(query);
    }

    public updateProfile(profileId: string, profile: any, eTag?: string): Promise<any> {
        return this._foundation.services.profile.updateProfile(profileId, profile, eTag);
    }

    public patchProfile(profileId: string, profile: Object): Promise<any> {
        return this._foundation.services.profile.patchProfile(profileId, profile);
    }

    public getMyProfile(): Promise<any> {
        return this._foundation.services.profile.getMyProfile();
    }

    public updateMyProfile(profile: any, useEtag?: boolean): Promise<any> {
        return this._foundation.services.profile.updateMyProfile(profile, useEtag);
    }

    public patchMyProfile(profile: any): Promise<any> {
        return this._foundation.services.profile.patchMyProfile(profile);
    }
}
