/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    contactId: ComponentFramework.PropertyTypes.StringProperty;
    showRelatedCases: ComponentFramework.PropertyTypes.TwoOptionsProperty;
    maxCasesToShow: ComponentFramework.PropertyTypes.WholeNumberProperty;
    cardTheme: ComponentFramework.PropertyTypes.WholeNumberProperty;
}
export interface IOutputs {
    selectedContactId?: string;
}
