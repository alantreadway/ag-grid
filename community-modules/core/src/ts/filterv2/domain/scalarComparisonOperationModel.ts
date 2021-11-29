import { isScalarComparisonOperation, ScalarComparisonOperation, ScalarOperationExpression } from "../filterExpression";
import { Comparator, ExpressionModel } from "./interfaces";

export class ScalarComparisonOperationModel<T extends number | Date> implements ExpressionModel<T> {
    private readonly type: ScalarOperationExpression<T>['type'];
    private readonly operation: ScalarComparisonOperation;
    private readonly operands: ScalarOperationExpression<T>['operands'];
    private readonly comparator: Comparator<T>;

    public constructor(opts: {
        type: ScalarOperationExpression<T>['type'],
        operation: ScalarComparisonOperation,
        operands: ScalarOperationExpression<T>['operands'],
        comparator: Comparator<T>,
    }) {
        this.operation = opts.operation;
        this.operands = opts.operands;
        this.comparator = opts.comparator;
    }

    public evaluate(input: T): boolean {
        const comparisons = this.operands.map((v) => this.comparator.compare(v, input));

        switch (this.operation) {
            case 'equals':
                return comparisons[0] === 0;
            case "not-equals":
                return comparisons[0] !== 0;
            case "greater-than":
                return comparisons[0] > 0;
            case "less-than":
                return comparisons[0] < 0;
            case "in-range":
                return comparisons[0] > 0 && comparisons[1] < 0;
            default:
                throw new Error('AG Grid: Unknown operation: ' + this.operation);
        }
    }

    public isValid(): boolean {
        if (!isScalarComparisonOperation(this.operation)) {
            return false;
        }
        if (this.operation === 'in-range' && this.operands.length !== 2) {
            return false;
        }
        if (this.operands.length !== 1) {
            return false;
        }

        return true;
    }

    public toFilterExpression(): ScalarOperationExpression<T> {
        return {
            type: this.type,
            operation: this.operation,
            operands: this.operands,
        } as ScalarOperationExpression<T>;
    }
}