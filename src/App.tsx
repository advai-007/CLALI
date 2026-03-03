import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import StudentLoginPage from './pages/StudentLoginPage';
import ParentDashboard from './pages/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AddStudentPage from './pages/AddStudentPage';
import StudentAnalysis from './pages/StudentAnalysis';
import ClassManagement from './pages/ClassManagement';
import ReadingModule from './pages/ReadingModule';
import SignupPage from './pages/SignupPage';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TrackingProvider } from './context/TrackingContext';
import CalibrationPage from './pages/CalibrationPage';
import SpaceCargoLoader from './pages/SpaceCargoLoader';

function App() {
  return (
    <AuthProvider>
      <TrackingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/student-login" element={<StudentLoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/parent-dashboard"
              element={
                <ProtectedRoute>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-dashboard"
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-student"
              element={
                <ProtectedRoute>
                  <AddStudentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-analysis"
              element={
                <ProtectedRoute>
                  <StudentAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/class-management"
              element={
                <ProtectedRoute>
                  <ClassManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/reading" element={<ReadingModule />} />
            <Route path="/calibration" element={<CalibrationPage />} />
            <Route path="/modules/space-cargo" element={<SpaceCargoLoader />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TrackingProvider>
    </AuthProvider>
  );
}

export default App;
