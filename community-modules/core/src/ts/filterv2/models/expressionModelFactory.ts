import { Expression } from "../expression";
import { ComparisonOperationModel } from "./comparisonOperationModel";
import { DefaultComparator } from "./defaultComparator";
import { ExpressionModel } from "./interfaces";
import { LogicOperationModel } from "./logicOperationModel";

const DEFAULT_COMPARATOR = new DefaultComparator();

export class ExpressionModelFactory {
    public buildExpressionModel(expr: Expression): ExpressionModel<unknown> {
        switch (expr.type) {
            case "logic":
                return new LogicOperationModel({
                    ...expr,
                    operands: expr.operands.map(o => this.buildExpressionModel(o)),
                });
            case "text-op":
                return new ComparisonOperationModel({
                    ...expr,
                    comparator: DEFAULT_COMPARATOR,
                });
            default:
                throw new Error("AG Grid: Unknown expression type: " + expr);
        }
    }
}
