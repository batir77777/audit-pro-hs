export type ReportStatus = 'Draft' | 'Submitted' | 'Completed' | 'Deleted';

export type ReportType = 'Dynamic Risk Assessment' | 'Incident Report' | 'Checklist' | 'Audit' | 'Accident / Incident Investigation' | 'DSE Assessment' | 'Construction Site Checklist' | 'Contractor Vetting 10-001' | 'Contractor Vetting 10-002' | 'Fire Briefing' | 'Fire Drill Report' | 'Fire Warden Checklist' | 'H&S Mini Audit' | 'Monthly Premises Checklist' | 'Six-Monthly Premises Checklist' | 'Annual Premises Checklist' | 'Equipment Safety Inspection' | 'Pallet Racking Checklist' | 'Permit to Work' | 'Lone Working Checklist' | 'Manual Handling Assessment' | 'Toolbox Talk' | 'Monthly Site Safety Audit' | 'H&S Audit Form' | 'Daily Site Safety Inspection' | 'Computer DSE Checklist' | 'Lone Worker Checklist' | 'Manual Handling Checklist' | 'General H&S Checklist';

export interface ManualHandlingAssessmentReport extends Report {
  // Section 1: Assessment Details
  assessorName: string;
  assessorSignature: string;
  assessmentDate: string;
  ref: string;
  reviewDate: string;
  task: string;
  location: string;

  // Section 2: L.I.T.E. Assessment
  liteAssessment: {
    id: string;
    section: 'Loads' | 'Individual Capacity' | 'Tasks' | 'Environment';
    item: string;
    risk: 'YES' | 'NO' | 'N/A' | '';
    level: 'LOW' | 'MEDIUM' | 'HIGH' | '';
  }[];

  // Section 3: Initial Risk Assessment
  initialRisk: 'Low' | 'Normal' | 'Medium' | 'High' | '';

  // Section 4: Remedial Action
  remedialAction: string;

  // Section 5: Final Risk Assessment
  finalRisk: 'Low' | 'Normal' | 'Medium' | 'High' | '';
}

export interface LoneWorkingChecklistReport extends Report {
  // Section 1: Assessment Details
  assessorName: string;
  assessorSignature: string;
  assessmentDate: string;
  assessmentTitle: string;
  assessmentReview: string;

  // Section 2: Lone Worker Details
  loneWorkerName: string;
  loneWorkerSignature: string;
  loneWorkerMobile: string;
  loneWorkerEmail: string;
  loneWorkerArea: string;
  loneWorkerTask: string;
  loneWorkerDate: string;
  loneWorkerTime: string;

  // Section 3: Lone Working Evaluation
  evaluationItems: {
    id: string;
    ref: string;
    item: string;
    answer?: 'Yes' | 'No';
    comments: string;
  }[];

  // Section 4: Actions
  actionLog: {
    id: string;
    actionTaken: string;
    followUp: string;
    signOff: string;
    dateCompleted: string;
  }[];
}

export interface PermitToWorkReport extends Report {
  dateOfInitialIssue: string;
  printName: string;
  signature: string;
  jobTitle: string;
  projectAddress: string;
  locationOfPermitWork: string;
  namesOfOperatives: string;
  
  permitType: 'Confined Space' | 'Excavation' | 'Work at Height' | 'Hot Works' | 'Work on Live Electrics' | '';
  
  hazards: Record<string, ChecklistAnswer>;
  otherHazards?: string;
  precautions: Record<string, boolean>;
  fireWatchDuration?: string;
  
  hotWorksLog?: {
    id: string;
    date: string;
    startTime: string;
    finishTime: string;
  }[];
  
  handBack: {
    name: string;
    date: string;
    time: string;
  };
  
  finalChecklist: {
    id: string;
    question: string;
    answer?: ChecklistAnswer;
    notes?: string;
  }[];
  
  revalidationLog: {
    id: string;
    date: string;
    supervisorName: string;
    supervisorSignature: string;
    operativeNames: string;
    operativeSignature: string;
  }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
}

export interface PhotoAttachment {
  id: string;
  dataUrl: string; // base64 JPEG data URL
  caption: string;
  takenAt: string; // ISO timestamp
}

export interface BrandingSettings {
  companyName: string;
  logoDataUrl: string; // base64 data URL
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  location: string;
  date: string;
  authorId: string;
  authorName?: string;
  description?: string;
  /** The template that generated this report — used for edit routing back to the correct form. */
  templateId?: string;
  /** Manual free-text summary written by the assessor. Replaces auto-generated description in all outputs. */
  executiveSummary?: string;
  photos?: PhotoAttachment[];
  data?: Record<string, any>;
}

export interface RiskAssessmentEntry {
  id: string;
  hazard: string;
  whoHarmed: string;
  controls: string;
  likelihood: number;
  consequence: number;
  riskRating: number;
  furtherAction?: string;
  byWhom?: string;
  byWhen?: string;
}

