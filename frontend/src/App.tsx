import { Route, Routes } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/public/Home";
import Try from "./pages/public/Try";
import Apply from "./pages/public/Apply";
import NotFound from "./pages/public/NotFound";
import LearnerDashboard from "./pages/learn/LearnerDashboard";
import QuizPage from "./pages/learn/QuizPage";
import Login from "./pages/admin/Login";
import Overview from "./pages/admin/Overview";
import Applications from "./pages/admin/Applications";
import Selection from "./pages/admin/Selection";
import Learners from "./pages/admin/Learners";
import Waitlist from "./pages/admin/Waitlist";
import SettingsPage from "./pages/admin/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="try" element={<Try />} />
        <Route path="apply" element={<Apply />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="learn/:token" element={<LearnerDashboard />} />
      <Route path="learn/:token/quiz/:phase" element={<QuizPage />} />
      <Route path="admin/login" element={<Login />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="applications" element={<Applications />} />
        <Route path="selection" element={<Selection />} />
        <Route path="learners" element={<Learners />} />
        <Route path="waitlist" element={<Waitlist />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
