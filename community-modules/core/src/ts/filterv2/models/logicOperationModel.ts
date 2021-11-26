import { LogicOperation, LogicalOperationExpression } from "../expression";
import { ExpressionModel } from "./interfaces";

export class LogicOperationModel<T> implements ExpressionModel<T> {
    private readonly operation: LogicOperation;
    private readonly operands: ExpressionModel<T>[];

    public constructor(opts: {
        operation: LogicOperation,
        operands: ExpressionModel<T>[],
    }) {
        this.operation = opts.operation;
        this.operands = opts.operands;
    }

    public evaluate(input: T): boolean {
        switch (this.operation) {
            case "and":
                for (const operand of this.operands) {
                    if (!operand.evaluate(input)) {
                        return false;
                    }
                }
                return true;

            case "or":
                for (const operand of this.operands) {
                    if (operand.evaluate(input)) {
                        return true;
                    }
                }
                return false;

            case "not":
                for (const operand of this.operands) {
                    if (operand.evaluate(input)) {
                        return false;
                    }
                }
                return true;

            default:
                throw new Error('AG Grid: Unknown operations: ' + this.operation);
        }
    }

    public isValid(): boolean {
        if (this.operation === 'not' && this.operands.length !== 1) {
            return false;
        }

        for (const operand of this.operands) {
            if (!operand.isValid()) {
                return false;
            }
        }

        return true;
    }
}