import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import type { MockDataStoreState, Entity, EntityMetadata, OptionSetValue, CustomActionMock, HttpMock } from "../../types/mock.types";

function rDate(daysAgo: number): string {
  return dayjs().subtract(Math.floor(Math.random() * daysAgo), "day").toISOString();
}

function genContacts(count: number): Entity[] {
  const firsts = ["Alice","Bob","Carlos","Diana","Eve","Frank","Grace","Henry","Isabel","James","Kate","Liam","Mia","Noah","Olivia","Paul","Quinn","Rachel","Sam","Tina"];
  const lasts = ["Anderson","Brown","Clark","Davis","Evans","Foster","Green","Harris","Irving","Johnson","King","Lee","Miller","Nelson","Owen","Parker","Quinn","Roberts","Smith","Taylor"];
  const titles = ["Senior Engineer","Product Manager","Sales Executive","Support Specialist","Director","Analyst","Consultant","Developer","Architect","VP Operations"];
  return Array.from({ length: count }, (_, i) => {
    const fn = firsts[i % firsts.length];
    const ln = lasts[i % lasts.length];
    return {
      contactid: `00000000-0000-0000-0001-${String(i + 1).padStart(12, "0")}`,
      fullname: `${fn} ${ln}`,
      firstname: fn,
      lastname: ln,
      emailaddress1: `${fn.toLowerCase()}.${ln.toLowerCase()}@mockorg.com`,
      telephone1: `+1 (555) ${String(100 + i).padStart(3, "0")}-${String(1000 + i).padStart(4, "0")}`,
      jobtitle: titles[i % titles.length],
      "accountid@odata.bind": `/accounts(00000000-0000-0000-0002-${String((i % 5) + 1).padStart(12, "0")})`,
      accountid_value: `00000000-0000-0000-0002-${String((i % 5) + 1).padStart(12, "0")}`,
      statecode: 0,
      statuscode: 1,
      createdon: rDate(180),
      modifiedon: rDate(30),
    };
  });
}

function genAccounts(count: number): Entity[] {
  const names = ["Cyberdyne Systems","Initech","Umbrella Corp","Aperture Science","Weyland-Yutani","Soylent Corp","Momcorp","Globex","Acme Corp","Buy N Large","Abstergo Industries","OCP","Skynet Inc","Tyrell Corp","Wayne Enterprises"];
  const cities = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose"];
  return Array.from({ length: count }, (_, i) => {
    // Build a parent hierarchy: accounts 2-5 are children of account 1,
    // accounts 6-10 are children of account 2, accounts 11-15 children of account 3
    let parentId: string | null = null;
    if (i >= 1 && i < 5) parentId = "00000000-0000-0000-0002-000000000001";
    else if (i >= 5 && i < 10) parentId = "00000000-0000-0000-0002-000000000002";
    else if (i >= 10) parentId = "00000000-0000-0000-0002-000000000003";

    return {
      accountid: `00000000-0000-0000-0002-${String(i + 1).padStart(12, "0")}`,
      name: names[i % names.length],
      accountnumber: `ACC-${String(i + 1).padStart(3, "0")}`,
      telephone1: `+1 (555) ${String(200 + i).padStart(3, "0")}-${String(2000 + i).padStart(4, "0")}`,
      emailaddress1: `info@${names[i % names.length].toLowerCase().replace(/\s+/g, "")}.com`,
      websiteurl: `https://${names[i % names.length].toLowerCase().replace(/\s+/g, "")}.com`,
      address1_city: cities[i % cities.length],
      parentaccountid: parentId,
      _parentaccountid_value: parentId,
      statecode: 0,
      createdon: rDate(365),
      modifiedon: rDate(60),
    };
  });
}

function genUsers(count: number): Entity[] {
  const names = ["John Smith","Jane Doe","Robert Johnson","Emily Davis","Michael Wilson","Sarah Martinez","David Brown","Laura Taylor","James Anderson","Maria Garcia"];
  return Array.from({ length: count }, (_, i) => ({
    systemuserid: `00000000-0000-0000-0003-${String(i + 1).padStart(12, "0")}`,
    fullname: names[i % names.length],
    domainname: `mockorg\\${names[i % names.length].toLowerCase().replace(/\s+/g, ".")}`,
    internalemailaddress: `${names[i % names.length].toLowerCase().replace(/\s+/g, ".")}@mockorg.com`,
    businessunitid: "00000000-0000-0000-0010-000000000001",
    isapproved: true,
  }));
}

