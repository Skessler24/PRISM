import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { ThemeProvider } from './app/ThemeProvider'
import { HelpAssistProvider } from './lib/help-assist/HelpAssistProvider'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { StudentTilesPage } from './features/student-tiles/StudentTilesPage'
import { CaseloadPage } from './features/caseload/CaseloadPage'
import { MtssPage } from './features/mtss/MtssPage'
import { EvaluationsPage } from './features/evaluations/EvaluationsPage'
import { AccessibilityPage } from './features/accessibility/AccessibilityPage'
import { TemplatesPage } from './features/templates-forms/TemplatesPage'
import { ResourcesPage } from './features/resources/ResourcesPage'
import { DistrictProfilePage } from './features/district-profile/DistrictProfilePage'

export default function App() {
  return (
    <ThemeProvider>
      <HelpAssistProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="students" element={<StudentTilesPage />} />
              <Route path="caseload" element={<CaseloadPage />} />
              <Route path="mtss" element={<MtssPage />} />
              <Route path="evaluations" element={<EvaluationsPage />} />
              <Route path="accessibility" element={<AccessibilityPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="district" element={<DistrictProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </HelpAssistProvider>
    </ThemeProvider>
  )
}
