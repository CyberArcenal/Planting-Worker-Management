import { Navigate, Route, Routes } from "react-router-dom";
import PageNotFound from "../components/Shared/PageNotFound";
import ProtectedRoute from "../app/ProtectedRoute";
import Layout from "../layouts/Layout";
import BukidReportsPage from "../pages/Analytics/Bukid";
import PitakProductivityPage from "../pages/Analytics/PitakProductivity";
import FinancialReportsPage from "../pages/Analytics/FinancialReports";
import WorkerPerformancePage from "../pages/Analytics/WorkerPerformance";
import BukidFormPage from "../pages/Bukid/Form";
import PitakFormPage from "../pages/Pitak/Form";
import WorkerFormPage from "../pages/Worker/Form/WorkerForm";
import DebtFormPage from "../pages/Debt/Form/DebtForm";
import PitakTablePage from "../pages/Pitak";
import AssignmentTablePage from "../pages/Assignment/AssignmentTablePage";
import DebtTablePage from "../pages/Debt";
import SessionTablePage from "../pages/Session";
import FarmManagementSettingsPage from "../pages/Settings";
import HistoryPage from "../pages/History";
import DashboardPage from "../pages/dashboard/DashboardPage";
import BukidTablePage from "../pages/Bukid";
import WorkerTablePage from "../pages/Worker";
import PaymentTablePage from "../pages/Payment";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Bukid & Pitak */}
        <Route path="/farms/bukid" element={<BukidTablePage />} />
        <Route path="/bukid/create" element={<BukidFormPage />} />
        <Route path="/bukid/edit/:id" element={<BukidFormPage />} />

        <Route path="/farms/pitak" element={<PitakTablePage />} />
        <Route path="/farms/pitak/form" element={<PitakFormPage />} />
        <Route path="/farms/pitak/form/:id" element={<PitakFormPage />} />

        <Route path="/farms/assignments" element={<AssignmentTablePage />} />
        {/* Kabisilya & Workers */}

        <Route path="/workers/list" element={<WorkerTablePage />} />
        <Route path="/workers" element={<WorkerTablePage />} />
        <Route path="/workers/form" element={<WorkerFormPage />} />
        <Route path="/workers/form/:id" element={<WorkerFormPage />} />

        {/* Payroll & Finance */}
        <Route path="/finance/payments" element={<PaymentTablePage />} />
        <Route path="/finance/debts" element={<DebtTablePage />} />
        <Route path="/finance/debts/form" element={<DebtFormPage />} />
        <Route path="/finance/debts/form/:id" element={<DebtFormPage />} />
        <Route path="/finance/history" element={<HistoryPage />} />

        {/* Reports & Analytics */}
        <Route path="/analytics/bukid" element={<BukidReportsPage />} />
        <Route path="/analytics/pitak" element={<PitakProductivityPage />} />
        <Route path="/analytics/finance" element={<FinancialReportsPage />} />
        <Route path="/analytics/workers" element={<WorkerPerformancePage />} />

        {/* System */}
        <Route path="/system/sessions" element={<SessionTablePage />} />
        <Route
          path="/system/settings"
          element={<FarmManagementSettingsPage />}
        />
        {/* 404 */}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
