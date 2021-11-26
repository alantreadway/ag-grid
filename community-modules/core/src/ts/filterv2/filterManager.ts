import { _ } from "../utils/utils";
import { Column } from "../entities/column";
import { RowNode } from "../entities/rowNode";
import { Component } from "../widgets/component";
import { ExpressionComponentFactory } from "./components/expressionComponentFactory";
import { ExpressionComponent } from "./components/interfaces";
import { Expression } from "./expression";
import { ExpressionModelFactory } from "./models/expressionModelFactory";
import { ExpressionModel } from "./models/interfaces";

const DEFAULT_EXPRESSION: Expression = {
    type: 'text-op',
    operation: 'equals',
    operands: [''],
};

interface FilterExpressions {
    [key: string]: {
        expression: Expression;
        model: ExpressionModel<unknown>;
    };
}

export class FilterManager {
    private readonly expressionModelFactory = new ExpressionModelFactory();
    private readonly expressionComponentFactory = new ExpressionComponentFactory();

    private activeExpressions: FilterExpressions = {};
    private activeComponents: {[key: string]: (ExpressionComponent & Component) } = {};

    private transientExpressions: {[key: string]: Expression} = {};

    public getFilterExpressions(): {[key: string]: Expression} | null {
        const result: {[key: string]: Expression} = {};

        let count = 0;
        Object.keys(this.activeExpressions).forEach((colId) => {
            result[colId] = this.activeExpressions[colId].expression;
            count++;
        });

        return count === 0 ? null : result;
    }

    public setFilterExpressions(exprs: {[key: string]: Expression} | null) {
        const newActiveExpressions: FilterExpressions = {};
        if (exprs == null) {
            this.activeExpressions = newActiveExpressions;
            return;
        }

        Object.keys(exprs).forEach((colId) => {
            const expression = exprs[colId];
            const model = this.expressionModelFactory.buildExpressionModel(expression);

            if (!model.isValid()) {
                throw new Error("AG Grid - invalid filter expression: " + expression);
            }
            newActiveExpressions[colId] = { expression, model };
        });

        this.activeExpressions = newActiveExpressions;
    }

    public evaluateFilters(params: { rowNode: RowNode }): boolean {
        if (this.activeExpressions == null) { return true; }

        const { rowNode } = params;
        const { data } = rowNode;
        for (const columnId of Object.keys(this.activeExpressions)) {
            const input = this.getCellValue({ columnId, data });
            const { model } = this.activeExpressions[columnId];

            if (!model.evaluate(input)) {
                return false;
            }
        }

        return true;
    }

    public getFilterComponentForColumn(column: Column): Component {
        const colId = column.getColId();
        if (this.activeComponents[colId] != null) {
            return this.activeComponents[colId];
        }

        const newComponent = this.expressionComponentFactory.createColumnComponent(column);

        this.transientExpressions[colId] = DEFAULT_EXPRESSION;
        this.activeComponents[colId] = newComponent;

        newComponent.setParameters({
            mutateTransientExpression: (c) => this.mutateTransientExpression(colId, c),
            commitExpression: () => this.commitTransientExpression(colId),
            rollbackExpression: () => this.rollbackTransientExpression(colId),
        });

        return newComponent;
    }

    public mutateTransientExpression(colId: string, change: Partial<Expression>): void {
        this.transientExpressions[colId] = {
            ...(this.transientExpressions[colId] || DEFAULT_EXPRESSION),
            ...change,
        } as Expression;
    }

    public commitTransientExpression(colId: string): void {
        const model = this.expressionModelFactory.buildExpressionModel(this.transientExpressions[colId]);

        if (!model.isValid()) { return; }

        this.activeExpressions[colId] = {
            expression: this.transientExpressions[colId],
            model,
        };
        this.percolateActiveExpression(colId);
    }

    public rollbackTransientExpression(colId: string): void {
        const { expression } = this.activeExpressions[colId] || {};
        this.transientExpressions[colId] = expression || DEFAULT_EXPRESSION;
        this.percolateActiveExpression(colId);
    }

    private percolateActiveExpression(colId: string): void {
        const component = this.activeComponents[colId];

        if (component == null) { return; }

        const { expression } = this.activeExpressions[colId] || {};
        component.expressionUpdated(expression || null);
    }

    private getCellValue(opts: { columnId: string, data: any }): unknown {
        return opts.data[opts.columnId];
    }
}
