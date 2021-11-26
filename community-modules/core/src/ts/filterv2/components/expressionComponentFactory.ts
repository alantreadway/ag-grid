import { Column } from "../../entities/column";
import { Component } from "../../main";
import { ComparisonOperationComponent } from "./comparisonOperationComponent";
import { ExpressionComponent, OperandSerialiser } from "./interfaces";
import { TextOperandComponent } from "./textOperandComponent";

const COMPARISON_OPERATION_SERIALISER: OperandSerialiser<string> = {
    toOperandType: (o) => o,
    toString: (o) => o,
};

type ComponentType = ExpressionComponent & Component;

export class ExpressionComponentFactory {
    public createColumnComponent(column: Column): ComponentType {
        if (!column.isFilterAllowed()) { throw new Error('AG Grid - Filter not allowed.'); }

        return this.createSimpleTextColumnComponent();
    }

    public createSimpleTextColumnComponent(): ComponentType {
        return new ComparisonOperationComponent(
            [
                new TextOperandComponent(COMPARISON_OPERATION_SERIALISER),
                new TextOperandComponent(COMPARISON_OPERATION_SERIALISER),
            ],
        );
    }
}
