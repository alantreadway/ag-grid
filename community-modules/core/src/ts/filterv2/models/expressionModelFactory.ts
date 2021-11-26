import { Bean } from "../../context/context";
import { Expression } from "../expression";
import { ScalarComparisonOperationModel } from "./scalarComparisonOperationModel";
import { DefaultComparator } from "./defaultComparator";
import { ExpressionModel } from "./interfaces";
import { LogicOperationModel } from "./logicOperationModel";
import { TextComparisonOperationModel } from "./textComparisonOperationModel";

const DEFAULT_COMPARATOR = new DefaultComparator();

@Bean('expressionModelFactory')
export class ExpressionModelFactory {
    public buildExpressionModel(expr: Expression): ExpressionModel<unknown> {
        switch (expr.type) {
            case "logic":
                return new LogicOperationModel({
                    ...expr,
                    operands: expr.operands.map(o => this.buildExpressionModel(o)),
                });
            case "number-op":
                return new ScalarComparisonOperationModel({
                    ...expr,
                    comparator: DEFAULT_COMPARATOR,
                });
            case "date-op":
                return new ScalarComparisonOperationModel({
                    ...expr,
                    comparator: DEFAULT_COMPARATOR,
                });
            case "text-op":
                return new TextComparisonOperationModel({
                    ...expr,
                });
            default:
                throw new Error("AG Grid: Unknown expression type: " + expr);
        }
    }
}
