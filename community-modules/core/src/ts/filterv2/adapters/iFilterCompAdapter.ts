import { Autowired } from "../../context/context";
import { IDoesFilterPassParams, IFilterComp, IFilterParams } from "../../interfaces/iFilter";
import { AgPromise } from "../../utils";
import { Component } from "../../widgets/component";
import { RefSelector } from "../../widgets/componentAnnotations";
import { FilterManager } from "../filterManager";

export class IFilterAdapter extends Component implements IFilterComp {
    @Autowired('filterManagerV2') private readonly filterManager: FilterManager;

    @RefSelector('eFilterRoot') private readonly filterRoot: HTMLElement;

    private params: IFilterParams;

    public constructor() {
        super(/* html */`
            <div class="ag-filter-adapter" ref="eFilterRoot" role="presentation">
            </div>
        `);
    }

    public init(params: IFilterParams) {
        this.params = params;

        const { column, filterChangedCallback } = params;
        const comp = this.filterManager.getFilterComponentForColumn(column);
        this.filterRoot.appendChild(comp.getGui());

        this.filterManager.addListenerForColumn(column, ({ type }) => {
            if (type === 'rollback') { return; }

            filterChangedCallback();
        });
    }

    public isFilterActive(): boolean {
        const colId = this.getColId();
        const exprs = (this.filterManager.getFilterExpressions() || {});
        const expr = exprs[colId];

        return expr != null;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        const { node } = params;
        const colId = this.getColId();

        return this.filterManager.evaluateFilters({ rowNode: node, colId });
    }

    public getModel() {
        return this.filterManager.getFilterExpressions();
    }

    public setModel(model: any): void | AgPromise<void> {
        this.filterManager.setFilterExpressions(model);
    }

    public destroy() {
        super.destroy();
    }

    private getColId() {
        return this.params.column.getColId();
    }
}
