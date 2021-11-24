import { PostConstruct } from "../../../context/context";
import { AgPromise } from "../../../utils/promise";
import { AgRadioButton } from "../../../widgets/agRadioButton";
import { RefSelector } from "../../../widgets/componentAnnotations";
import { ManagedFocusFeature } from "../../../widgets/managedFocusFeature";
import { DEFAULT_FILTER_LOCALE_TEXT, IFilterLocaleText, IFilterTitleLocaleText } from "../../filterLocaleText";
import { ICompositeProvidedFilterParams } from "../compositeProvidedFilter";
import { FilterUIComponent, FilterUIComponentController } from "./filterUIComponent";

export type JoinOperator = 'AND' | 'OR';
export type LogicalOperatorModel<M> = {
    filterType: string;
    operator: JoinOperator;
    condition1: M | null;
    condition2: M | null;
}

type UIComponentConstructor<M> = (p: ICompositeProvidedFilterParams, c: FilterUIComponentController) => FilterUIComponent<M>;

export class LogicalOperatorUIComponent<M> extends FilterUIComponent<LogicalOperatorModel<M>> {
    private params: ICompositeProvidedFilterParams;

    private joinOperator: JoinOperator = 'AND';
    private uiSubComponents: FilterUIComponent<M>[] = [];

    @RefSelector('eJoinOperatorPanel') protected readonly eJoinOperatorPanel: HTMLElement;
    @RefSelector('eJoinOperatorAnd') protected readonly eJoinOperatorAnd: AgRadioButton;
    @RefSelector('eJoinOperatorOr') protected readonly eJoinOperatorOr: AgRadioButton;
    @RefSelector('eCondition1Body') protected readonly eCondition1Body: HTMLElement;
    @RefSelector('eCondition2Body') protected readonly eCondition2Body: HTMLElement;

    public constructor(
        private readonly controller: FilterUIComponentController,
        private readonly newFilterUiComponent: UIComponentConstructor<M>,
    ) {
        super();
    }

    @PostConstruct
    protected postConstruct(): void {
        this.resetTemplate();
        this.createManagedBean(new ManagedFocusFeature(this.getFocusableElement()));
    }
    
    public setParams(params: ICompositeProvidedFilterParams) {
        this.params = params;

        this.uiSubComponents.forEach(c => c.setParams(params));
    }

    public init() {
        this.uiSubComponents.forEach(c => c.init());

        this.resetUiToDefaults().then(() => {
            this.updateUiVisibility();
        });
    }

    public destroy(): void {
        this.uiSubComponents.forEach(c => c.destroy());
    }

    public getFilterTitle(): string {
        return this.translate(this.controller.filterNameKey);
    }

    public getModelFromUi(): LogicalOperatorModel<M> | null {
        const subModels = this.uiSubComponents.map(c => c.getModelFromUi());

        const firstModel = subModels[0];
        if (firstModel == null) {
            return null;
        }

        return {
            filterType: firstModel.filterType,
            operator: this.joinOperator,
            condition1: subModels[0],
            condition2: subModels[1],
        };
    }

    public setModelIntoUi(model: LogicalOperatorModel<M>): AgPromise<void> {
        throw new Error("Method not implemented.");
    }

    public resetUiToDefaults(): AgPromise<void> {
        const subInjectionPoints = [this.eCondition1Body, this.eCondition2Body];

        this.joinOperator = 'AND';

        this.uiSubComponents.forEach(c => c.destroy());

        this.uiSubComponents = [
            this.newFilterUiComponent(this.params, this.controller),
            this.newFilterUiComponent(this.params, this.controller),
        ];
        this.uiSubComponents.forEach((c, i) => subInjectionPoints[i].replaceChildren(c.getGui()));
        this.uiSubComponents.forEach(c => c.init());

        return AgPromise.all(this.uiSubComponents.map(c => c.resetUiToDefaults()))
            .then(() => null);
    }

    private resetTemplate(paramsMap?: any) {
        const templateString = /* html */`
            <div class="ag-filter-wrapper">
                <div class="ag-filter-body-wrapper ag-logical-operator-body-wrapper">
                    <div ref="eCondition1Body"></div>
                    <div class="ag-filter-condition" ref="eJoinOperatorPanel">
                        <ag-radio-button ref="eJoinOperatorAnd" class="ag-filter-condition-operator ag-filter-condition-operator-and"></ag-radio-button>
                        <ag-radio-button ref="eJoinOperatorOr" class="ag-filter-condition-operator ag-filter-condition-operator-or"></ag-radio-button>
                    </div>
                    <div ref="eCondition2Body"></div>
                 </div>
            </div>`;

        this.setTemplate(templateString, paramsMap);
    }

    private updateUiVisibility(): void {

    }

    private translate(key: keyof IFilterLocaleText | keyof IFilterTitleLocaleText): string {
        const translate = this.gridOptionsWrapper.getLocaleTextFunc();

        return translate(key, DEFAULT_FILTER_LOCALE_TEXT[key]);
    }
}