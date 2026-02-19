import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { PatientFormPage } from '@/pages/PatientFormPage';
import { PatientDetailPage } from '@/pages/PatientDetailPage';
import { DevicesPage } from '@/pages/DevicesPage';
import { SimsPage } from '@/pages/SimsPage';
import { AdverseEventsPage } from '@/pages/AdverseEventsPage';
import { IssuesPage } from '@/pages/IssuesPage';
import { RemindersPage } from '@/pages/RemindersPage';
import { ReportsPage } from '@/pages/ReportsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/new" element={<PatientFormPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="patients/:id/edit" element={<PatientFormPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="sims" element={<SimsPage />} />
          <Route path="adverse-events" element={<AdverseEventsPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
