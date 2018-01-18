import IMutexInterface from "./mutexInterface";


export class Mutex implements IMutexInterface {

    private _queue: Array<IMutexInterface.IQueueItem> = [];
    private _pending = false;

    public acquire(name?: string): Promise<IMutexInterface.IReleaser> {
        const ticket = new Promise<IMutexInterface.IReleaser>(resolve => this._queue.push({ method: resolve, name: name }));

        if (!this._pending) {
            this._dispatchNext();
        }

        return ticket;
    }

    public runExclusive<T>(callback: IMutexInterface.IWorker<T>, name?: string): Promise<T> {
        return this
            .acquire()
            .then(release => {
                let result: T | Promise<T>;

                try {
                    result = callback();
                } catch (e) {
                    release();
                    throw (e);
                }

                return Promise
                    .resolve(result)
                    .then(
                    (x: T) => (release(), x),
                    e => {
                        release();
                        throw e;
                    }
                    );
            }
            );
    }

    private _dispatchNext(): void {
        if (this._queue.length > 0) {
            this._pending = true;
            this._queue.shift().method(this._dispatchNext.bind(this));
        } else {
            this._pending = false;
        }
    }


}
