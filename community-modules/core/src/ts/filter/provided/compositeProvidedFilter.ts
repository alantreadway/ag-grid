import { IDoesFilterPassParams, IFilterComp } from '../../interfaces/iFilter';
import { Autowired } from '../../context/context';
import { IRowModel } from '../../interfaces/iRowModel';
import { AgPromise } from '../../utils/promise';
import { IFilterTitleLocaleText } from '../filterLocaleText';
import { Component } from '../../widgets/component';
import { RowNode } from '../../entities/rowNode';
import { IProvidedFilterParams } from './providedFilter';

import { FilterUIComponent, FilterUIComponentController } from './ui/filterUIComponent';
import { FilterLogic } from './logic/filterLogic';

export interface ICompositeProvidedFilterParams extends IProvidedFilterParams {
}

/**
 * @param M type of filter-model managed by an instance of this class.
 * @param V type of value managed by an instance of this class.
 */
export class CompositeProvidedFilter<M, V> extends Component implements IFilterComp {
    private uiComponent?: FilterUIComponent<M>;
    private logic?: FilterLogic<M>;
    private params: ICompositeProvidedFilterParams;

    private readonly uiControllerInterface: FilterUIComponentController;

    private appliedModel: M | null = null;

    @Autowired('rowModel') protected readonly rowModel: IRowModel;

    constructor(
        private readonly filterNameKey: keyof IFilterTitleLocaleText,
        private readonly filterType: string,
        private readonly newFilterLogic: (params: ICompositeProvidedFilterParams) => FilterLogic<M>,
        private readonly newFilterUiComponent: (params: ICompositeProvidedFilterParams, ctrl: FilterUIComponentController) => FilterUIComponent<M>,
    ) {
        super();

        this.uiControllerInterface = {
            filterNameKey: this.filterNameKey,
            applyModel: () => this.applyUiInputs(),
            cancelModel: () => this.cancelUiInputs(),
        };
    }

    public init(params: ICompositeProvidedFilterParams): void {
        this.params = params;

        this.optUi(u => u.setParams(params));
        this.optUi(u => u.init());
        this.optLogic(l => l.setParams(params));
    }

    public destroy(): void {
        this.optUi(u => u.destroy());

        this.uiComponent = undefined;
        this.logic = undefined;
    }

    public doesFilterPass(params: IDoesFilterPassParams): boolean {
        return this.reqLogic(l => l.doesPassFilter(params, this.appliedModel));
    }

    public isFilterActive(): boolean {
        // filter is active if we have a valid applied model
        return !!this.appliedModel;
    }

    public getModel(): M | null {
        return this.appliedModel;
    }

    public setModel(model: M | null): AgPromise<void> {
        if (model == null) {
            this.logic = undefined;
            this.appliedModel = null;

            return this.optUi(u => u.resetUiToDefaults()) || AgPromise.resolve();
        }

        if (!this.reqLogic(l => l.isModelValid(model))) {
            return AgPromise.resolve();
        }

        this.appliedModel = model;

        return this.optUi(u => u.setModelIntoUi(model)) || AgPromise.resolve();
    }

    public onNewRowsLoaded(): void {
        this.appliedModel = null;
        this.logic = undefined;

        this.optUi(ui => ui.resetUiToDefaults());
    }

    private applyUiInputs(): boolean {
        return this.reqBoth((ui, logic) => {
            const newModel = ui.getModelFromUi();

            if (!logic.isModelValid(newModel)) { return false; }
            if (logic.areModelsEqual(newModel, this.appliedModel)) { return false; }

            this.appliedModel = newModel;
            this.params.filterChangedCallback();

            return true;
        });
    }

    private cancelUiInputs(): void {
        this.optUi(ui => {
            if (this.appliedModel != null) {
                ui.setModelIntoUi(this.appliedModel);
            } else {
                ui.resetUiToDefaults();
            }
        });
    }

    private reqBoth<T>(cb: (uiComponent: FilterUIComponent<M>, logic: FilterLogic<M>) => T): T {
        if (!this.uiComponent) {
            this.uiComponent = this.newFilterUiComponent(this.params, this.uiControllerInterface);
        }

        if (!this.logic) {
            this.logic = this.newFilterLogic(this.params);
        }

        return cb(this.uiComponent, this.logic);
    }

    private reqUi<T>(cb: (uiComponent: FilterUIComponent<M>) => T): T {
        if (!this.uiComponent) {
            this.uiComponent = this.newFilterUiComponent(this.params, this.uiControllerInterface);
        }

        return cb(this.uiComponent);
    }

    private reqLogic<T>(cb: (logic: FilterLogic<M>) => T): T {
        if (!this.logic) {
            this.logic = this.newFilterLogic(this.params);
        }

        return cb(this.logic);
    }

    private optUi<T>(cb: (uiComponent: FilterUIComponent<M>) => T): T | undefined {
        if (this.uiComponent) {
            return cb(this.uiComponent);
        }
    }

    private optLogic<T>(cb: (logic: FilterLogic<M>) => T): T | undefined {
        if (this.logic) {
            return cb(this.logic);
        }
    }
}