function genTasks(count: number): Entity[] {
  const subjects = ["Follow up call","Send proposal","Schedule meeting","Review contract","Update records","Send invoice","Demo preparation","Onboarding","Training session","Check-in call"];
  const regardingId = "00000000-0000-0000-0001-000000000001";
  return Array.from({ length: count }, (_, i) => ({
    activityid: `00000000-0000-0000-0004-${String(i + 1).padStart(12, "0")}`,
    subject: subjects[i % subjects.length],
    description: `Task description for ${subjects[i % subjects.length]}`,
    regardingobjectid: regardingId,
    _regardingobjectid_value: regardingId,
    scheduledend: dayjs().add(i + 1, "day").toISOString(),
    statecode: i % 3 === 0 ? 1 : 0,
    statuscode: i % 3 === 0 ? 5 : 2,
    prioritycode: i % 3,
    createdon: rDate(30),
  }));
}

function genIncidents(count: number): Entity[] {
  const titles = ["Login issue","Password reset","Data not loading","Performance problem","Feature request","Integration error","Report bug","UI glitch","Email not sending","Access denied"];
  return Array.from({ length: count }, (_, i) => ({
    incidentid: `00000000-0000-0000-0005-${String(i + 1).padStart(12, "0")}`,
    title: titles[i % titles.length],
    ticketnumber: `CAS-${String(10000 + i).padStart(5, "0")}`,
    customerid: `00000000-0000-0000-0001-${String((i % 10) + 1).padStart(12, "0")}`,
    statecode: i % 3,
    prioritycode: i % 4,
    createdon: rDate(60),
    modifiedon: rDate(10),
  }));
}

function genOpportunities(count: number): Entity[] {
  const names = ["New ERP Implementation","CRM Upgrade","Cloud Migration","Custom Dev Project","Support Contract","License Renewal","Professional Services","Managed Services","Training Program","Consulting Engagement"];
  return Array.from({ length: count }, (_, i) => ({
    opportunityid: `00000000-0000-0000-0006-${String(i + 1).padStart(12, "0")}`,
    name: names[i % names.length],
    estimatedvalue: (i + 1) * 15000,
    estimatedclosedate: dayjs().add((i + 1) * 15, "day").toISOString(),
    parentaccountid: `00000000-0000-0000-0002-${String((i % 5) + 1).padStart(12, "0")}`,
    statecode: 0,
    stepname: ["Qualify","Develop","Propose","Close"][i % 4],
    createdon: rDate(90),
  }));
}

function genLeads(count: number): Entity[] {
  const names = ["Alex Turner","Blake Stone","Casey Jordan","Drew Morgan","Ellis Quinn","Finley Park","Gray Swift","Harper Lane","Indigo Cole","Jules West"];
  const companies = ["TechStart","DataFlow Inc","CloudBase","NexGen","InnovateCo","FastTrack","BrightMind","CoreLogic","PeakSoft","DigitalWave"];
  return Array.from({ length: count }, (_, i) => ({
    leadid: `00000000-0000-0000-0007-${String(i + 1).padStart(12, "0")}`,
    fullname: names[i % names.length],
    companyname: companies[i % companies.length],
    emailaddress1: `${names[i % names.length].toLowerCase().replace(/\s+/g, ".")}@${companies[i % companies.length].toLowerCase().replace(/\s+/g, "")}.com`,
    telephone1: `+1 (555) ${String(700 + i).padStart(3, "0")}-${String(7000 + i).padStart(4, "0")}`,
    leadqualitycode: i % 3,
    statecode: 0,
    createdon: rDate(60),
  }));
}

