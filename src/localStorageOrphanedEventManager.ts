import { injectable, inject } from "inversify";

import {
    IOrphanedEventManager,
    IConversationMessageEvent,
    ILocalStorageData
} from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

interface IOrphanedEventInfo {
    conversationId: string;
    continuationToken: number;
}


/**
 * 
 */
interface IOrphanedEventContainer {
    continuationToken: number;
    orphanedEvents: IConversationMessageEvent[];
};


@injectable()
export class LocalStorageOrphanedEventManager implements IOrphanedEventManager {

    private _initialised: Promise<boolean>;

    private _orphanedEvents = {
        // IOrphanedEventContainer will be keyed off a conversationId property
    };

    /**
     * 
     */
    constructor( @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorage: ILocalStorageData) {
    }

    /**
     * 
     */
    public clearAll(): Promise<boolean> {
        return this.ensureInitialised()
            .then(initialised => {
                this._orphanedEvents = {};
                return this._localStorage.setObject("orphanedEvents", this._orphanedEvents);
            });
    }

    /**
     * 
     */
    public clear(conversationId: string): Promise<boolean> {
        return this.ensureInitialised()
            .then(initialised => {
                this._orphanedEvents[conversationId] = {
                    orphanedEvents: []
                };
                return this._localStorage.setObject("orphanedEvents", this._orphanedEvents);
            });
    }

    /**
     * 
     */
    public getContinuationToken(conversationId: string): Promise<number> {
        return this.ensureInitialised()
            .then(initialised => {
                let container: IOrphanedEventContainer = this._orphanedEvents[conversationId];
                return Promise.resolve(container ? container.continuationToken : null);
            });
    }

    /**
     * 
     */
    public setContinuationToken(conversationId: string, continuationToken: number): Promise<boolean> {
        return this.ensureInitialised()
            .then(initialised => {
                let _info: IOrphanedEventInfo = this._orphanedEvents[conversationId];
                if (_info) {
                    _info.continuationToken = continuationToken;
                } else {
                    this._orphanedEvents[conversationId] = {
                        continuationToken: continuationToken,
                        orphanedEvents: []
                    };
                }
                return Promise.resolve(true);
            });
    }

    /**
     * 
     */
    public addOrphanedEvent(event: IConversationMessageEvent): Promise<boolean> {
        return this.ensureInitialised()
            .then(initialised => {
                let info: IOrphanedEventContainer = this._orphanedEvents[event.conversationId];

                if (info) {

                    // check for dupe 
                    let found: IConversationMessageEvent[] = info.orphanedEvents.filter(e => e.eventId === event.eventId);

                    if (found.length === 0) {
                        // insert
                        info.orphanedEvents.unshift(event);

                        // sort
                        info.orphanedEvents = info.orphanedEvents.sort((e1, e2) => {
                            if (e1.conversationEventId > e2.conversationEventId) {
                                return 1;
                            } else if (e1.conversationEventId < e2.conversationEventId) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });

                        // save
                        return this._localStorage.setObject("orphanedEvents", this._orphanedEvents);

                    } else {
                        return Promise.resolve(false);
                    }

                } else {
                    return Promise.reject<boolean>({ message: `No container for conversation ${event.conversationId}` });
                }
            });
    }

    /**
     * 
     */
    public removeOrphanedEvent(event: IConversationMessageEvent): Promise<boolean> {
        return this.ensureInitialised()
            .then(initialised => {
                let info: IOrphanedEventContainer = this._orphanedEvents[event.conversationId];

                if (info) {

                    for (let i = info.orphanedEvents.length - 1; i >= 0; i--) {
                        let e = info.orphanedEvents[i];
                        if (e.eventId === event.eventId) {
                            info.orphanedEvents.splice(i, 1);
                            break;
                        }
                    }

                    // save
                    return this._localStorage.setObject("orphanedEvents", this._orphanedEvents);

                } else {
                    return Promise.reject<boolean>({ message: `No container for conversation ${event.conversationId}` });
                }
            });
    }

    /**
     * 
     */
    public getOrphanedEvents(conversationId: string): Promise<IConversationMessageEvent[]> {
        return this.ensureInitialised()
            .then(initialised => {
                let info: IOrphanedEventContainer = this._orphanedEvents[conversationId];
                return Promise.resolve(info ? info.orphanedEvents : []);
            });
    }


    private ensureInitialised() {
        if (!this._initialised) {
            // this is a promise instance to ensure it's only called once
            this._initialised = this.initialise();
        }
        return this._initialised;
    }

    /**
     * 
     */
    private initialise(): Promise<boolean> {

        return this._localStorage.getObject("orphanedEvents")
            .then(result => {
                this._orphanedEvents = result || {};
                return true;
            });

    }

}
