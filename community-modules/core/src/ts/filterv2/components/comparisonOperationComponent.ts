import { PostConstruct } from "../../context/context";
import { setDisplayed } from "../../utils/dom";
import { AgSelect } from "../../widgets/agSelect";
import { Component } from "../../widgets/component";
import { RefSelector } from "../../widgets/componentAnnotations";
import { comparisonOperationOperandCardinality, Expression, isTextComparisonOperation, TextComparisonOperationExpression, isTextComparisonOperationExpression, TextComparisonOperation, TEXT_COMPARISON_OPERATION_METADATA } from "../expression";
import { ExpressionComponent, ExpressionComponentParameters, OperandComponent } from "./interfaces";

export class ComparisonOperationComponent<O = string> extends Component implements ExpressionComponent {
    private params: ExpressionComponentParameters<Expression>;

    @RefSelector('eOperationSelect')
    private readonly refOperationSelect: AgSelect;

    @RefSelector('eChild0') private readonly refChild0: HTMLElement;
    @RefSelector('eChild1') private readonly refChild1: HTMLElement;
    @RefSelector('eChild2') private readonly refChild2: HTMLElement;
    @RefSelector('eChild3') private readonly refChild3: HTMLElement;

    private readonly refChildren: HTMLElement[] = [];

    private transientExpression: TextComparisonOperationExpression<any> | null = null;

    public constructor(
        private readonly childComponents: (OperandComponent & Component)[],
    ) {
        super(/* html */`
            <div class="ag-filter-wrapper" role="presentation">
                <ag-select class="ag-filter-select" ref="eOperationSelect"></ag-select>
                ${
                    childComponents.map((_, i) => `
                        <div class="ag-filter-body" ref="eChild${i}" role="presentation">
                        </div>
                    `.trim()).join('')
                }
            </div>
        `);
    }

    public setParameters(params: ExpressionComponentParameters) {
        this.params = params;

        this.childComponents.forEach((comp, i) => {
            comp.setParameters({
                ...this.params,
                mutateTransientOperand: (m) => this.childMutation(m, i),
            });
        });
    }

    @PostConstruct
    private postConstruct() {
        this.refChildren.push(
            ...[this.refChild0, this.refChild1, this.refChild2, this.refChild3]
                .filter(v => v != null)
        );
        this.refOperationSelect.onValueChange((m) => this.operationMutation(m));

        this.childComponents.forEach((comp, i) => {
            this.refChildren[i].appendChild(comp.getGui());
        });

        Object.keys(TEXT_COMPARISON_OPERATION_METADATA).forEach((op) => {
            this.refOperationSelect.addOption({ value: op });
        });
        this.updateElementVisibility(null);
    }

    private updateElementVisibility(op: TextComparisonOperation | null) {
        const childLimit = op ?
            comparisonOperationOperandCardinality(op) :
            0;
        this.refChildren.forEach((childElement, index) => {
            setDisplayed(childElement, index < childLimit);
        });
    }

    public expressionUpdated(expr: Expression) {
        if (!isTextComparisonOperationExpression(expr)) {
            throw new Error('AG Grid - Unsupported expression type: ' + expr.type);
        }

        this.refOperationSelect.setValue(expr.operation, true);
        this.childComponents.forEach((c, i) => {
            c.operandUpdated(expr.operands[i] || null);
        });
        this.transientExpression = expr;

        this.updateElementVisibility(expr.operation);
    }

    private childMutation(mutation: string | null, index: number): void {
        const modifiedOperands = this.transientExpression ? [...this.transientExpression.operands] : [];

        if (mutation == null) {
            delete modifiedOperands[index];
        } else {
            modifiedOperands[index] = mutation;
        }

        this.mutation({ operands: modifiedOperands } as Expression);
    }

    private operationMutation(mutation: string | null | undefined): void {
        if (mutation && isTextComparisonOperation(mutation)) {
            this.mutation({ operation: mutation });
            this.updateElementVisibility(mutation);
        }
    }

    private mutation(mutation: Partial<Expression>): void {
        if (this.transientExpression) {
            this.transientExpression = {
                ...this.transientExpression,
                ...mutation,
            } as any;
        }

        this.params.mutateTransientExpression(mutation);
    }
}