function genAnnotations(count: number): Entity[] {
  const subjects = ["Meeting notes","Follow-up","Action items","Project update","Issue report","Invoice attached","Contract draft","Call summary","Email chain","Reference doc"];
  const regardingId = "00000000-0000-0000-0001-000000000001";
  // A tiny 1x1 red PNG as base64 for document preview testing
  const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8D4HwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  // A minimal plain text file as base64
  const tinyTxt = btoa("Sample document content for testing the Document Viewer control.");
  return Array.from({ length: count }, (_, i) => {
    const hasDoc = i % 2 === 0;
    const isPng = i % 4 === 0;
    return {
      annotationid: `00000000-0000-0000-0008-${String(i + 1).padStart(12, "0")}`,
      subject: subjects[i % subjects.length],
      notetext: `Note content for: ${subjects[i % subjects.length]}. This is a mock note body with some sample content.`,
      objectid: regardingId,
      _objectid_value: regardingId,
      filename: hasDoc ? (isPng ? `image_${i + 1}.png` : `document_${i + 1}.txt`) : null,
      filesize: hasDoc ? (i + 1) * 1024 : 0,
      isdocument: hasDoc,
      documentbody: hasDoc ? (isPng ? tinyPng : tinyTxt) : null,
      mimetype: hasDoc ? (isPng ? "image/png" : "text/plain") : null,
      createdon: rDate(90),
      modifiedon: rDate(10),
    };
  });
}

function genEmails(count: number): Entity[] {
  const subjects = ["Meeting follow-up","Proposal review","Introduction","Support ticket update","Newsletter","Invitation","Notification","Action required","Thank you","Reminder"];
  const regardingId = "00000000-0000-0000-0001-000000000001";
  return Array.from({ length: count }, (_, i) => ({
    activityid: `00000000-0000-0000-0009-${String(i + 1).padStart(12, "0")}`,
    subject: subjects[i % subjects.length],
    description: `Email body for: ${subjects[i % subjects.length]}`,
    from: `sender${i}@mockorg.com`,
    to: `recipient${i}@external.com`,
    regardingobjectid: regardingId,
    _regardingobjectid_value: regardingId,
    statecode: i % 2,
    directioncode: i % 2 === 0,
    createdon: rDate(45),
  }));
}

function genPhoneCalls(count: number): Entity[] {
  const subjects = ["Introduction call","Sales call","Support call","Follow-up call","Onboarding call","Demo call","Check-in","Renewal discussion","Escalation call","Courtesy call"];
  const regardingId = "00000000-0000-0000-0001-000000000001";
  return Array.from({ length: count }, (_, i) => ({
    activityid: `00000000-0000-0000-000a-${String(i + 1).padStart(12, "0")}`,
    subject: subjects[i % subjects.length],
    description: `Phone call: ${subjects[i % subjects.length]}`,
    regardingobjectid: regardingId,
    _regardingobjectid_value: regardingId,
    scheduledend: dayjs().add(i * 2, "day").toISOString(),
    statecode: i % 2,
    directioncode: i % 2 === 0,
    createdon: rDate(30),
  }));
}

