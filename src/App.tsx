import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './app/AppShell'
import { ThemeProvider } from './app/ThemeProvider'
import { HelpAssistProvider } from './lib/help-assist/HelpAssistProvider'
import { DistrictProfileProvider } from './lib/district-profiles/DistrictProfileProvider'
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
import { DistrictProfilePage } from './features/district-profile/DistrictProfilePage'
import { Section504Page } from './features/section504/Section504Page'
import { MllPage } from './features/mll/MllPage'

export default function App() {
  return (
    <ThemeProvider>
      <HelpAssistProvider>
        <DistrictProfileProvider>
          <StudentsProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="students" element={<StudentTilesPage />} />
                  <Route path="caseload" element={<CaseloadPage />} />
                  <Route path="mtss" element={<MtssPage />} />
                  <Route path="evaluations" element={<EvaluationsPage />} />
                  <Route path="fba" element={<FbaBipPage />} />
                  <Route path="section504" element={<Section504Page />} />
                  <Route path="mll" element={<MllPage />} />
                  <Route path="accessibility" element={<AccessibilityPage />} />
                  <Route path="templates" element={<TemplatesPage />} />
                  <Route path="generation" element={<GenerationPage />} />
                  <Route path="tools" element={<QuickToolsPage />} />
                  <Route path="resources" element={<ResourcesPage />} />
                  <Route path="district" element={<DistrictProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </StudentsProvider>
        </DistrictProfileProvider>
      </HelpAssistProvider>
    </ThemeProvider>
  )
}
