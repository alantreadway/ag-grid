export const COMPARISON_OPERATION_METADATA = {
    'equals': { operands: 1 },
    'not-equals': { operands: 1 },
    'less-than': { operands: 1 },
    'greater-than': { operands: 1 },
    'in-range': { operands: 2 },
    'blank': { operands: 0 },
};

export type ComparisonOperation = keyof typeof COMPARISON_OPERATION_METADATA;

export type Cardinality = 0 | 1 | 2 | typeof Infinity;
interface OperationExpression<T, N = string, O = ComparisonOperation, C extends Cardinality = 1> {
    type: T;
    operation: O;
    operands: C extends 0 ? [] :
        C extends 1 ? [ N ] :
        C extends 2 ? [ N, N ] :
        N[];
}

export type ComparisonOperationExpression<T, N = string> =
    OperationExpression<T, N, 'blank', 0> |
    OperationExpression<T, N, Exclude<ComparisonOperation, 'in-range' | 'blank'>, 1> |
    OperationExpression<T, N, 'in-range', 2>;

export type LogicOperation = 'and' | 'or' | 'not';

export type TextOperationExpression = ComparisonOperationExpression<'text-op'>;
export type LogicalOperationExpression<M> =
    OperationExpression<'logic', M, Exclude<LogicOperation, 'not'>, typeof Infinity> |
    OperationExpression<'logic', M, 'not', 1>;

export type ConcreteExpression = TextOperationExpression;

export type Expression = ConcreteExpression | LogicalOperationExpression<ConcreteExpression>;

/** TYPE-GUARDS */

export function isComparisonOperation(x: string): x is ComparisonOperation {
    return Object.keys(COMPARISON_OPERATION_METADATA).indexOf(x) >= 0;
}

export function isComparisonOperationExpression<T>(x: Partial<Expression>): x is Partial<ComparisonOperationExpression<any>> {
    return x.type !== 'logic';
}

/** UTILITIES */

export function comparisonOperationOperandCardinality(op: ComparisonOperation): Cardinality {
    return COMPARISON_OPERATION_METADATA[op].operands;
}

/** EXAMPLES */

const EXAMPLE_MODEL_1: Expression = {
    type: 'logic',
    operation: 'or',
    operands: [
        { type: 'text-op', operation: 'equals', operands: ['test'] },
        { type: 'text-op', operation: 'in-range', operands: ['a', 'z'] },
        { type: 'text-op', operation: 'blank', operands: [] },
    ],
};

const EXAMPLE_MODEL_2: Expression = {
    type: 'logic',
    operation: 'not',
    operands: [
        { type: 'text-op', operation: 'greater-than', operands: ['c'] },
    ],
};

const EXAMPLE_MODEL_3: Expression = {
    type: 'text-op',
    operation: 'equals',
    operands: ['test'],
};
