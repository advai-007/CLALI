import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import RoleSelectionPage from './pages/RoleSelectionPage';

// Workshop Game
import { WorkshopProvider } from './games/workshop/WorkshopContext';
import GarageHub from './games/workshop/screens/GarageHub';
import TireBalanceBay from './games/workshop/screens/TireBalanceBay';
import WiringPanel from './games/workshop/screens/WiringPanel';
import FuelMixMonitor from './games/workshop/screens/FuelMixMonitor';
import BoltTightening from './games/workshop/screens/BoltTightening';

// Demo Game
import DemoScreen from './games/demo/DemoScreen';

// Word Factory Game
import { ReadingProvider } from './games/reading/ReadingContext';
import WordFactoryLevel1 from './games/reading/screens/WordFactoryLevel1';
import WordFactoryLevel2 from './games/reading/screens/WordFactoryLevel2';
import WordFactoryLevel3 from './games/reading/screens/WordFactoryLevel3';
import WordFactoryLevel4 from './games/reading/screens/WordFactoryLevel4';
import WordFactoryLevel5 from './games/reading/screens/WordFactoryLevel5';
import WordMatchingGame from './games/reading/screens/WordMatchingGame';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TrackingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RoleSelectionPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/student-login" element={<StudentLoginPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
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
              <Route 
                path="/reading" 
                element={
                  <ProtectedRoute>
                    <ReadingModule />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/calibration" 
                element={
                  <ProtectedRoute>
                    <CalibrationPage />
                  </ProtectedRoute>
                } 
              />

              {/* Project Demo Story */}
              <Route 
                path="/story-demo" 
                element={
                  <ProtectedRoute>
                    <DemoScreen />
                  </ProtectedRoute>
                } 
              />

              {/* Workshop Game Routes */}
              <Route
                path="/workshop"
                element={
                  <ProtectedRoute>
                    <WorkshopProvider>
                      <Outlet />
                    </WorkshopProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<GarageHub />} />
                <Route path="tires" element={<TireBalanceBay />} />
                <Route path="bolts" element={<BoltTightening />} />
                <Route path="wiring" element={<WiringPanel />} />
                <Route path="fuel" element={<FuelMixMonitor />} />
              </Route>

              {/* Word Factory Game Routes */}
              <Route path="/word-factory" element={<Navigate to="/word-factory/level1" replace />} />
              <Route path="/word-factory/level1" element={<ProtectedRoute><ReadingProvider><WordFactoryLevel1 /></ReadingProvider></ProtectedRoute>} />
              <Route path="/word-factory/level2" element={<ProtectedRoute><ReadingProvider><WordFactoryLevel2 /></ReadingProvider></ProtectedRoute>} />
              <Route path="/word-factory/level3" element={<ProtectedRoute><ReadingProvider><WordFactoryLevel3 /></ReadingProvider></ProtectedRoute>} />
              <Route path="/word-factory/level4" element={<ProtectedRoute><ReadingProvider><WordFactoryLevel4 /></ReadingProvider></ProtectedRoute>} />
              <Route path="/word-factory/level5" element={<ProtectedRoute><ReadingProvider><WordFactoryLevel5 /></ReadingProvider></ProtectedRoute>} />
              <Route path="/word-factory/matching" element={<ProtectedRoute><ReadingProvider><WordMatchingGame /></ReadingProvider></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TrackingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
