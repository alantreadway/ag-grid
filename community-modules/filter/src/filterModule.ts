import { Module, ModuleNames } from "@ag-grid-community/core";
import { IFilterAdapter } from "./adapters/iFilterAdapter";
import { ExpressionModelFactory } from "./domain/expressionModelFactory";
import { FilterManager } from "./filterManager";
import { FilterStateManager } from "./state/filterStateManager";

export const FilterModule: Module = {
    moduleName: ModuleNames.FilterModule,
    beans: [ExpressionModelFactory, FilterManager, FilterStateManager],
    userComponents: [
        { componentClass: IFilterAdapter, componentName: 'agTextColumnFilterV2' },
    ],
};
