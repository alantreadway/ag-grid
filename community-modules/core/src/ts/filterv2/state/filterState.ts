import { Autowired, Bean } from "../../context/context";
import { StateManager } from "../components/interfaces";
import { ExpressionModelFactory } from "../domain/expressionModelFactory";
import { ExpressionModel } from "../domain/interfaces";
import { FilterExpression } from "../filterExpression";
import { ListenerManager } from "./listenerManager";

const DEFAULT_EXPRESSION: FilterExpression<unknown> = {
    type: 'text-op',
    operation: 'equals',
    operands: [''],
};

type FilterChangeType = 'update' | 'commit' | 'rollback' | 'destroy';
export interface FilterChangeListener {
    (params: { colId: string, expr: FilterExpression<unknown> | null, type: FilterChangeType }): void;
}

interface ActiveState {
    model: ExpressionModel<unknown>;
    listeners: ListenerManager<FilterChangeListener>;
};

interface TransientState {
    expr: FilterExpression<unknown> | null;
    listeners: ListenerManager<FilterChangeListener>;
}

@Bean('filterState')
export class FilterState {
    @Autowired('expressionModelFactory') private readonly expressionModelFactory: ExpressionModelFactory;
    
    private currentState: {[key: string]: ActiveState} = {};
    private transientState: {[key: string]: TransientState} = {};
    
    public getCurrentState(): {[key: string]: FilterExpression<unknown>} | null {
        const result: {[key: string]: FilterExpression<unknown>} = {};
        
        let count = 0;
        Object.keys(this.currentState).forEach((colId) => {
            result[colId] = this.currentState[colId].model.toFilterExpression();
            count++;
        });
        
        return count > 0 ? result : null;
    }
    
    public setCurrentState(exprs: { [key: string]: FilterExpression<unknown>; } | null) {
        const newActiveExpressions: {[key: string]: ActiveState} = {};
        
        // New / existing filters case.
        Object.keys(exprs || {}).forEach((colId) => {
            const old = this.currentState[colId];
            const expression = exprs![colId];
            const model = this.expressionModelFactory.buildExpressionModel(expression);
            const listeners = old ? old.listeners : new ListenerManager();
            
            if (!model.isValid()) {
                throw new Error("AG Grid - invalid filter expression: " + expression);
            }
            newActiveExpressions[colId] = { model, listeners };
            
            this.notifyListenersForColumn(colId, 'update');
        });
        
        // Removed filters case.
        Object.keys(this.currentState).forEach((colId) => {
            if (newActiveExpressions[colId] != null) { return; }
            
            this.notifyListenersForColumn(colId, 'destroy');
        });
        
        this.currentState = newActiveExpressions;
    }
    
    public addListenerForColumn(colId: string, listener: FilterChangeListener): void {
        this.getStateFor(colId).listeners.addListener(listener);
    }

    public addTransientListenerForColumn(colId: string, listener: FilterChangeListener): void {
        this.getTransientStateFor(colId).listeners.addListener(listener);
    }

    public getStateManager(colId: string): StateManager<FilterExpression<any>> {
        const transientState = this.getTransientStateFor(colId);

        return {
            addTransientUpdateListener: (cb) => this.addTransientListenerForColumn(colId, ({ expr }) => cb(expr)),
            addUpdateListener: (cb) => this.addListenerForColumn(colId, ({ expr }) => cb(expr)),
            commitExpression: () => this.commitTransientExpression(colId),
            mutateTransientExpression: (m) => this.mutateTransientExpression(colId, m),
            rollbackExpression: () => this.rollbackTransientExpression(colId),
            isTransientExpressionValid: () => this.isTransientExpressionValid(colId),
            getTransientExpression: () => transientState.expr,
        };
    }

    private getStateFor(colId: string): ActiveState {
        if(!this.currentState[colId]) {
            this.currentState[colId] = {
                listeners: new ListenerManager(),
                model: this.expressionModelFactory.buildExpressionModel(DEFAULT_EXPRESSION),
            };
        }

        return this.currentState[colId];
    }
    
    private getTransientStateFor(colId: string): TransientState {
        if(!this.transientState[colId]) {
            this.transientState[colId] = {
                listeners: new ListenerManager(),
                expr: this.currentState[colId] ? this.currentState[colId].model.toFilterExpression() : DEFAULT_EXPRESSION,
            };
        }

        return this.transientState[colId];
    }
    
    private notifyListenersForColumn(colId: string, type: FilterChangeType): void {
        const { listeners, model} = this.getStateFor(colId);
        const expression = model.toFilterExpression();
        
        listeners.notify({ colId, type, expr: expression });
    }

    private notifyTransientListenersForColumn(colId: string, type: FilterChangeType): void {
        const { listeners, expr } = this.getTransientStateFor(colId);
        
        listeners.notify({ colId, type, expr: expr || DEFAULT_EXPRESSION });
    }

    private mutateTransientExpression<T>(colId: string, change: Partial<FilterExpression<T>> | null): void {
        if (change == null) {
            this.transientState[colId].expr = null;
        }

        this.transientState[colId].expr = {
            ...(this.transientState[colId].expr || DEFAULT_EXPRESSION),
            ...change,
        } as FilterExpression<T>;

        this.notifyTransientListenersForColumn(colId, 'update');
    }

    private isTransientExpressionValid(colId: string): boolean {
        const { expr } = this.transientState[colId];
        if (expr == null) { return true; }

        const model = this.expressionModelFactory.buildExpressionModel(expr);

        return model.isValid();
    }

    private commitTransientExpression(colId: string): void {
        const { listeners } = this.currentState[colId];
        const { expr } = this.transientState[colId] || {};

        if (expr == null) {
            this.notifyListenersForColumn(colId, 'destroy');
            delete this.currentState[colId];
            return;
        }

        const model = this.expressionModelFactory.buildExpressionModel(expr);

        if (!model.isValid()) { return; }

        this.currentState[colId] = {
            model,
            listeners,
        };

        listeners.notify({ type: 'commit', colId, expr });
    }

    private rollbackTransientExpression(colId: string): void {
        const { model, listeners } = this.currentState[colId] || {};
        const expr = model ? model.toFilterExpression() : null;
        this.transientState[colId].expr = expr || DEFAULT_EXPRESSION;

        listeners.notify({ type: 'rollback', colId, expr });
    }
}