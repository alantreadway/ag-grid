import { Expression } from "../expression";

export interface ExpressionComponent {
    expressionUpdated(newExpression: Expression): void;

    setParameters(params: ExpressionComponentParameters<Expression>): void;
}

export interface ExpressionComponentParameters<T = Expression, O = string> {
    mutateTransientExpression(change: Partial<T>): void;
    commitExpression(): void;
    rollbackExpression(): void;
}

export interface OperandComponent<T = string> {
    operandUpdated(newValue: T | null): void;

    setParameters(params: OperandComponentParameters<T>): void;
}

export interface OperandComponentParameters<T> {
    mutateTransientOperand(change: T | null): void;
    commitExpression(): void;
    rollbackExpression(): void;
}

export interface OperandSerialiser<T> {
    toOperandType(input: string | null): T | null;
    toString(input: T | null): string | null;
}
