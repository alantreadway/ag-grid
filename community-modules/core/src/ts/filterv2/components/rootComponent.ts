import { PostConstruct } from "../../context/context";
import { Component } from "../../widgets/component";
import { RefSelector } from "../../widgets/componentAnnotations";
import { Expression } from "../expression";
import { ExpressionComponent, ExpressionComponentParameters } from "./interfaces";

export class RootComponent extends Component implements ExpressionComponent {
    private params: ExpressionComponentParameters<Expression>;

    @RefSelector('eChildren') private readonly refChildren: HTMLElement;
    @RefSelector('eApplyButton') private readonly refApplyButton: HTMLElement;
    @RefSelector('eResetButton') private readonly refResetButton: HTMLElement;

    public constructor(
        private readonly childComponents: (ExpressionComponent & Component)[],
    ) {
        super(/* html */`
            <div class="ag-filter-wrapper" role="presentation">
                <div class="ag-filter-wrapper-body" ref="eChildren" role="presentation">
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

    public setParameters(params: ExpressionComponentParameters) {
        this.params = params;

        this.childComponents.forEach((comp, i) => {
            comp.setParameters(this.params);
        });
    }

    @PostConstruct
    private postConstruct() {
        this.childComponents.forEach((comp, i) => {
            this.refChildren.appendChild(comp.getGui());
        });

        this.refApplyButton.addEventListener('click', () => {
            this.params.commitExpression();
        });
        this.refResetButton.addEventListener('click', () => {
            this.params.rollbackExpression();
        });
    }

    public expressionUpdated(expr: Expression) {
        this.childComponents.forEach((c, i) => {
            c.expressionUpdated(expr);
        });
    }
}
