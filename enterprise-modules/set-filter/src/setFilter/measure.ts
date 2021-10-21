import { AgPromise } from "@ag-grid-community/core";

function to2DP(input: number): number {
    return Math.round(input * 100) / 100;
}

export function measure<T = void>(msg: string, callback: () => T): T {
    const now = () => performance.now();
    const memMb = () => to2DP((performance as any).memory.usedJSHeapSize / 1024 ** 2);
    const start = now();
    const startMem = memMb();
    let syncResult = true;

    const resultFn = () => console.log(msg, `${to2DP(now() - start)}ms; heap delta: ${(to2DP(memMb() - startMem))}MB; heap: ${memMb()}MB`);

    try {
        const result = callback();

        if (result instanceof AgPromise) {
            result.then(() => resultFn());
        }

        return result;
    } finally {
        if (syncResult) { resultFn() };
    }
}
