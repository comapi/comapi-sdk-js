// https://github.com/DirtyHairy/async-mutex

interface IMutexInterface {

    acquire(): Promise<IMutexInterface.IReleaser>;

    runExclusive<T>(callback: IMutexInterface.IWorker<T>): Promise<T>;

}

namespace IMutexInterface {
    "use strict";
    export interface IReleaser {
        (): void;
    }

    export interface IWorker<T> {
        (): Promise<T> | T;
    }

}

export default IMutexInterface;
