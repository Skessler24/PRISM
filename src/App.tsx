import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { ThemeProvider } from './app/ThemeProvider'
import { HelpAssistProvider } from './lib/help-assist/HelpAssistProvider'
import { DistrictProfileProvider } from './lib/district-profiles/DistrictProfileProvider'
import { AdminRoleProvider } from './lib/admin/AdminRoleProvider'
import { StudentsProvider } from './lib/students/StudentsProvider'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { StudentTilesPage } from './features/student-tiles/StudentTilesPage'
import { CaseloadPage } from './features/caseload/CaseloadPage'
import { MtssPage } from './features/mtss/MtssPage'
import { EvaluationsPage } from './features/evaluations/EvaluationsPage'
import { FbaBipPage } from './features/fba-bip/FbaBipPage'
import { AccessibilityPage } from './features/accessibility/AccessibilityPage'
import { TemplatesPage } from './features/templates-forms/TemplatesPage'
import { GenerationPage } from './features/generation/GenerationPage'
import { QuickToolsPage } from './features/quick-tools/QuickToolsPage'
import { ResourcesPage } from './features/resources/ResourcesPage'
import { AdminDistrictGate } from './features/district-profile/AdminDistrictGate'
import { Section504Page } from './features/section504/Section504Page'
import { MllPage } from './features/mll/MllPage'
import { ProgressMonitoringPage } from './features/progress-monitoring/ProgressMonitoringPage'
import { CaseloadBinderPage } from './features/caseload-binder/CaseloadBinderPage'
import { MotivationGamePage } from './features/motivation-game/MotivationGamePage'
import { EnrichRemindersPage } from './features/enrich-reminders/EnrichRemindersPage'
import { ParentContactsPage } from './features/parent-contacts/ParentContactsPage'
import { MaterialSessionPage } from './features/classroom-materials/MaterialSessionPage'
import { FbaTallyPopoutPage } from './features/fba-bip/FbaTallyPopoutPage'
import { WeeklyPlannerPage } from './features/weekly-planner/WeeklyPlannerPage'
import { MeetingPrepPage } from './features/meeting-prep/MeetingPrepPage'
import { PrivateSchoolPage } from './features/private-school/PrivateSchoolPage'

export default function App() {
  return (
    <ThemeProvider>
      <HelpAssistProvider>
        <AdminRoleProvider>
          <DistrictProfileProvider>
            <StudentsProvider>
              <BrowserRouter>
                <Routes>
                  {/* Fullscreen / pop-out surfaces (no main chrome) */}
                  <Route path="materials/session/:id" element={<MaterialSessionPage />} />
                  <Route path="fba/tally/:sessionId" element={<FbaTallyPopoutPage />} />
                  <Route element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="students" element={<StudentTilesPage />} />
                    <Route path="caseload" element={<CaseloadPage />} />
                    <Route path="progress" element={<ProgressMonitoringPage />} />
                    <Route path="binder" element={<CaseloadBinderPage />} />
                    <Route path="game" element={<MotivationGamePage />} />
                    <Route path="reminders" element={<EnrichRemindersPage />} />
                    <Route path="contacts" element={<ParentContactsPage />} />
                    <Route path="planner" element={<WeeklyPlannerPage />} />
                    <Route path="meeting-prep" element={<MeetingPrepPage />} />
                    <Route path="mtss" element={<MtssPage />} />
                    <Route path="evaluations" element={<EvaluationsPage />} />
                    <Route path="fba" element={<FbaBipPage />} />
                    <Route path="section504" element={<Section504Page />} />
                    <Route path="mll" element={<MllPage />} />
                    <Route path="private-school" element={<PrivateSchoolPage />} />
                    <Route path="accessibility" element={<AccessibilityPage />} />
                    <Route path="templates" element={<TemplatesPage />} />
                    <Route path="generation" element={<GenerationPage />} />
                    <Route path="tools" element={<QuickToolsPage />} />
                    <Route path="resources" element={<ResourcesPage />} />
                    <Route path="district" element={<AdminDistrictGate />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </StudentsProvider>
          </DistrictProfileProvider>
        </AdminRoleProvider>
      </HelpAssistProvider>
    </ThemeProvider>
  )
}
