import { _ } from "../utils/utils";
import { Column } from "../entities/column";
import { RowNode } from "../entities/rowNode";
import { Component } from "../widgets/component";
import { ExpressionComponentFactory } from "./components/expressionComponentFactory";
import { ExpressionComponent } from "./components/interfaces";
import { Expression } from "./expression";
import { ExpressionModelFactory } from "./models/expressionModelFactory";
import { ExpressionModel } from "./models/interfaces";
import { Autowired, Bean } from "../context/context";
import { BeanStub } from "../context/beanStub";

const DEFAULT_EXPRESSION: Expression = {
    type: 'text-op',
    operation: 'equals',
    operands: [''],
};

type FilterChangeType = 'commit' | 'rollback';
interface FilterChangeListener {
    (params: { colId: string, expr: Expression, type: FilterChangeType }): void;
}
interface FilterExpressions {
    [key: string]: {
        expression: Expression;
        model: ExpressionModel<unknown>;
        listeners: FilterChangeListener[];
    };
}

@Bean('filterManagerV2')
export class FilterManager extends BeanStub {
    @Autowired('expressionModelFactory') private readonly expressionModelFactory: ExpressionModelFactory;
    @Autowired('expressionComponentFactory') private readonly expressionComponentFactory: ExpressionComponentFactory;

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

        // New / existing filters case.
        Object.keys(exprs || {}).forEach((colId) => {
            const old = this.activeExpressions[colId];
            const expression = exprs![colId];
            const model = this.expressionModelFactory.buildExpressionModel(expression);
            const listeners = old ? old.listeners : [];

            if (!model.isValid()) {
                throw new Error("AG Grid - invalid filter expression: " + expression);
            }
            newActiveExpressions[colId] = { expression, model, listeners };

            this.percolateActiveExpression(colId);
        });

        // Removed filters case.
        Object.keys(this.activeExpressions).forEach((colId) => {
            if (newActiveExpressions[colId] != null) { return; }

            this.destroyFilterComponentForColumn(colId);
        });

        this.activeExpressions = newActiveExpressions;
    }

    public evaluateFilters(params: { rowNode: RowNode, colId?: string }): boolean {
        if (this.activeExpressions == null) { return true; }

        const { rowNode, colId } = params;
        const { data } = rowNode;
        const columns = colId ? [colId] : Object.keys(this.activeExpressions);
        for (const columnId of columns) {
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
        this.activeComponents[colId] = newComponent;
        newComponent.setParameters({
            mutateTransientExpression: (c) => this.mutateTransientExpression(colId, c),
            isTransientExpressionValid: () => this.isTransientExpressionValid(colId),
            commitExpression: () => this.commitTransientExpression(colId),
            rollbackExpression: () => this.rollbackTransientExpression(colId),
        });

        this.transientExpressions[colId] = DEFAULT_EXPRESSION;
        if (this.activeExpressions[colId] == null) {
            this.activeExpressions[colId] = this.getDefaultFilterExpressionsEntry();
        }

        this.percolateActiveExpression(colId);

        return newComponent;
    }
    public addListenerForColumn(column: Column, listener: FilterChangeListener): void {
        this.activeExpressions[column.getColId()].listeners.push(listener);
    }

    public mutateTransientExpression(colId: string, change: Partial<Expression>): void {
        this.transientExpressions[colId] = {
            ...(this.transientExpressions[colId] || DEFAULT_EXPRESSION),
            ...change,
        } as Expression;
    }

    public isTransientExpressionValid(colId: string): boolean {
        const expr = this.transientExpressions[colId];
        if (expr == null) { return true; }

        const model = this.expressionModelFactory.buildExpressionModel(expr);

        return model.isValid();
    }

    public commitTransientExpression(colId: string): void {
        const { listeners } = this.activeExpressions[colId];
        const model = this.expressionModelFactory.buildExpressionModel(this.transientExpressions[colId]);

        if (!model.isValid()) { return; }

        this.activeExpressions[colId] = {
            expression: this.transientExpressions[colId],
            model,
            listeners,
        };

        this.percolateActiveExpression(colId);
        this.notifyCommitExpression(colId);
    }

    public rollbackTransientExpression(colId: string): void {
        const { expression } = this.activeExpressions[colId] || {};
        this.transientExpressions[colId] = expression || DEFAULT_EXPRESSION;

        this.percolateActiveExpression(colId);
        this.notifyRollbackExpression(colId);
    }

    private percolateActiveExpression(colId: string): void {
        const component = this.activeComponents[colId];

        if (component == null) { return; }

        const { expression } = this.activeExpressions[colId] || {};
        component.expressionUpdated(expression || null);
    }

    private notifyCommitExpression(colId: string) {
        this.notifyListener(colId, 'commit');
    }

    private notifyRollbackExpression(colId: string) {
        this.notifyListener(colId, 'rollback');
    }

    private notifyListener(colId: string, type: FilterChangeType) {
        const { listeners, expression } = this.activeExpressions[colId];

        listeners.forEach((listener) => {
            listener({ type, colId, expr: expression });
        });
    }

    private destroyFilterComponentForColumn(colId: string): void {
        if (this.activeComponents[colId] == null) { return; }

        delete this.activeComponents[colId];
    }

    private getDefaultFilterExpressionsEntry(): FilterExpressions[''] {
        return {
            expression: DEFAULT_EXPRESSION,
            model: this.expressionModelFactory.buildExpressionModel(DEFAULT_EXPRESSION),
            listeners: [],
        };
    }

    private getCellValue(opts: { columnId: string, data: any }): unknown {
        return opts.data[opts.columnId];
    }
}
