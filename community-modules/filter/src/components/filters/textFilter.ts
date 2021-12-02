import { ComparisonOperationComponent } from "../comparisonOperationComponent";
import { RootComponent } from "../rootComponent";
import { NO_OP_SERIALISER } from "../serialisers";
import { TextOperandComponent } from "../textOperandComponent";

export class TextFilter extends RootComponent {
    public constructor() {
        super([new ComparisonOperationComponent([
            new TextOperandComponent(NO_OP_SERIALISER),
            new TextOperandComponent(NO_OP_SERIALISER),
        ])]);
    }
}
