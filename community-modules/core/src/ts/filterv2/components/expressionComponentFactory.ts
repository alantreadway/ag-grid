import { Autowired, Bean, Context } from "../../context/context";
import { Column } from "../../entities/column";
import { Component } from "../../widgets/component";
import { ComparisonOperationComponent } from "./comparisonOperationComponent";
import { ExpressionComponent, OperandSerialiser } from "./interfaces";
import { RootComponent } from "./rootComponent";
import { TextOperandComponent } from "./textOperandComponent";

const NO_OP_SERIALISER: OperandSerialiser<string> = {
    toOperandType: (o) => o,
    toString: (o) => o,
};

type ComponentType = ExpressionComponent & Component;

@Bean('expressionComponentFactory')
export class ExpressionComponentFactory {
    @Autowired('context') private readonly context: Context;

    public createFilterComponent(column: Column): ComponentType {
        if (!column.isFilterAllowed()) { throw new Error('AG Grid - Filter not allowed.'); }

        return this.createSimpleTextColumnComponent();
    }

    public createSimpleTextColumnComponent(): ComponentType {
        const bean = (b: any) => this.context.createBean(b);

        return bean(new RootComponent([
            bean(new ComparisonOperationComponent([
                bean(new TextOperandComponent(NO_OP_SERIALISER)),
                bean(new TextOperandComponent(NO_OP_SERIALISER)),
            ])),
        ]));
    }
}
