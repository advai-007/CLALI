import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TeacherSidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/teacher-dashboard', icon: 'dashboard', title: 'Dashboard' },
        { path: '/student-analysis', icon: 'groups', title: 'Student Analysis' },
        { path: '/class-management', icon: 'assignment', title: 'Class Management' },
        { path: '/add-student', icon: 'person_add', title: 'Add Student' },
    ];

    return (
        <aside className="w-20 bg-[#0c1427] flex flex-col items-center py-6 gap-8 z-50 shrink-0 h-screen">
            {/* Logo */}
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/10 border border-slate-700/50 cursor-pointer" onClick={() => navigate('/teacher-dashboard')}>
                <img src="/logo.png" alt="CLALI Logo" className="w-full h-full object-contain" />
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-6 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            isActive(item.path)
                                ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20 scale-110'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95'
                        }`}
                        onClick={() => navigate(item.path)}
                        title={item.title}
                    >
                        <span className="material-icons-round">{item.icon}</span>
                    </button>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-6 pb-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-300"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <span className="material-icons-round">{isDark ? 'light_mode' : 'dark_mode'}</span>
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title="Logout"
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 hover:scale-110 active:scale-95 transition-all duration-300"
                >
                    <span className="material-icons-round">logout</span>
                </button>

                {/* Profile */}
                <img
                    alt="Profile Avatar"
                    className="w-10 h-10 rounded-xl object-cover border-2 border-slate-700 hover:border-[#3b82f6] hover:scale-110 cursor-pointer transition-all duration-300"
                    src={user?.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Teacher'}`}
                />
            </div>
        </aside>
    );
};

export default TeacherSidebar;
