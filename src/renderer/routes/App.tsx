import { Navigate, Route, Routes } from "react-router-dom";
import PageNotFound from "../components/Shared/PageNotFound";
import ProtectedRoute from "../app/ProtectedRoute";
import Layout from "../layouts/Layout";
import DashboardPage from "../new-pages/dashboard/DashboardPage";
import BukidTablePage from "../pages/Bukid";
import BukidPage from "../new-pages/bukid";
import PitakPage from "../new-pages/pitak";
import FarmManagementSettingsPage from "../new-pages/Settings";
import AuditPage from "../new-pages/audit";
import NotificationLogPage from "../new-pages/NotificationLog";
import WorkersPage from "../new-pages/workers";
import AssignmentsPage from "../new-pages/assignments";
import PaymentsPage from "../new-pages/payments";
import DebtsPage from "../new-pages/debts";
import PitakProductivityPage from "../pages/Analytics/PitakProductivity";
import FinancialReportsPage from "../pages/Analytics/FinancialReports";
import WorkerPerformancePage from "../pages/Analytics/WorkerPerformance";
import SessionsPage from "../new-pages/sessions";
import BukidAnalyticsPage from "../pages/Analytics/Bukid";
import PaymentHistoryPage from "../new-pages/payment-history";
import DebtHistoryPage from "../new-pages/debt-history";
import WorkerPaymentsPage from "../new-pages/worker-payments";
// import BukidReportsPage from "../pages/Analytics/Bukid";
// import PitakProductivityPage from "../pages/Analytics/PitakProductivity";
// import FinancialReportsPage from "../pages/Analytics/FinancialReports";
// import WorkerPerformancePage from "../pages/Analytics/WorkerPerformance";
// import BukidFormPage from "../pages/Bukid/Form";
// import PitakFormPage from "../pages/Pitak/Form";
// import WorkerFormPage from "../pages/Worker/Form/WorkerForm";
// import DebtFormPage from "../pages/Debt/Form/DebtForm";
// import PitakTablePage from "../pages/Pitak";
// import AssignmentTablePage from "../pages/Assignment/AssignmentTablePage";
// import DebtTablePage from "../pages/Debt";
// import SessionTablePage from "../pages/Session";
// import FarmManagementSettingsPage from "../pages/Settings";
// import HistoryPage from "../pages/History";
// import DashboardPage from "../pages/dashboard/DashboardPage";
// import BukidTablePage from "../pages/Bukid";
// import WorkerTablePage from "../pages/Worker";
// import PaymentTablePage from "../pages/Payment";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Bukid & Pitak */}
        <Route path="/farms/bukid" element={<BukidPage />} />

        <Route path="/farms/pitak" element={<PitakPage />} />

        <Route path="/farms/assignments" element={<AssignmentsPage />} />
        {/* Kabisilya & Workers */}

        <Route path="/workers" element={<WorkersPage />} />

        {/* Payroll & Finance */}
        <Route path="/finance/worker/payments" element={<WorkerPaymentsPage/>} />
        <Route path="/finance/payments" element={<PaymentsPage />} />
        <Route path="/finance/debts" element={<DebtsPage />} />
        <Route path="/finance/payment/history" element={<PaymentHistoryPage/>} />
        <Route path="/finance/debt/history" element={<DebtHistoryPage/>} />

        {/* Reports & Analytics */}
        <Route path="/analytics/bukid" element={<BukidAnalyticsPage />} />
        <Route path="/analytics/pitak" element={<PitakProductivityPage />} />
        <Route path="/analytics/finance" element={<FinancialReportsPage />} />
        <Route path="/analytics/workers" element={<WorkerPerformancePage />} />

        {/* System */}
        <Route path="/system/sessions" element={<SessionsPage />} />
        <Route
          path="/system/settings"
          element={<FarmManagementSettingsPage />}
        />
        <Route path="/notification-logs" element={<NotificationLogPage/>}/>
        <Route path="/audit" element={<AuditPage/>}/>
        {/* 404 */}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
