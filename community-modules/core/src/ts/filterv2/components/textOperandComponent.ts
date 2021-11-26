import { AgInputTextField } from "../../widgets/agInputTextField";
import { Component } from "../../widgets/component";
import { RefSelector } from "../../widgets/componentAnnotations";
import { OperandComponent, OperandComponentParameters, OperandSerialiser } from "./interfaces";

export class TextOperandComponent<O = string> extends Component implements OperandComponent<O> {
    private params: OperandComponentParameters<O>;

    @RefSelector('eInput')
    private readonly refInput: AgInputTextField;

    public constructor(
        private readonly serialiser: OperandSerialiser<O>,
    ) {
        super(`
            <ag-input-text-field class="ag-filter-filter" ref="eInput"></ag-input-text-field>
        `);

        this.refInput.onValueChange((m) => this.operandMutation(m));
    }

    public setParameters(params: OperandComponentParameters<O>) {
        this.params = params;
    }

    public operandUpdated(operandValue: O | null) {
        this.refInput.setValue(this.serialiser.toString(operandValue), true);
    }

    private operandMutation(mutation: string | null | undefined): void {
        const normalisedMutation = mutation == null ? null : mutation;
        const operand = this.serialiser.toOperandType(normalisedMutation);

        this.params.mutateTransientOperand(operand);
    }
}
