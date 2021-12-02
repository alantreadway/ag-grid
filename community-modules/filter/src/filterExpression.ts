export const COMPARISON_OPERATION_METADATA = {
    'equals': { operands: 1 },
    'not-equals': { operands: 1 },
    'less-than': { operands: 1 },
    'greater-than': { operands: 1 },
    'in-range': { operands: 2 },
};

export const TEXT_COMPARISON_OPERATION_METADATA = {
    'contains': { operands: 1 },
    'not-contains': { operands: 1 },
    'equals': { operands: 1 },
    'not-equals': { operands: 1 },
    'starts-with': { operands: 1 },
    'ends-with': { operands: 1 },
};

export type ScalarComparisonOperation = keyof typeof COMPARISON_OPERATION_METADATA;
export type TextComparisonOperation = keyof typeof TEXT_COMPARISON_OPERATION_METADATA;

export type Cardinality = 0 | 1 | 2 | typeof Infinity;
interface OperationExpression<T, N = string, O = TextComparisonOperation, C extends Cardinality = 1> {
    type: T;
    operation: O;
    operands: C extends 0 ? [] :
        C extends 1 ? [ N ] :
        C extends 2 ? [ N, N ] :
        N[];
}

export type ScalarComparisonOperationExpression<T, N = string> =
    OperationExpression<T, N, Exclude<ScalarComparisonOperation, 'in-range'>, 1> |
    OperationExpression<T, N, 'in-range', 2>;

export type TextComparisonOperationExpression<T, N = string> =
    OperationExpression<T, N, TextComparisonOperation, 1>;

export type LogicOperation = 'and' | 'or' | 'not';

export type ScalarOperationExpression<T> = ScalarComparisonOperationExpression<'number-op' | 'date-op', T>;
export type TextOperationExpression = TextComparisonOperationExpression<'text-op'>;
export type LogicalOperationExpression<M> =
    OperationExpression<'logic', M, Exclude<LogicOperation, 'not'>, typeof Infinity> |
    OperationExpression<'logic', M, 'not', 1>;

export type ConcreteExpression<T> = TextOperationExpression | ScalarOperationExpression<T>;

export type FilterExpression<T = any> = ConcreteExpression<T> | LogicalOperationExpression<ConcreteExpression<T>>;

/** TYPE-GUARDS */

export function isScalarComparisonOperation(x: string): x is ScalarComparisonOperation {
    return Object.keys(COMPARISON_OPERATION_METADATA).indexOf(x) >= 0;
}

export function isTextComparisonOperation(x: string): x is TextComparisonOperation {
    return Object.keys(TEXT_COMPARISON_OPERATION_METADATA).indexOf(x) >= 0;
}

export function isTextComparisonOperationExpression(x: Partial<FilterExpression<any>>): x is Partial<TextComparisonOperationExpression<any>> {
    return x.type === 'text-op';
}

export function isComparisonOperationExpression(x: Partial<FilterExpression<any>>): x is Partial<ScalarComparisonOperationExpression<any>> {
    return x.type === 'number-op' || x.type === 'date-op';
}

/** UTILITIES */

export function comparisonOperationOperandCardinality(
    op: ScalarComparisonOperation | TextComparisonOperation
): Cardinality {
    if (isScalarComparisonOperation(op)) {
        return COMPARISON_OPERATION_METADATA[op].operands;
    }
    return TEXT_COMPARISON_OPERATION_METADATA[op].operands;
}

/** EXAMPLES */

const EXAMPLE_MODEL_1: FilterExpression<string> = {
    type: 'logic',
    operation: 'or',
    operands: [
        { type: 'text-op', operation: 'equals', operands: ['test'] },
        { type: 'text-op', operation: 'contains', operands: ['123'] },
        { type: 'text-op', operation: 'starts-with', operands: ['abc'] },
    ],
};

const EXAMPLE_MODEL_2: FilterExpression<string> = {
    type: 'logic',
    operation: 'not',
    operands: [
        { type: 'text-op', operation: 'contains', operands: ['c'] },
    ],
};

const EXAMPLE_MODEL_3: FilterExpression<string> = {
    type: 'text-op',
    operation: 'contains',
    operands: ['test'],
};
