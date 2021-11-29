import { _ } from "../utils/utils";
import { Column } from "../entities/column";
import { RowNode } from "../entities/rowNode";
import { Component } from "../widgets/component";
import { ExpressionComponentFactory } from "./components/expressionComponentFactory";
import { ExpressionComponent } from "./components/interfaces";
import { FilterExpression } from "./filterExpression";
import { ExpressionModelFactory } from "./domain/expressionModelFactory";
import { Autowired, Bean } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { FilterChangeListener, FilterStateManager } from "./state/filterStateManager";

@Bean('filterManagerV2')
export class FilterManager extends BeanStub {
    @Autowired('expressionModelFactory') private readonly expressionModelFactory: ExpressionModelFactory;
    @Autowired('expressionComponentFactory') private readonly expressionComponentFactory: ExpressionComponentFactory;
    @Autowired('filterStateManager') private readonly filterState: FilterStateManager;

    private activeComponents: {[key: string]: (ExpressionComponent & Component) } = {};

    public getFilterState(): {[key: string]: FilterExpression} | null {
        return this.filterState.getCurrentState();
    }

    public setFilterState(exprs: {[key: string]: FilterExpression} | null) {
        this.filterState.setCurrentState(exprs);
    }

    public evaluateFilters(params: { rowNode: RowNode, colId?: string }): boolean {
        const currentFilterState = this.filterState.getCurrentState();
        if (currentFilterState == null) { return true; }

        const { rowNode, colId } = params;
        const { data } = rowNode;
        const columns = colId ? [colId] : Object.keys(currentFilterState);
        for (const columnId of columns) {
            const input = this.getCellValue({ columnId, data });
            const state = currentFilterState[columnId];
            const model = this.expressionModelFactory.buildExpressionModel(state);

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

        const newComponent = this.expressionComponentFactory.createFilterComponent(column);
        this.activeComponents[colId] = newComponent;
        newComponent.setParameters({
            stateManager: this.filterState.getStateManager(colId),
        });

        return newComponent;
    }

    public addListenerForColumn(colId: string, cb: FilterChangeListener) {
        this.filterState.addListenerForColumn(colId, cb);
    }

    private getCellValue(opts: { columnId: string, data: any }): unknown {
        return opts.data[opts.columnId];
    }
}
