import { FilterExpression } from "../filterExpression";

export interface StateManager<T = any> {
    addUpdateListener(cb: (newState: T | null) => void): void;
    addTransientUpdateListener(cb: (newTransientState: T | null) => void): void;

    getTransientExpression(): T | null;
    mutateTransientExpression(change: Partial<T> | null): void;
    isTransientExpressionValid(): boolean;

    commitExpression(): void;
    rollbackExpression(): void;
}

export interface ExpressionComponent<T = any, F = FilterExpression<T>> {
    setParameters(params: { stateManager: StateManager<F> }): void;
}

export interface OperandComponent<T = string> {
    setParameters(params: { stateManager: StateManager<T> }): void;
}

export interface OperandSerialiser<T> {
    toOperandType(input: string | null): T | null;
    toString(input: T | null): string | null;
}
