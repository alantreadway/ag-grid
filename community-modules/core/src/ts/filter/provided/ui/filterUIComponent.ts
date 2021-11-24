import { AgPromise } from "../../../utils";
import { Component } from "../../../widgets/component";
import { IFilterTitleLocaleText } from "../../filterLocaleText";
import { ICompositeProvidedFilterParams } from "../compositeProvidedFilter";

export interface FilterUIComponentController {
    filterNameKey: keyof IFilterTitleLocaleText;

    applyModel(): boolean;
    cancelModel(): void;
}

export abstract class FilterUIComponent<M> extends Component {
    public abstract setParams(params: ICompositeProvidedFilterParams): void;

    public abstract init(): void;
    public abstract destroy(): void;

    public abstract getModelFromUi(): M | null;
    public abstract setModelIntoUi(model: M): AgPromise<void>;
    public abstract resetUiToDefaults(): AgPromise<void>;
}
