import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import Wall from "./pages/Wall";
import StudyPlanner from "./pages/StudyPlanner";
import DoubtSolver from "./pages/DoubtSolver";
import StudyTimer from "./pages/StudyTimer";
import MockTests from "./pages/MockTests";
import Goals from "./pages/Goals";
import Revisions from "./pages/Revisions";
import Syllabus from "./pages/Syllabus";
import MathsKit from "./pages/MathsKit";
import Challenges from "./pages/Challenges";
import YearTracker from "./pages/YearTracker";
import Notes from "./pages/Notes";
import Analytics from "./pages/Analytics";
import Progress from "./pages/Progress";
import Recharge from "./pages/Recharge";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />

      {/* Protected app shell with nested views */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/wall" element={<Wall />} />
        <Route path="/planner" element={<StudyPlanner />} />
        <Route path="/doubt-solver" element={<DoubtSolver />} />
        <Route path="/timer" element={<StudyTimer />} />
        <Route path="/mock-tests" element={<MockTests />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/revisions" element={<Revisions />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/maths-kit" element={<MathsKit />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/year-tracker" element={<YearTracker />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/recharge" element={<Recharge />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;