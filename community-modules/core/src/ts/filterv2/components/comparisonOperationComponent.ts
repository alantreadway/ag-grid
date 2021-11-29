import { PostConstruct } from "../../context/context";
import { setDisplayed } from "../../utils/dom";
import { AgSelect } from "../../widgets/agSelect";
import { Component } from "../../widgets/component";
import { RefSelector } from "../../widgets/componentAnnotations";
import { comparisonOperationOperandCardinality, isTextComparisonOperation, TextComparisonOperation, TEXT_COMPARISON_OPERATION_METADATA, ConcreteExpression, ScalarComparisonOperation } from "../filterExpression";
import { ExpressionComponent, OperandComponent, StateManager } from "./interfaces";

export class ComparisonOperationComponent<T = string> extends Component implements ExpressionComponent<T, ConcreteExpression<T>> {
    private stateManager: StateManager<ConcreteExpression<T>>;

    @RefSelector('eOperationSelect')
    private readonly refOperationSelect: AgSelect;

    @RefSelector('eChild0') private readonly refChild0: HTMLElement;
    @RefSelector('eChild1') private readonly refChild1: HTMLElement;
    @RefSelector('eChild2') private readonly refChild2: HTMLElement;
    @RefSelector('eChild3') private readonly refChild3: HTMLElement;

    private readonly refChildren: HTMLElement[] = [];

    private transientOperands: T[];

    public constructor(
        private readonly childComponents: (OperandComponent<T> & Component)[],
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

    public setParameters(params: { stateManager: StateManager<ConcreteExpression<T>> }) {
        this.stateManager = params.stateManager;

        this.transientOperands = [];
        this.childComponents.forEach((comp, i) => {
            comp.setParameters({
                ...params,
                stateManager: new OperandStateManagerAdapter(this.stateManager, i, this.transientOperands),
            });
        });

        this.stateManager.addUpdateListener((u) => this.expressionUpdated(u));
        this.stateManager.addTransientUpdateListener((u) => this.updateElementVisibility(u ? u.operation : null));

        this.expressionUpdated(this.stateManager.getTransientExpression());
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

    private updateElementVisibility(op: TextComparisonOperation | ScalarComparisonOperation | null) {
        const childLimit = op ?
            comparisonOperationOperandCardinality(op) :
            0;
        this.refChildren.forEach((childElement, index) => {
            setDisplayed(childElement, index < childLimit);
        });
    }

    private expressionUpdated(expr: ConcreteExpression<T> | null) {
        this.transientOperands.splice(0);

        if (expr == null) {
            this.refOperationSelect.setValue(null, true);
        } else {
            this.refOperationSelect.setValue(expr.operation, true);
            this.transientOperands.push(...expr.operands as any);
        }

        this.updateElementVisibility(expr ? expr.operation : null);
    }

    private operationMutation(mutation: string | null | undefined): void {
        if (mutation && isTextComparisonOperation(mutation)) {
            this.stateManager.mutateTransientExpression({ operation: mutation });
            this.updateElementVisibility(mutation);
        }
    }
}

/** Adapts StateManager for the entire expression to be narrower-scoped for OperandComponents */
class OperandStateManagerAdapter<T, E extends ConcreteExpression<T>> implements StateManager<T> {
    public constructor(
        private readonly parent: StateManager<E>,
        private readonly operandIndex: number,
        private readonly sharedOperandState: (T | null)[],
    ) {
    }

    public addUpdateListener(cb: (newState: T | null) => void): void {
        this.parent.addUpdateListener((pState) => {
            const update =  pState ? pState.operands[this.operandIndex] as T : null;
            this.sharedOperandState[this.operandIndex] = update;
            cb(update);
        });
    }

    public addTransientUpdateListener(cb: (newTransientState: T | null) => void): void {
        this.parent.addTransientUpdateListener((pState) => {
            const update =  pState ? pState.operands[this.operandIndex] as T : null;
            this.sharedOperandState[this.operandIndex] = update;
            cb(update);
        });
    }

    public mutateTransientExpression(change: Partial<T>): void {
        this.sharedOperandState[this.operandIndex] = change as T;
        this.parent.mutateTransientExpression({
            operands: [...this.sharedOperandState],
        } as Partial<E>);
    }

    public getTransientExpression(): T | null {
        const parent = this.parent.getTransientExpression();
        return parent ? parent.operands[this.operandIndex] as T : null;
    }

    public isTransientExpressionValid(): boolean {
        return this.parent.isTransientExpressionValid();
    }

    public commitExpression(): void {
        this.parent.commitExpression();
    }

    public rollbackExpression(): void {
        this.parent.rollbackExpression();
    }
}