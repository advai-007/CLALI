import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import StudentLoginPage from './pages/StudentLoginPage';
import ReadingModule from './pages/ReadingModule';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student-login" element={<StudentLoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reading" element={<ReadingModule />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