function buildMetadata(): Record<string, EntityMetadata> {
  return {
    contact: {
      LogicalName: "contact",
      DisplayName: "Contact",
      DisplayCollectionName: "Contacts",
      PrimaryIdAttribute: "contactid",
      PrimaryNameAttribute: "fullname",
      Attributes: [
        { LogicalName: "contactid", DisplayName: "Contact", AttributeType: "Uniqueidentifier", RequiredLevel: "SystemRequired" },
        { LogicalName: "fullname", DisplayName: "Full Name", AttributeType: "String", RequiredLevel: "None", MaxLength: 160 },
        { LogicalName: "firstname", DisplayName: "First Name", AttributeType: "String", RequiredLevel: "Recommended", MaxLength: 50 },
        { LogicalName: "lastname", DisplayName: "Last Name", AttributeType: "String", RequiredLevel: "Recommended", MaxLength: 50 },
        { LogicalName: "emailaddress1", DisplayName: "Email", AttributeType: "String", RequiredLevel: "None", MaxLength: 100 },
        { LogicalName: "telephone1", DisplayName: "Business Phone", AttributeType: "String", RequiredLevel: "None", MaxLength: 50 },
        { LogicalName: "jobtitle", DisplayName: "Job Title", AttributeType: "String", RequiredLevel: "None", MaxLength: 100 },
        { LogicalName: "statecode", DisplayName: "Status", AttributeType: "State", RequiredLevel: "SystemRequired" },
      ],
    },
    account: {
      LogicalName: "account",
      DisplayName: "Account",
      DisplayCollectionName: "Accounts",
      PrimaryIdAttribute: "accountid",
      PrimaryNameAttribute: "name",
      Attributes: [
        { LogicalName: "accountid", DisplayName: "Account", AttributeType: "Uniqueidentifier", RequiredLevel: "SystemRequired" },
        { LogicalName: "name", DisplayName: "Account Name", AttributeType: "String", RequiredLevel: "Required", MaxLength: 160 },
        { LogicalName: "accountnumber", DisplayName: "Account Number", AttributeType: "String", RequiredLevel: "None", MaxLength: 20 },
        { LogicalName: "telephone1", DisplayName: "Main Phone", AttributeType: "String", RequiredLevel: "None", MaxLength: 50 },
        { LogicalName: "emailaddress1", DisplayName: "Email", AttributeType: "String", RequiredLevel: "None", MaxLength: 100 },
        { LogicalName: "websiteurl", DisplayName: "Website", AttributeType: "String", RequiredLevel: "None", MaxLength: 200 },
        { LogicalName: "statecode", DisplayName: "Status", AttributeType: "State", RequiredLevel: "SystemRequired" },
      ],
    },
    incident: {
      LogicalName: "incident",
      DisplayName: "Case",
      DisplayCollectionName: "Cases",
      PrimaryIdAttribute: "incidentid",
      PrimaryNameAttribute: "title",
      Attributes: [
        { LogicalName: "incidentid", DisplayName: "Case", AttributeType: "Uniqueidentifier", RequiredLevel: "SystemRequired" },
        { LogicalName: "title", DisplayName: "Case Title", AttributeType: "String", RequiredLevel: "Required", MaxLength: 200 },
        { LogicalName: "ticketnumber", DisplayName: "Case Number", AttributeType: "String", RequiredLevel: "None", MaxLength: 100 },
        { LogicalName: "statecode", DisplayName: "Status", AttributeType: "State", RequiredLevel: "SystemRequired" },
        { LogicalName: "prioritycode", DisplayName: "Priority", AttributeType: "Picklist", RequiredLevel: "None" },
      ],
    },
    task: {
      LogicalName: "task",
      DisplayName: "Task",
      DisplayCollectionName: "Tasks",
      PrimaryIdAttribute: "activityid",
      PrimaryNameAttribute: "subject",
      Attributes: [
        { LogicalName: "activityid", DisplayName: "Task", AttributeType: "Uniqueidentifier", RequiredLevel: "SystemRequired" },
        { LogicalName: "subject", DisplayName: "Subject", AttributeType: "String", RequiredLevel: "Required", MaxLength: 200 },
        { LogicalName: "description", DisplayName: "Description", AttributeType: "Memo", RequiredLevel: "None", MaxLength: 2000 },
        { LogicalName: "statecode", DisplayName: "Status", AttributeType: "State", RequiredLevel: "SystemRequired" },
      ],
    },
  };
}

function buildOptionSets(): Record<string, OptionSetValue[]> {
  return {
    statecode: [
      { value: 0, label: "Active" },
      { value: 1, label: "Inactive" },
    ],
    prioritycode: [
      { value: 1, label: "High" },
      { value: 2, label: "Normal" },
      { value: 3, label: "Low" },
    ],
    leadqualitycode: [
      { value: 1, label: "Hot" },
      { value: 2, label: "Warm" },
      { value: 3, label: "Cold" },
    ],
    contactthem_cardtheme: [
      { value: 0, label: "Light" },
      { value: 1, label: "Dark" },
      { value: 2, label: "Compact" },
    ],
  };
}

