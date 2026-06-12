/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    accountId: ComponentFramework.PropertyTypes.StringProperty;
    showRelatedContacts: ComponentFramework.PropertyTypes.TwoOptionsProperty;
    showRelatedOpportunities: ComponentFramework.PropertyTypes.TwoOptionsProperty;
    maxItemsToShow: ComponentFramework.PropertyTypes.WholeNumberProperty;
    cardTheme: ComponentFramework.PropertyTypes.WholeNumberProperty;
}
export interface IOutputs {
    selectedAccountId?: string;
}
