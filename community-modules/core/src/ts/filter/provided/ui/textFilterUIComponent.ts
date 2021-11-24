import { PostConstruct } from "../../../context/context";
import { IAfterGuiAttachedParams } from "../../../interfaces/iAfterGuiAttachedParams";
import { addCssClass, loadTemplate, setDisabled } from "../../../utils/dom";
import { debounce } from "../../../utils/function";
import { AgPromise } from "../../../utils/promise";
import { convertToSet } from "../../../utils/set";
import { AgInputTextField } from "../../../widgets/agInputTextField";
import { Component } from "../../../widgets/component";
import { RefSelector } from "../../../widgets/componentAnnotations";
import { ManagedFocusFeature } from "../../../widgets/managedFocusFeature";
import { PopupEventParams } from "../../../widgets/popupService";
import { DEFAULT_FILTER_LOCALE_TEXT, IFilterLocaleText, IFilterTitleLocaleText } from "../../filterLocaleText";
import { ICompositeProvidedFilterParams } from "../compositeProvidedFilter";
import { FilterButtonType, ProvidedFilter } from "../providedFilter";
import { FilterUIComponent, FilterUIComponentController } from "./filterUIComponent";

export class TextFilterUIComponent<M> extends Component implements FilterUIComponent<M> {
    private params: ICompositeProvidedFilterParams;
    private applyActive = false;
    private hidePopup: ((params: PopupEventParams) => void) | null | undefined = null;

    // a debounce of the onBtApply method
    private onBtApplyDebounce: () => void;

    protected abstract updateUiVisibility(): void;
    protected abstract createBodyTemplate(): string;
    protected abstract getCssIdentifier(): string;
    protected abstract resetUiToDefaults(silent?: boolean): AgPromise<void>;

    @RefSelector('eValue-index0') private readonly eValueFrom1: AgInputTextField;
    @RefSelector('eValue-index1') private readonly eValueTo1: AgInputTextField;

    public constructor(
        private readonly controller: FilterUIComponentController,
    ) {
        super();
    }

    @PostConstruct
    protected postConstruct(): void {
        this.resetTemplate(); // do this first to create the DOM
        this.createManagedBean(new ManagedFocusFeature(
            this.getFocusableElement(),
            {
                handleKeyDown: this.handleKeyDown.bind(this)
            }
        ));
    }
    
    public setParams(params: ICompositeProvidedFilterParams) {
        this.params = params;

        this.applyActive = ProvidedFilter.isUseApplyButton(params);
        this.createButtonPanel();
    }

    public init() {
        this.resetUiToDefaults(true).then(() => {
            this.updateUiVisibility();
            this.setupOnBtApplyDebounce();
        });
    }

    public destroy(): void {
        this.hidePopup = null;

        super.destroy();
    }

    public close(e?: Event): void {
        if (!this.hidePopup) { return; }

        const keyboardEvent = e as KeyboardEvent;
        const key = keyboardEvent && keyboardEvent.key;
        let params: PopupEventParams;

        if (key === 'Enter' || key === 'Space') {
            params = { keyboardEvent };
        }

        this.hidePopup(params!);
        this.hidePopup = null;
    }

    public getFrameworkComponentInstance(): any {

    }

    // override
    protected handleKeyDown(e: KeyboardEvent): void {}

    public getFilterTitle(): string {
        return this.translate(this.controller.filterNameKey);
    }

    protected resetTemplate(paramsMap?: any) {
        const templateString = /* html */`
            <div class="ag-filter-wrapper">
                <div class="ag-filter-body-wrapper ag-${this.getCssIdentifier()}-body-wrapper">
                    <ag-select class="ag-filter-select" ref="eOptions1"></ag-select>
                    <div class="ag-filter-body" ref="eConditionBody" role="presentation">
                        <ag-input-text-field class=".ag-filter-from ag-filter-filter" ref="eValue-index0"></ag-input-text-field>
                        <ag-input-text-field class="ag-filter-to ag-filter-filter" ref="eValue-index1"></ag-input-text-field>
                    </div>
                    </div>
            </div>`;

        this.setTemplate(templateString, paramsMap);
    }

