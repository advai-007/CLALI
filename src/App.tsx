import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import StudentLoginPage from './pages/StudentLoginPage';
import ReadingModule from './pages/ReadingModule';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/student-login" element={<StudentLoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/reading" element={<ReadingModule />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
