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

    private _orphanedEvents = {
        // IOrphanedEventContainer will be keyed off a conversationId property
    };

    /**
     * 
     */
    constructor( @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorage: ILocalStorageData) {
        this._orphanedEvents = this._localStorage.getObject("orphanedEvents") || {};
    }

    /**
     * 
     */
    public clearAll(): Promise<boolean> {
        this._orphanedEvents = {};
        this._localStorage.setObject("orphanedEvents", this._orphanedEvents);
        return Promise.resolve(true);
    }

    /**
     * 
     */
    public clear(conversationId: string): Promise<boolean> {
        this._orphanedEvents[conversationId] = {
            orphanedEvents: []
        };
        this._localStorage.setObject("orphanedEvents", this._orphanedEvents);
        return Promise.resolve(true);
    }

    /**
     * 
     */
    public getContinuationToken(conversationId: string): Promise<number> {
        let container: IOrphanedEventContainer = this._orphanedEvents[conversationId];
        return Promise.resolve(container ? container.continuationToken : null);
    }

    /**
     * 
     */
    public setContinuationToken(conversationId: string, continuationToken: number): Promise<boolean> {

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
    }

    /**
     * 
     */
    public addOrphanedEvent(event: IConversationMessageEvent): Promise<boolean> {

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
                this._localStorage.setObject("orphanedEvents", this._orphanedEvents);
            }

        } else {
            return Promise.reject<boolean>({ message: `No container for conversation ${event.conversationId}` });
        }
    }

    /**
     * 
     */
    public removeOrphanedEvent(event: IConversationMessageEvent): Promise<boolean> {
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
            this._localStorage.setObject("orphanedEvents", this._orphanedEvents);

            return Promise.resolve(true);

        } else {
            return Promise.reject<boolean>({ message: `No container for conversation ${event.conversationId}` });
        }
    }

    /**
     * 
     */
    public getOrphanedEvents(conversationId: string): Promise<IConversationMessageEvent[]> {
        let info: IOrphanedEventContainer = this._orphanedEvents[conversationId];
        return Promise.resolve(info ? info.orphanedEvents : []);
    }
}
