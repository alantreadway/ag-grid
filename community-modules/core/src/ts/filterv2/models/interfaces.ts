export interface Comparator<T> {
    compare(a: T, b: T): number;
}

export interface ExpressionModel<T> {
    evaluate(input: T): boolean;
    isValid(): boolean;
}
