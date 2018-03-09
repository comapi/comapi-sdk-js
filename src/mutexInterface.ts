// https://github.com/DirtyHairy/async-mutex

interface IMutexInterface {

    acquire(name?: string): Promise<IMutexInterface.IReleaser>;

    runExclusive<T>(callback: IMutexInterface.IWorker<T>, name?: string): Promise<T>;

}

namespace IMutexInterface {
    "use strict";
    export interface IReleaser {
        (): void;
    }

    export type Worker = (release: IMutexInterface.IReleaser) => void

    export interface IQueueItem {
        method: Worker;
        name?: string;
    }

    export interface IWorker<T> {
        (): Promise<T> | T;
    }

}

export default IMutexInterface;
