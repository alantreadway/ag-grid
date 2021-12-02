import { _ } from "@ag-grid-community/core";
import { isTextComparisonOperation, TextComparisonOperation, TextComparisonOperationExpression } from "../filterExpression";
import { ExpressionModel } from "./interfaces";

export class TextComparisonOperationModel implements ExpressionModel<string> {
    private readonly operation: TextComparisonOperation;
    private readonly operands: string[];

    public constructor(opts: {
        operation: TextComparisonOperation,
        operands: string[],
    }) {
        this.operation = opts.operation;
        this.operands = opts.operands;
    }

    public evaluate(input: string): boolean {
        switch (this.operation) {
            case 'equals':
                return this.operands[0] === input;
            case 'not-equals':
                return this.operands[0] !== input;
            case 'contains':
                return input.indexOf(this.operands[0]) >= 0;
            case 'not-contains':
                return input.indexOf(this.operands[0]) < 0;
            case 'starts-with':
                return input.startsWith(this.operands[0]);
            case 'ends-with':
                return input.endsWith(this.operands[0]);
            default:
                throw new Error('AG Grid: Unknown operation: ' + this.operation);
        }
    }

    public isValid(): boolean {
        if (!isTextComparisonOperation(this.operation)) {
            return false;
        }
        if (this.operands.length !== 1) {
            return false;
        }
        if (this.operands.some((v) => v.trim().length === 0)) {
            return false;
        }

        return true;
    }

    public toFilterExpression(): TextComparisonOperationExpression<'text-op', string> {
        return {
            type: 'text-op',
            operation: this.operation,
            operands: this.operands,
        } as TextComparisonOperationExpression<'text-op', string>;
    }
}