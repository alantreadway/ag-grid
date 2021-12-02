import { Component, KeyCode, PostConstruct, RefSelector, _ } from "@ag-grid-community/core";
import { ExpressionComponent, StateManager } from "./interfaces";

export abstract class RootComponent extends Component implements ExpressionComponent {
    private stateManager: StateManager;

    @RefSelector('eRoot') private readonly refRoot: HTMLElement;
    @RefSelector('eChildren') private readonly refChildren: HTMLElement;
    @RefSelector('eApplyButton') private readonly refApplyButton: HTMLElement;
    @RefSelector('eResetButton') private readonly refResetButton: HTMLElement;

    protected constructor(
        private readonly childComponents: (ExpressionComponent & Component)[],
    ) {
        super(/* html */`
            <div class="ag-filter-wrapper" ref="eRoot" role="presentation">
                <div class="ag-root-filter-body-wrapper"  ref="eChildren" role="presentation">
                </div>
                <button
                    type="button"
                    ref="eApplyButton"
                    class="ag-standard-button ag-filter-apply-panel-button"
                >
                Apply
                </button>
                <button
                    type="button"
                    ref="eResetButton"
                    class="ag-standard-button ag-filter-apply-panel-button"
                >
                Reset
                </button>
            </div>
        `);
    }

    public setParameters(params: { stateManager: StateManager }) {
        this.stateManager = params.stateManager;

        this.childComponents.forEach((comp, i) => {
            comp.setParameters({
                ...params,
            });
        });

        this.stateManager.addUpdateListener(() => this.updateButtonState());
        this.stateManager.addTransientUpdateListener(() => this.updateButtonState());

        this.updateButtonState();
    }

    @PostConstruct
    private postConstruct() {
        this.childComponents.forEach((comp) => {
            this.refChildren.appendChild(comp.getGui());
        });

        this.refApplyButton.addEventListener('click', () => {
            this.stateManager.commitExpression();
        });
        this.refResetButton.addEventListener('click', () => {
            this.stateManager.rollbackExpression();
        });

        this.refRoot.addEventListener('keypress', (e) => {
            if (e.key === KeyCode.ENTER) {
                if (this.stateManager.isTransientExpressionValid()) {
                    this.stateManager.commitExpression();
                }
            }
        });
    }

    private updateButtonState(): void {
        const valid = this.stateManager.isTransientExpressionValid();

        _.setDisabled(this.refApplyButton, !valid);
    }
}
