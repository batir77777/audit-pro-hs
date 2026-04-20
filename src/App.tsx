/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BrandingProvider } from './lib/brandingContext';
import { AuthProvider } from './lib/authContext';
import { AutoSaveProvider } from './lib/autoSaveContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyReports from './pages/MyReports';
import Settings from './pages/Settings';
import ModulePlaceholder from './pages/ModulePlaceholder';
import ModuleSelectionPage from './pages/ModuleSelectionPage';
import NewReportPage from './pages/NewReportPage';
import DynamicRiskAssessmentForm from './pages/DynamicRiskAssessmentForm';
import IncidentReportForm from './pages/IncidentReportForm';
import IncidentInvestigationForm from './pages/IncidentInvestigationForm';
import DSEAssessmentForm from './pages/DSEAssessmentForm';
import ConstructionSiteChecklistForm from './pages/ConstructionSiteChecklistForm';
import ChecklistForm from './pages/ChecklistForm';
import AuditForm from './pages/AuditForm';
import HSMiniAuditForm from './pages/HSMiniAuditForm';
import MonthlyPremisesChecklistForm from './pages/MonthlyPremisesChecklistForm';
import SixMonthlyPremisesChecklistForm from './pages/SixMonthlyPremisesChecklistForm';
import AnnualPremisesChecklistForm from './pages/AnnualPremisesChecklistForm';
import EquipmentSafetyInspectionForm from './pages/EquipmentSafetyInspectionForm';
import PalletRackingChecklistForm from './pages/PalletRackingChecklistForm';
import PermitToWorkMultiGeneralForm from './pages/PermitToWorkMultiGeneralForm';
import LoneWorkingChecklistForm from './pages/LoneWorkingChecklistForm';
import ManualHandlingAssessmentForm from './pages/ManualHandlingAssessmentForm';
import ToolboxTalksLibrary from './pages/ToolboxTalksLibrary';
import ToolboxTalkForm from './pages/ToolboxTalkForm';

import ContractorVettingSelection from './pages/ContractorVettingSelection';
import ContractorVettingFullForm from './pages/ContractorVettingFullForm';
import ContractorVettingSmallForm from './pages/ContractorVettingSmallForm';
import FireBriefingForm from './pages/FireBriefingForm';
import FireDrillReportForm from './pages/FireDrillReportForm';
import FireWardenChecklistForm from './pages/FireWardenChecklistForm';
import PublicReportView from './pages/PublicReportView';

