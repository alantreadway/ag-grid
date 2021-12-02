import { _, Autowired, Bean, BeanStub, Column, RowNode } from "@ag-grid-community/core";
import { ExpressionComponent } from "./components/interfaces";
import { FilterExpression } from "./filterExpression";
import { ExpressionModelFactory } from "./domain/expressionModelFactory";
import { FilterChangeListener, FilterStateManager } from "./state/filterStateManager";

@Bean('filterManagerV2')
export class FilterManager extends BeanStub {
    @Autowired('expressionModelFactory') private readonly expressionModelFactory: ExpressionModelFactory;
    @Autowired('filterStateManager') private readonly filterState: FilterStateManager;

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

    public initaliseFilterComponent<T extends ExpressionComponent>(column: Column, comp: T): T {
        comp.setParameters({
            stateManager: this.filterState.getStateManager(column.getColId()),
        });
        return comp;
    }

    public addListenerForColumn(colId: string, cb: FilterChangeListener) {
        this.filterState.addListenerForColumn(colId, cb);
    }

    private getCellValue(opts: { columnId: string, data: any }): unknown {
        return opts.data[opts.columnId];
    }
}