export interface DynamicRiskAssessment extends Report {
  projectAddress: string;
  clientName: string;
  time: string;
  jobTitle: string;
  workActivity: string;
  numberOfWorkers: number;
  exactLocation: string;
  
  preStartChecks: Record<string, boolean>;
  hazardsIdentified: Record<string, boolean>;
  otherHazardDetails?: string;
  controlMeasures: Record<string, boolean>;
  
  riskEntries: RiskAssessmentEntry[];
  
  proceed: 'Proceed' | 'Do Not Proceed';
  proceedExplanation?: string;
  actionTaken: string;
  managerNotified: 'Yes' | 'No' | 'N/A';
  
  workerDeclaration: {
    name: string;
    date: string;
    signature: string;
    comments: string;
  };
  supervisorReview: {
    name: string;
    date: string;
    signature: string;
    comments: string;
  };
}

export type IncidentType = 'Accident' | 'Near Miss' | 'Incident';

export interface IncidentReport extends Report {
  incidentType: IncidentType;
  time: string;
  personReporting: string;
  personsInvolved: string;
  injuryDetails: string;
  immediateAction: string;
  furtherAction: string;
  photos?: PhotoAttachment[];
}

export type ChecklistAnswer = 'Yes' | 'No' | 'N/A';

export interface ChecklistItem {
  id: string;
  question: string;
  answer?: ChecklistAnswer;
  comment?: string;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  category: string;
  items: { id: string; question: string }[];
}

export interface ChecklistReport extends Report {
  templateId: string;
  items: ChecklistItem[];
  executiveSummary: string;
}

export interface AuditQuestion {
  id: string;
  question: string;
}

export interface AuditSectionTemplate {
  id: string;
  title: string;
  questions: AuditQuestion[];
}

export interface AuditTemplate {
  id: string;
  title: string;
  category: string;
  sections: AuditSectionTemplate[];
}

export interface AuditItem extends ChecklistItem {}

export interface AuditSection {
  id: string;
  title: string;
  items: AuditItem[];
}

export interface AuditReport extends Report {
  templateId: string;
  sections: AuditSection[];
  overallScore: number;
  executiveSummary: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface InvolvedPerson {
  id: string;
  type: 'Involved' | 'Injured' | 'Witness';
  nameTelephone: string;
  status: 'Employee' | 'Other';
}

export interface IncidentInvestigationReport extends Report {
  investigatorName: string;
  investigatorPosition: string;
  investigationDate: string;
  investigatorSignature: string;
  companyDetails: string;
  
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  injuredPersonName: string;
  
  injuredPersonStatus: string;
  otherStatusDetails?: string;
  
  involvedPeople: InvolvedPerson[];
  
  severity: string;
  otherSeverityDetails?: string;
  actionRequired: string;
  
  observations: string;
  peopleToSpeakTo: string;
  documents: string;
  
  trainedAndAuthorised: string;
  writtenRules: string;
  breaches: string;
  influencingFactors: string;
  recommendations: string;
  supportingEvidence: string;
  
  riddorReportable: 'YES' | 'NO' | 'N/A';
  riddorDate?: string;
  riddorReportedBy?: string;
  
  finalComments: string;
}

export interface DSEAssessmentReport extends Report {
  companyAddress: string;
  userName: string;
  jobTitle: string;
  computerIdLocation: string;
  assessmentDate: string;
  
  averageUsage: string;
  daysPerWeek: string;
  screenKeyboardMix: string;
  computerType: string;
  workInterrupted: string;
  
  assessmentEntries: DSEAssessmentEntry[];

  // Section 8: Corrective Action
  correctiveActionRequired?: 'YES' | 'NO';
  actionRequired?: string;
  whoWillAction?: string;
  actionCompletedSignDate?: string;

  // Section 9: Management Section
  managementCheckedBy?: string;
  managementPrintName?: string;
  managementTitle?: string;
  managementDate?: string;
  managementComments?: string;
}

export interface DSEAssessmentEntry {
  id: string;
  riskFactor: string;
  answer?: 'Yes' | 'No' | 'N/A';
  thingsToConsider: string;
  actionToTake: string;
}

export interface SiteInductionEntry {
  id: string;
  label: string;
  answer?: 'Yes' | 'No' | 'N/A';
  notes: string;
}

export interface WorkerSignature {
  id: string;
  printName: string;
  signature: string;
  date: string;
}

export interface ConstructionSiteChecklistReport extends Report {
  carriedBy: string;
  signature: string;
  ref: string;
  fullSiteAddress: string;
  startDate: string;
  estimatedFinishDate: string;
  
  inductionEntries: SiteInductionEntry[];
  workerSignatures: WorkerSignature[];
}

export interface VettingQuestion {
  id: string;
  question: string;
  answer?: 'Yes' | 'No' | 'N/A';
  notes: string;
  signature?: string;
}

export interface AccidentRecord {
  year: string;
  fatalities: string;
  majorAccidents: string;
  smallAccidents: string;
}

export interface ContractorVettingReport extends Report {
  companyName: string;
  email: string;
  address: string;
  contactName: string;
  tel: string;
  workTypes: string;

