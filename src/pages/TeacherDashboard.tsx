import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { studentMetricsApi } from '../services/studentMetricsApi';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [teacherName, setTeacherName] = useState('');
    const [classData, setClassData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                // Fetch teacher name
                const { data: profile } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (profile) setTeacherName(profile.full_name || '');

                // Fetch real class metrics
                const data = await studentMetricsApi.getTeacherDashboardData(user.id);
                setClassData(data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const totalStudents = classData.reduce((acc, cls) => acc + cls.studentCount, 0);
    const overallDistribution = classData.reduce((acc, cls) => {
        acc.optimal += cls.distribution.optimal;
        acc.low += cls.distribution.low;
        acc.struggling += cls.distribution.struggling;
        acc.critical += cls.distribution.critical;
        return acc;
    }, { optimal: 0, low: 0, struggling: 0, critical: 0 });

    const interventionQueue = classData.flatMap(cls =>
        cls.students.filter((s: any) => s.avg_load > 6)
    ).slice(0, 5);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 font-display min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <aside className="w-20 bg-[#0c1427] flex flex-col items-center py-6 gap-8 z-50">
                    <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <span className="material-icons-round">psychology</span>
                    </div>
                    <nav className="flex flex-col gap-6 flex-1">
                        <button
                            className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white hover:bg-[#3b82f6] hover:shadow-lg hover:shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/teacher-dashboard')}
                            title="Dashboard"
                        >
                            <span className="material-icons-round">person</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/student-analysis')}
                            title="Student Analysis"
                        >
                            <span className="material-icons-round">groups</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/class-management')}
                            title="Class Management"
                        >
                            <span className="material-icons-round">assignment</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/add-student')}
                            title="Add Student"
                        >
                            <span className="material-icons-round">person_add</span>
                        </button>
                    </nav>
                    <div className="flex flex-col gap-6">
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20 hover:scale-110 active:scale-95 transition-all duration-300">
                            <span className="material-icons-round">logout</span>
                        </button>
                        <img alt="Profile Avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-slate-700 hover:border-[#3b82f6] hover:scale-110 cursor-pointer transition-all duration-300" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher" />
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold dark:text-white">Welcome back, {teacherName || 'Teacher'}</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Review student performance and cognitive load in real-time.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-card-light dark:bg-card-dark shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-300" onClick={() => setIsDark(!isDark)}>
                                <span className="material-icons-round hover:rotate-12 transition-transform duration-300">{isDark ? 'light_mode' : 'dark_mode'}</span>
                            </button>
                        </div>
                    </header>
                    <div className="grid grid-cols-12 gap-6">
                        {/* Active Class Modules */}
                        <div className="col-span-12 xl:col-span-8 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg">Active Classes</h2>
                                    <span className="material-icons-round text-slate-300 text-lg">info</span>
                                </div>
                            </div>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-50 dark:border-slate-800">
                                        <tr>
                                            <th className="pb-3 font-semibold">Class Name</th>
                                            <th className="pb-3 font-semibold text-center">Students</th>
                                            <th className="pb-3 font-semibold text-right">Avg. Load</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                                        {classData.length > 0 ? classData.map((cls) => (
                                            <tr key={cls.classId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-semibold">{cls.className}</div>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <div className="font-bold">{cls.studentCount}</div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 shrink-0">
                                                        <span className={`material-icons-round text-sm ${cls.avgLoad > 6 ? 'text-red-500' : cls.avgLoad > 4 ? 'text-amber-500' : 'text-emerald-500'}`}>bolt</span>
                                                        <span className="font-bold">{cls.avgLoad}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-slate-400">No active classes found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Cognitive Load Overview */}
                        <div className="col-span-12 xl:col-span-4 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg">Cognitive Load Overview</h2>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6 items-center">
                                <div className="relative w-40 h-40 shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="stroke-current text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                                        {/* Simplified donut chart segments */}
                                        <path className="stroke-current text-emerald-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${(overallDistribution.optimal / (totalStudents || 1)) * 100}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                                        <path className="stroke-current text-blue-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${(overallDistribution.low / (totalStudents || 1)) * 100}, 100`} strokeDashoffset={-((overallDistribution.optimal / (totalStudents || 1)) * 100)} strokeLinecap="round" strokeWidth="3"></path>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">{totalStudents}</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Students</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-3">
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <span className="text-slate-500 text-sm">Optimal</span>
                                        <span className="font-bold ml-auto">{overallDistribution.optimal}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        <span className="text-slate-500 text-sm">Normal</span>
                                        <span className="font-bold ml-auto">{overallDistribution.low}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                        <span className="text-slate-500 text-sm">Struggling</span>
                                        <span className="font-bold ml-auto">{overallDistribution.struggling}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <span className="text-slate-500 text-sm">Critical</span>
                                        <span className="font-bold ml-auto">{overallDistribution.critical}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intervention Queue */}
                        <div className="col-span-12 lg:col-span-12 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg text-red-500">Critical Intervention Queue</h2>
                                    <span className="material-icons-round text-red-300 text-lg">warning</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {interventionQueue.length > 0 ? interventionQueue.map((student: any) => (
                                    <div key={student.participant_id} className="flex items-center gap-4 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm border border-red-200">
                                            {student.avatar || '👤'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-red-700 dark:text-red-400">{student.full_name}</div>
                                            <div className="text-xs text-red-500 font-medium">High Cognitive Overload</div>
                                        </div>
                                        <button className="ml-auto w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                            <span className="material-icons-round text-sm">visibility</span>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        No students need immediate intervention.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TeacherDashboard;
