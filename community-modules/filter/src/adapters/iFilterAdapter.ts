import { Autowired, AgPromise, Component, IFilterComp, RefSelector, IFilterParams, IDoesFilterPassParams, Column } from "@ag-grid-community/core";
import { TextFilter } from "../components/filters/textFilter";
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
        const comp = this.createFilterComponent(column);
        this.filterRoot.appendChild(comp.getGui());

        this.filterManager.addListenerForColumn(column.getColId(), ({ type }) => {
            if (type === 'rollback') { return; }

            filterChangedCallback();
        });
    }

    public isFilterActive(): boolean {
        const colId = this.getColId();
        const exprs = (this.filterManager.getFilterState() || {});
        const expr = exprs[colId];

        return expr != null;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        const { node } = params;
        const colId = this.getColId();

        return this.filterManager.evaluateFilters({ rowNode: node, colId });
    }

    public getModel() {
        return this.filterManager.getFilterState();
    }

    public setModel(model: any): void | AgPromise<void> {
        this.filterManager.setFilterState(model);
    }

    public destroy() {
        super.destroy();
    }

    private createFilterComponent(column: Column) {
        // @todo: Replace with UserComponentFactory?
        return new TextFilter();
    }

    private getColId() {
        return this.params.column.getColId();
    }
}