  questions: VettingQuestion[];
  accidentRecords: AccidentRecord[];

  declarationName: string;
  declarationSignature: string;
  declarationPosition: string;
  declarationDate: string;

  officeUse: {
    status?: 'APPROVED' | 'NOT APPROVED';
    failureReason: string;
    assessor: string;
    date: string;
    reviewDate: string;
    insuranceExpiry: string;
    notes: string;
  };
}

export interface FireBriefingEntry {
  id: string;
  item: string;
  completed: boolean;
  notes: string;
}

export interface StaffSignature {
  id: string;
  date: string;
  name: string;
  signature: string;
}

export interface FireBriefingReport extends Report {
  carriedBy: string;
  signature: string;
  premiseAddress: string;
  checklist: FireBriefingEntry[];
  otherNotes: string;
  staffSignatures: StaffSignature[];
}

export interface FireDrillChecklistItem {
  id: string;
  question: string;
  answer?: 'Yes' | 'No' | 'N/A';
  notes: string;
}

export interface FireDrillReport extends Report {
  carriedBy: string;
  title_pos: string; // Renamed from 'title' to avoid conflict with Report.title
  signature: string;
  premiseAddress: string;
  
  drillDate: string;
  drillTime: string;
  evacuationTime: string;
  assemblyPoint: string;
  
  checklist: FireDrillChecklistItem[];
  overallResult: 'Good' | 'OK' | 'Poor' | '';
  notes: string;
  problems: string;
  recommendations: string;
}

export interface FireWardenChecklistItem {
  id: string;
  question: string;
  answer?: 'Yes' | 'No';
}

export interface CorrectiveAction {
  id: string;
  date: string;
  actionRequired: string;
  dateCompleted: string;
}

export interface FireWardenChecklistReport extends Report {
  premise: string;
  completedBy: string;
  
  sectionA: FireWardenChecklistItem[];
  
  sectionB: {
    correctiveActionSatisfactory?: 'Yes' | 'No';
    notes: string;
  };
  
  correctiveActionLog: CorrectiveAction[];
}

export interface HSMiniAuditQuestion {
  id: string;
  question: string;
  score?: 1 | 0.5 | 0 | 'N/A';
  comments: string;
  note?: string;
}

export interface HSMiniAuditSection {
  id: string;
  title: string;
  questions: HSMiniAuditQuestion[];
}

export interface HSMiniAuditReport extends Report {
  auditFrequency: string;
  auditRef: string;
  companyNameAddress: string;
  assessors: string;
  siteContacts: string;
  
  sections: HSMiniAuditSection[];
  
  otherComments: {
    workEquipment: string;
    workTasks: string;
    workerTraining: string;
    otherTopics: string;
  };
  
  maxPoints: number;
  actualPoints: number;
  rating: string;
}

export interface MonthlyPremisesChecklistItem {
  id: string;
  question: string;
  answer?: 'Yes' | 'No';
  notes: string;
}

export interface MonthlyPremisesChecklistReport extends Report {
  premiseAddress: string;
  ref: string;
  completedByPrint: string;
  completedBySign: string;
  month: string;
  
  checklistItems: MonthlyPremisesChecklistItem[];
  correctiveActionLog: CorrectiveAction[];
}

export interface SixMonthlyPremisesChecklistReport extends Report {
  premiseAddress: string;
  ref: string;
  completedByPrint: string;
  completedBySign: string;
  
  checklistItems: ChecklistItem[];
  correctiveActionLog: {
    id: string;
    date: string;
    actionRequired: string;
    byWhomWhen: string;
  }[];
}

export interface AnnualPremisesChecklistReport extends Report {
  premiseAddress: string;
  ref: string;
  completedByPrint: string;
  completedBySign: string;
  
  checklistItems: MonthlyPremisesChecklistItem[];
  correctiveActionLog: CorrectiveAction[];
}

export interface EquipmentInspectionItem {
  id: string;
  equipmentNameType: string;
  lastElectricalCheck: string;
  isSafeToUse: 'YES' | 'NO' | null;
  isGuardingSafe: 'YES' | 'NO' | null;
  hasCorrectTraining: string;
  inspectionDate: string;
  checkedByPrint: string;
  checkedBySign: string;
}

export interface EquipmentSafetyInspectionReport extends Report {
  inspections: EquipmentInspectionItem[];
}

export interface PalletRackingChecklistReport extends Report {
  premiseAddress: string;
  ref: string;
  completedByPrint: string;
  completedBySign: string;
  
  checklistItems: MonthlyPremisesChecklistItem[];
  correctiveActionLog: {
    id: string;
    date: string;
    actionRequired: string;
    byWhomWhen: string;
  }[];
}
