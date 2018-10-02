import { injectable } from "inversify";
import { IEventManager } from "./interfaces";

interface IEventSubscription {
    eventType: string;
    handler: Function;
}
@injectable()
export class EventManager implements IEventManager {

    // array of subscribers to SDK events
    private eventSubscribers: IEventSubscription[];

    /**        
     * EventManager class constructor.
     * @class EventManager
     * @ignore
     * @classdesc Class that implements all local event management.
     */
    constructor() {
        this.eventSubscribers = [];
    }

    /**
     * Subscribes the caller to a local event type.
     * @method EventManager#subscribeToLocalEvent
     * @param {string} eventType - The type of event to subscribe to
     * @param {Function} handler - The callback
     */
    public subscribeToLocalEvent(eventType: string, handler: Function): void {
        this.eventSubscribers.push({
            eventType: eventType,
            handler: handler,
        });
    }

    /**
     * Checks for an event subscriptionfor a local event type.
     * @method EventManager#isSubscribedToLocalEvent
     * @param {string} eventType - The type of event to check
     */
    public isSubscribedToLocalEvent(eventType: string): boolean {

        let isSubscribed = false;

        for (let subscriber of this.eventSubscribers) {
            if (subscriber.eventType === eventType) {
                isSubscribed = true;
                break;
            }
        }

        return isSubscribed;
    }


    /**
     * Removes a subscription for a local event type.
     * @method EventManager#unsubscribeFromLocalEvent
     * @param {string} eventType - The type of event to subscribe to
     * @param {Function} [handler] - The callback (optional - if not specified, all associated callbacks will be unregistered)
     */
    public unsubscribeFromLocalEvent(eventType: string, handler?: Function): void {

        if (handler) {
            // looking for a single handler
            for (let i: number = this.eventSubscribers.length - 1; i >= 0; i--) {
                let subscriber: IEventSubscription = this.eventSubscribers[i];

                if (subscriber.handler === handler && subscriber.eventType === eventType) {
                    this.eventSubscribers.splice(i, 1);
                    break;
                }
            }

        } else {
            // remove ANY subscribing to `eventType`
            for (let i: number = this.eventSubscribers.length - 1; i >= 0; i--) {
                let subscriber: IEventSubscription = this.eventSubscribers[i];

                if (subscriber.eventType === eventType) {
                    this.eventSubscribers.splice(i, 1);
                }
            }
        }
    }

    /**
     * Publishes a LocalEvent.
     * @method EventManager#publishLocalEvent
     * @param {string} eventType - The type of event to publish
     * @param {Object} data - The data associated with the event
     */
    public publishLocalEvent(eventType: string, data: any): void {

        setTimeout(() => {
            for (let subscriber of this.eventSubscribers) {
                if (subscriber.eventType === eventType) {
                    // call the handler
                    // TODO: configurably wrap this ...
                    // try {
                    subscriber.handler(data);
                    // } catch (e) {
                    //    console.error("caught exception publishing event: " + e);
                    // }
                }
            }
        });
    }
}

