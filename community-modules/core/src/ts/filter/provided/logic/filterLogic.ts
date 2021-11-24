import { IDoesFilterPassParams } from "../../../main";
import { ICompositeProvidedFilterParams } from "../compositeProvidedFilter";

export interface FilterLogic<M> {
    setParams(params: ICompositeProvidedFilterParams): void;

    areModelsEqual(newModel: any, appliedModel: M | null): boolean;
    isModelValid(model: M | null): boolean;   

    doesPassFilter(params: IDoesFilterPassParams, appliedModel: M | null): boolean;
}
