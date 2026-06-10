/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    rootRecordId: ComponentFramework.PropertyTypes.StringProperty;
    entityLogicalName: ComponentFramework.PropertyTypes.StringProperty;
    parentField: ComponentFramework.PropertyTypes.StringProperty;
    nameField: ComponentFramework.PropertyTypes.StringProperty;
}
export interface IOutputs {
    selectedRecordId?: string;
}
