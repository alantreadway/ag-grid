import { KeyCode } from "../../constants/keyCode";
import { PostConstruct } from "../../context/context";
import { setDisabled } from "../../utils/dom";
import { Component } from "../../widgets/component";
import { RefSelector } from "../../widgets/componentAnnotations";
import { ExpressionComponent, StateManager } from "./interfaces";

export class RootComponent extends Component implements ExpressionComponent {
    private stateManager: StateManager;

    @RefSelector('eRoot') private readonly refRoot: HTMLElement;
    @RefSelector('eChildren') private readonly refChildren: HTMLElement;
    @RefSelector('eApplyButton') private readonly refApplyButton: HTMLElement;
    @RefSelector('eResetButton') private readonly refResetButton: HTMLElement;

    public constructor(
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

        setDisabled(this.refApplyButton, !valid);
    }
}
