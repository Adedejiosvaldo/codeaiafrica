import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/public/Home";
import Try from "./pages/public/Try";
import Apply from "./pages/public/Apply";
import NotFound from "./pages/public/NotFound";
import Privacy from "./pages/public/Privacy";
import FindLink from "./pages/public/FindLink";
import LearnerLayout from "./components/LearnerLayout";
import LearnerHome from "./pages/learn/LearnerHome";
import LearnerPath from "./pages/learn/LearnerPath";
import WeekPage from "./pages/learn/WeekPage";
import QuizHub from "./pages/learn/QuizHub";
import CertificatePage from "./pages/learn/CertificatePage";
import Verify from "./pages/public/Verify";
import DemoDay, { Showcase } from "./pages/public/DemoDay";
import { PageLoader } from "./components/ui";

// The lab bundles a code editor; load it only when a learner opens a lab
const LabPage = lazy(() => import("./pages/learn/LabPage"));
import QuizPage from "./pages/learn/QuizPage";
import Login from "./pages/admin/Login";
import Overview from "./pages/admin/Overview";
import Applications from "./pages/admin/Applications";
import Selection from "./pages/admin/Selection";
import Learners from "./pages/admin/Learners";
import Waitlist from "./pages/admin/Waitlist";
import SettingsPage from "./pages/admin/SettingsPage";
import AIUsage from "./pages/admin/AIUsage";
import Messages from "./pages/admin/Messages";
import Feedback from "./pages/admin/Feedback";
import Attendance from "./pages/admin/Attendance";
import DemoDayAdmin from "./pages/admin/DemoDayAdmin";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="try" element={<Try />} />
        <Route path="apply" element={<Apply />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="find-my-link" element={<FindLink />} />
        <Route path="verify" element={<Verify />} />
        <Route path="demo-day" element={<DemoDay />} />
        <Route path="showcase" element={<Showcase />} />
        <Route path="verify/:code" element={<Verify />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="learn/:token/quiz/:phase" element={<QuizPage />} />
      <Route path="learn/:token/lab/:week" element={<Suspense fallback={<PageLoader />}><LabPage /></Suspense>} />
      <Route path="learn/:token" element={<LearnerLayout />}>
        <Route index element={<LearnerHome />} />
        <Route path="path" element={<LearnerPath />} />
        <Route path="week/:n" element={<WeekPage />} />
        <Route path="quiz" element={<QuizHub />} />
        <Route path="certificate" element={<CertificatePage />} />
      </Route>
      <Route path="admin/login" element={<Login />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="applications" element={<Applications />} />
        <Route path="selection" element={<Selection />} />
        <Route path="learners" element={<Learners />} />
        <Route path="waitlist" element={<Waitlist />} />
        <Route path="ai" element={<AIUsage />} />
        <Route path="messages" element={<Messages />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="demo-day" element={<DemoDayAdmin />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