    private createButtonPanel(): void {
        const { buttons } = this.params;

        if (!buttons || buttons.length < 1 || this.isReadOnly()) {
            return;
        }

        const eButtonsPanel = document.createElement('div');

        addCssClass(eButtonsPanel, 'ag-filter-apply-panel');

        const addButton = (type: FilterButtonType): void => {
            let text;
            let clickListener: (e?: Event) => void;

            switch (type) {
                case 'apply':
                    text = this.translate('applyFilter');
                    clickListener = (e) => this.onBtApply(false, false, e);
                    break;
                case 'clear':
                    text = this.translate('clearFilter');
                    clickListener = () => this.onBtClear();
                    break;
                case 'reset':
                    text = this.translate('resetFilter');
                    clickListener = () => this.onBtReset();
                    break;
                case 'cancel':
                    text = this.translate('cancelFilter');
                    clickListener = (e) => { this.onBtCancel(e!); };
                    break;
                default:
                    console.warn('Unknown button type specified');
                    return;
            }

            const button = loadTemplate(
                /* html */
                `<button
                    type="button"
                    ref="${type}FilterButton"
                    class="ag-standard-button ag-filter-apply-panel-button"
                >${text}
                </button>`
            );

            eButtonsPanel.appendChild(button);
            this.addManagedListener(button, 'click', clickListener);
        };

        convertToSet(buttons).forEach(type => addButton(type));

        this.getGui().appendChild(eButtonsPanel);
    }

    protected onBtApply(afterFloatingFilter = false, afterDataChange = false, e?: Event): void {
        this.controller.applyModel();

        const { closeOnApply } = this.params;

        // only close if an apply button is visible, otherwise we'd be closing every time a change was made!
        if (closeOnApply && this.applyActive && !afterFloatingFilter && !afterDataChange) {
            this.close(e);
        }
    }

    private onBtCancel(e: Event): void {
        this.controller.cancelModel();
        if (this.params.closeOnApply) {
            this.close(e);
        }
    }

    private onBtClear(): void {
        this.resetUiToDefaults().then(() => this.onUiChanged());
    }

    private onBtReset(): void {
        this.onBtClear();
        this.onBtApply();
    }



    // subclasses can override this to provide alternative debounce defaults
    protected getDefaultDebounceMs(): number {
        return 0;
    }

    private setupOnBtApplyDebounce(): void {
        const debounceMs = ProvidedFilter.getDebounceMs(this.params, this.getDefaultDebounceMs());
        this.onBtApplyDebounce = debounce(this.onBtApply.bind(this), debounceMs);
    }

    /**
     * By default, if the change came from a floating filter it will be applied immediately, otherwise if there is no
     * apply button it will be applied after a debounce, otherwise it will not be applied at all. This behaviour can
     * be adjusted by using the apply parameter.
     */
    protected onUiChanged(fromFloatingFilter = false, apply?: 'immediately' | 'debounce' | 'prevent'): void {
        this.updateUiVisibility();
        this.params.filterModifiedCallback();

        if (this.applyActive && !this.isReadOnly) {
            const isValid = this.isModelValid(this.getModelFromUi()!);

            setDisabled(this.getRefElement('applyFilterButton'), !isValid);
        }

        if ((fromFloatingFilter && !apply) || apply === 'immediately') {
            this.onBtApply(fromFloatingFilter);
        } else if ((!this.applyActive && !apply) || apply === 'debounce') {
            this.onBtApplyDebounce();
        }
    }

    public afterGuiAttached(params?: IAfterGuiAttachedParams): void {
        if (params == null) { return; }

        this.hidePopup = params.hidePopup;
    }

    protected translate(key: keyof IFilterLocaleText | keyof IFilterTitleLocaleText): string {
        const translate = this.gridOptionsWrapper.getLocaleTextFunc();

        return translate(key, DEFAULT_FILTER_LOCALE_TEXT[key]);
    }

    protected isReadOnly(): boolean {
        return !!this.params.readOnly;
    }
}