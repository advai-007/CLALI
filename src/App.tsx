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

// Workshop Game
import { WorkshopProvider } from './games/workshop/WorkshopContext';
import GarageHub from './games/workshop/screens/GarageHub';
import GearboxStation from './games/workshop/screens/GearboxStation';
import TireBalanceBay from './games/workshop/screens/TireBalanceBay';
import WiringPanel from './games/workshop/screens/WiringPanel';
import FuelMixMonitor from './games/workshop/screens/FuelMixMonitor';
import BoltTightening from './games/workshop/screens/BoltTightening';

// Word Factory Game
import { ReadingProvider } from './games/reading/ReadingContext';
import WordFactoryLevel1 from './games/reading/screens/WordFactoryLevel1';
import WordFactoryLevel2 from './games/reading/screens/WordFactoryLevel2';
import WordFactoryLevel3 from './games/reading/screens/WordFactoryLevel3';
import WordFactoryLevel4 from './games/reading/screens/WordFactoryLevel4';
import WordFactoryLevel5 from './games/reading/screens/WordFactoryLevel5';

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

            {/* Workshop Game Routes */}
            <Route path="/workshop" element={<WorkshopProvider><GarageHub /></WorkshopProvider>} />
            <Route path="/workshop/gearbox" element={<WorkshopProvider><GearboxStation /></WorkshopProvider>} />
            <Route path="/workshop/tires" element={<WorkshopProvider><TireBalanceBay /></WorkshopProvider>} />
            <Route path="/workshop/wiring" element={<WorkshopProvider><WiringPanel /></WorkshopProvider>} />
            <Route path="/workshop/fuel" element={<WorkshopProvider><FuelMixMonitor /></WorkshopProvider>} />
            <Route path="/workshop/bolts" element={<WorkshopProvider><BoltTightening /></WorkshopProvider>} />

            {/* Word Factory Game Routes */}
            <Route path="/word-factory" element={<Navigate to="/word-factory/level1" replace />} />
            <Route path="/word-factory/level1" element={<ReadingProvider><WordFactoryLevel1 /></ReadingProvider>} />
            <Route path="/word-factory/level2" element={<ReadingProvider><WordFactoryLevel2 /></ReadingProvider>} />
            <Route path="/word-factory/level3" element={<ReadingProvider><WordFactoryLevel3 /></ReadingProvider>} />
            <Route path="/word-factory/level4" element={<ReadingProvider><WordFactoryLevel4 /></ReadingProvider>} />
            <Route path="/word-factory/level5" element={<ReadingProvider><WordFactoryLevel5 /></ReadingProvider>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TrackingProvider>
    </AuthProvider>
  );
}

export default App;
