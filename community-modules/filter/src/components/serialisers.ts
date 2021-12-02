import { OperandSerialiser } from "./interfaces";

export const NO_OP_SERIALISER: OperandSerialiser<string> = {
    toOperandType: (o) => o,
    toString: (o) => o,
};