function buildCustomActions(): Record<string, CustomActionMock> {
  return {
    new_GetContactEnrichment: {
      actionName: "new_GetContactEnrichment",
      boundEntityName: "contact",
      mockResponse: {
        LinkedInProfile: "https://linkedin.com/in/mockuser",
        CompanySize: "500-1000 employees",
        Industry: "Technology",
        AnnualRevenue: 50000000,
        TechStack: ["Dynamics 365", "Azure", "Power Platform"],
        LastInteraction: dayjs().subtract(7, "day").toISOString(),
        EngagementScore: 87,
      },
      conditionalResponses: [
        {
          label: "VIP Contact",
          matchFields: { contactId: "00000000-0000-0000-0001-000000000001" },
          response: {
            LinkedInProfile: "https://linkedin.com/in/vip-executive",
            CompanySize: "10000+ employees",
            Industry: "Enterprise Software",
            AnnualRevenue: 500000000,
            TechStack: ["Dynamics 365", "Azure", "Power Platform", "SAP"],
            LastInteraction: dayjs().subtract(1, "day").toISOString(),
            EngagementScore: 99,
          },
        },
        {
          label: "New Lead",
          matchFields: { contactId: "00000000-0000-0000-0001-000000000002" },
          response: {
            LinkedInProfile: "https://linkedin.com/in/newlead",
            CompanySize: "1-50 employees",
            Industry: "Startup",
            AnnualRevenue: 500000,
            TechStack: ["Azure"],
            LastInteraction: dayjs().subtract(30, "day").toISOString(),
            EngagementScore: 25,
          },
        },
      ],
      delay: 150,
    },
    new_GetPCPChangeRequest: {
      actionName: "new_GetPCPChangeRequest",
      mockResponse: {
        MemberId: "M-100001",
        MemberName: "John Smith",
        CurrentPCP: "Dr. James Wilson",
        RequestedPCP: "Dr. Lisa Cuddy",
        RequestDate: dayjs().subtract(3, "day").toISOString(),
        Status: "Pending",
      },
      conditionalResponses: [
        {
          label: "Approved Request",
          matchFields: { MemberId: "M-100002" },
          response: {
            MemberId: "M-100002",
            MemberName: "Jane Doe",
            CurrentPCP: "Dr. Gregory House",
            RequestedPCP: "Dr. Allison Cameron",
            RequestDate: dayjs().subtract(10, "day").toISOString(),
            Status: "Approved",
          },
        },
      ],
      delay: 150,
    },
  };
}

function buildHttpMocks(): HttpMock[] {
  return [
    {
      id: "http-mock-1",
      urlPattern: "/api/v1/health",
      matchType: "contains",
      method: "GET",
      statusCode: 200,
      responseBody: { status: "healthy", version: "1.0.0", timestamp: new Date().toISOString() },
      responseHeaders: { "Content-Type": "application/json" },
      delay: 50,
      enabled: true,
    },
    {
      id: "http-mock-2",
      urlPattern: "/api/v1/config",
      matchType: "contains",
      method: "GET",
      statusCode: 200,
      responseBody: { featureFlags: { darkMode: true, betaFeatures: false }, maxRetries: 3 },
      responseHeaders: { "Content-Type": "application/json" },
      delay: 100,
      enabled: true,
    },
  ];
}

export function generateDefaultData(): MockDataStoreState {
  return {
    entities: {
      contact: genContacts(20),
      account: genAccounts(15),
      systemuser: genUsers(10),
      task: genTasks(10),
      incident: genIncidents(10),
      opportunity: genOpportunities(8),
      lead: genLeads(8),
      annotation: genAnnotations(15),
      email: genEmails(10),
      phonecall: genPhoneCalls(8),
    },
    customActions: buildCustomActions(),
    globalOptionSets: buildOptionSets(),
    metadata: buildMetadata(),
    httpMocks: buildHttpMocks(),
    fetchXmlMocks: [],
  };
}

export function autoGenerateRecords(entityLogicalName: string, count = 5): Entity[] {
  return Array.from({ length: count }, (_, i) => ({
    [`${entityLogicalName}id`]: uuidv4(),
    name: `${entityLogicalName} Record ${i + 1}`,
    subject: `${entityLogicalName} Record ${i + 1}`,
    statecode: 0,
    createdon: rDate(90),
    modifiedon: rDate(10),
  }));
}