export default function App() {
  return (
    <AuthProvider>
    <AutoSaveProvider>
    <BrandingProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute><Layout><MyReports /></Layout></ProtectedRoute>} />
        <Route path="/new-report" element={<ProtectedRoute><Layout><NewReportPage /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        
        {/* Module Routes */}
        <Route path="/risk-assessments" element={<ProtectedRoute><Layout><ModuleSelectionPage /></Layout></ProtectedRoute>} />
        <Route path="/risk-assessments/new" element={<ProtectedRoute><Layout><DynamicRiskAssessmentForm /></Layout></ProtectedRoute>} />
        <Route path="/risk-assessments/dse/new" element={<ProtectedRoute><Layout><DSEAssessmentForm /></Layout></ProtectedRoute>} />
        <Route path="/risk-assessments/lone-working/new" element={<ProtectedRoute><Layout><LoneWorkingChecklistForm /></Layout></ProtectedRoute>} />
        <Route path="/risk-assessments/manual-handling/new" element={<ProtectedRoute><Layout><ManualHandlingAssessmentForm /></Layout></ProtectedRoute>} />
        
        <Route path="/incidents" element={<ProtectedRoute><Layout><ModuleSelectionPage /></Layout></ProtectedRoute>} />
        <Route path="/incidents/new" element={<ProtectedRoute><Layout><IncidentReportForm /></Layout></ProtectedRoute>} />
        <Route path="/incidents/investigation/new" element={<ProtectedRoute><Layout><IncidentInvestigationForm /></Layout></ProtectedRoute>} />
        
        <Route path="/checklists" element={<ProtectedRoute><Layout><ModuleSelectionPage /></Layout></ProtectedRoute>} />
        <Route path="/checklists/new" element={<ProtectedRoute><Layout><ChecklistForm /></Layout></ProtectedRoute>} />
        <Route path="/checklists/site-induction/new" element={<ProtectedRoute><Layout><ConstructionSiteChecklistForm /></Layout></ProtectedRoute>} />
        
        <Route path="/audits" element={<ProtectedRoute><Layout><ModuleSelectionPage /></Layout></ProtectedRoute>} />
        <Route path="/audits/new" element={<ProtectedRoute><Layout><AuditForm /></Layout></ProtectedRoute>} />
        <Route path="/audits/mini-audit/new" element={<ProtectedRoute><Layout><HSMiniAuditForm /></Layout></ProtectedRoute>} />

        <Route path="/toolbox-talks" element={<ProtectedRoute><Layout><ToolboxTalksLibrary /></Layout></ProtectedRoute>} />
        <Route path="/toolbox-talks/new" element={<ProtectedRoute><Layout><ToolboxTalkForm /></Layout></ProtectedRoute>} />

        <Route path="/fire-safety" element={<ProtectedRoute><Layout><ModuleSelectionPage /></Layout></ProtectedRoute>} />
        <Route path="/fire-safety/new" element={<ProtectedRoute><Layout><FireBriefingForm /></Layout></ProtectedRoute>} />
        <Route path="/fire-safety/drill/new" element={<ProtectedRoute><Layout><FireDrillReportForm /></Layout></ProtectedRoute>} />
        <Route path="/fire-safety/warden-checklist/new" element={<ProtectedRoute><Layout><FireWardenChecklistForm /></Layout></ProtectedRoute>} />
        
        <Route path="/premises-checks" element={<ProtectedRoute><Layout><ModuleSelectionPage /></Layout></ProtectedRoute>} />
        <Route path="/premises-checks/5-001/new" element={<ProtectedRoute><Layout><MonthlyPremisesChecklistForm /></Layout></ProtectedRoute>} />
        <Route path="/premises-checks/5-002/new" element={<ProtectedRoute><Layout><SixMonthlyPremisesChecklistForm /></Layout></ProtectedRoute>} />
        <Route path="/premises-checks/5-003/new" element={<ProtectedRoute><Layout><AnnualPremisesChecklistForm /></Layout></ProtectedRoute>} />
        <Route path="/premises-checks/5-004/new" element={<ProtectedRoute><Layout><EquipmentSafetyInspectionForm /></Layout></ProtectedRoute>} />
        <Route path="/premises-checks/5-017/new" element={<ProtectedRoute><Layout><PalletRackingChecklistForm /></Layout></ProtectedRoute>} />

        <Route path="/permits" element={<ProtectedRoute><Layout><ModuleSelectionPage /></Layout></ProtectedRoute>} />
        <Route path="/permits/multi-general/new" element={<ProtectedRoute><Layout><PermitToWorkMultiGeneralForm /></Layout></ProtectedRoute>} />
        <Route path="/permits/new" element={<ProtectedRoute><Layout><ModulePlaceholder /></Layout></ProtectedRoute>} />

        <Route path="/contractors" element={<ProtectedRoute><Layout><ContractorVettingSelection /></Layout></ProtectedRoute>} />
        <Route path="/contractors/10-001/new" element={<ProtectedRoute><Layout><ContractorVettingFullForm /></Layout></ProtectedRoute>} />
        <Route path="/contractors/10-002/new" element={<ProtectedRoute><Layout><ContractorVettingSmallForm /></Layout></ProtectedRoute>} />
        <Route path="/contractors/new" element={<ProtectedRoute><Layout><ContractorVettingFullForm /></Layout></ProtectedRoute>} />
        
        {/* Public Routes */}
        <Route path="/share/:reportId" element={<PublicReportView />} />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
    </BrandingProvider>
    </AutoSaveProvider>
    </AuthProvider>
  );
}

