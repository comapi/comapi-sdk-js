import IMutexInterface from "./mutexInterface";


export class Mutex implements IMutexInterface {

    private _queue: Array<(release: IMutexInterface.IReleaser) => void> = [];
    private _pending = false;

    public acquire(): Promise<IMutexInterface.IReleaser> {
        const ticket = new Promise(resolve => this._queue.push(resolve));

        if (!this._pending) {
            this._dispatchNext();
        }

        return ticket;
    }

    public runExclusive<T>(callback: IMutexInterface.IWorker<T>): Promise<T> {
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
            this._queue.shift()(this._dispatchNext.bind(this));
        } else {
            this._pending = false;
        }
    }


}
