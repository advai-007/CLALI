import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentMetricsApi } from '../services/studentMetricsApi';

const StudentAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Data State
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentDetails, setStudentDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const dashboardData = await studentMetricsApi.getTeacherDashboardData(user.id);
                setClasses(dashboardData);

                if (dashboardData.length > 0) {
                    const firstClass = dashboardData[0];
                    setSelectedClassId(firstClass.classId);
                    setStudents(firstClass.students);

                    if (firstClass.students.length > 0) {
                        const firstStudent = firstClass.students[0];
                        setSelectedStudentId(firstStudent.participant_id);
                        const details = await studentMetricsApi.getStudentDetails(firstStudent.participant_id);
                        setStudentDetails(details);
                    }
                }
            } catch (error) {
                console.error('Error fetching student analysis data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Update students when class changes
    const handleClassChange = (classId: string) => {
        const cls = classes.find(c => c.classId === classId);
        if (cls) {
            setSelectedClassId(classId);
            setStudents(cls.students);
            if (cls.students.length > 0) {
                handleStudentSelect(cls.students[0].participant_id);
            } else {
                setSelectedStudentId(null);
                setStudentDetails(null);
            }
        }
    };

    // Fetch details when student selection changes
    const handleStudentSelect = async (studentId: string) => {
        try {
            setSelectedStudentId(studentId);
            setLoading(true);
            const details = await studentMetricsApi.getStudentDetails(studentId);
            setStudentDetails(details);
            setIsSearchOpen(false);
            setSearchQuery('');
        } catch (error) {
            console.error('Error fetching student details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedClass = classes.find(c => c.classId === selectedClassId);

    if (!user) return null;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <div className="flex h-screen overflow-hidden">
                <aside className="w-20 bg-[#0c1427] flex flex-col items-center py-6 gap-8 z-50">
                    <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <span className="material-icons-round">psychology</span>
                    </div>
                    <nav className="flex flex-col gap-6 flex-1">
                        <button
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/teacher-dashboard')}
                            title="Dashboard"
                        >
                            <span className="material-icons-round">person</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl bg-[#3b82f6] shadow-lg shadow-blue-500/20 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300"
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
                        <img alt="Profile Avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-slate-700 hover:border-[#3b82f6] hover:scale-110 cursor-pointer transition-all duration-300" src={user.user_metadata?.avatar || "https://ui-avatars.com/api/?name=" + (user.user_metadata?.full_name || "User")} />
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background-dark/50 p-8">
                    <header className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-40 rounded-2xl mb-8 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                {classes.map(cls => (
                                    <button
                                        key={cls.classId}
                                        onClick={() => handleClassChange(cls.classId)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${selectedClassId === cls.classId ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                    >
                                        {cls.className}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            {/* Search Dropdown */}
                            <div className="relative">
                                <div className={`flex items-center bg-transparent border-2 ${isSearchOpen ? 'border-[#3b82f6]' : 'border-transparent'} rounded-[20px] px-3 py-1.5 w-64 transition-all z-50 relative bg-white dark:bg-card-dark ${!isSearchOpen && 'hover:bg-slate-50 dark:hover:bg-slate-800'} ${searchQuery || isSearchOpen ? 'shadow-sm' : ''}`}>
                                    <span className={`material-icons-round text-lg mr-2 ${isSearchOpen ? 'text-[#3b82f6]' : 'text-slate-400'}`}>search</span>
                                    <input
                                        className="bg-transparent border-none outline-none w-full text-sm dark:text-white placeholder-slate-400"
                                        placeholder="Search student..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchOpen(true)}
                                        onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                                    />
                                </div>

                                {/* Dropdown Menu */}
                                {isSearchOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-[340px] bg-white dark:bg-card-dark rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden z-[100]">
                                        <div className="p-4">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Matching Students</div>
                                            <div className="space-y-1">
                                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                                    <div
                                                        key={student.participant_id}
                                                        onClick={() => handleStudentSelect(student.participant_id)}
                                                        className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors border ${selectedStudentId === student.participant_id ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'}`}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <img alt={student.full_name} className="w-10 h-10 rounded-full object-cover" src={student.avatar || `https://ui-avatars.com/api/?name=${student.full_name}&background=random`} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-800 dark:text-white">{student.full_name}</div>
                                                            <div className="text-[11px] text-[#3b82f6] font-medium">{selectedClass?.className || 'Student'} • Active</div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-4 text-center text-xs text-slate-400">No students found</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 relative">
                                <span className="material-icons-round">notifications</span>
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-card-dark"></span>
                            </button>
                            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-card-light dark:bg-card-dark shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setIsDark(!isDark)}>
                                <span className="material-icons-round text-sm">{isDark ? 'light_mode' : 'dark_mode'}</span>
                            </button>
                            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
                                <div className="text-right">
                                    <div className="text-sm font-bold">{user.user_metadata?.full_name || 'Teacher'}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{user.user_metadata?.role || 'Educator'}</div>
                                </div>
                                <img alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer" src={user.user_metadata?.avatar || "https://ui-avatars.com/api/?name=" + (user.user_metadata?.full_name || "User")} onClick={handleLogout} />
                            </div>
                        </div>
                    </header>
                    <div className="max-w-7xl mx-auto space-y-8">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : studentDetails ? (
                            <>
                                <div className="grid grid-cols-4 gap-6">
                                    <div className="bg-blue-50/80 dark:bg-blue-900/10 hover:bg-blue-100/80 dark:hover:bg-blue-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-md p-5 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 shadow-sm cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Total Sessions</span>
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <span className="material-icons-round text-xl">schedule</span>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold mb-1 group-hover:text-blue-700 transition-colors">{studentDetails.stats.totalSessions}</div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                            <span className="material-icons-round text-xs">trending_up</span>
                                            Active this period
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50/80 dark:bg-emerald-900/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-md p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 shadow-sm cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Avg. Duration</span>
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <span className="material-icons-round text-xl">timer</span>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold mb-1 group-hover:text-emerald-700 transition-colors">{studentDetails.stats.avgDuration} <span className="text-sm font-medium text-slate-500 group-hover:text-emerald-600/70">min</span></div>
                                        <div className="text-[10px] font-bold text-slate-500">Target: 20m</div>
                                    </div>
                                    <div className="bg-amber-50/80 dark:bg-amber-900/10 hover:bg-amber-100/80 dark:hover:bg-amber-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-md p-5 rounded-2xl border border-amber-100/50 dark:border-amber-800/30 shadow-sm cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Adaptation Exposure</span>
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <span className="material-icons-round text-xl">analytics</span>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold mb-1 group-hover:text-amber-700 transition-colors">{studentDetails.stats.difficultyElevated} <span className="text-sm font-medium text-slate-500 group-hover:text-amber-600/70">%</span></div>
                                        <div className="text-[10px] font-bold text-slate-500">Live intervention triggers</div>
                                    </div>
                                    <div className="bg-purple-50/80 dark:bg-purple-900/10 hover:bg-purple-100/80 dark:hover:bg-purple-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-md p-5 rounded-2xl border border-purple-100/50 dark:border-purple-800/30 shadow-sm cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">Adaptations</span>
                                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <span className="material-icons-round text-xl">auto_fix_high</span>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold mb-1 group-hover:text-purple-700 transition-colors">{studentDetails.stats.adaptationCount}</div>
                                        <div className="text-[10px] font-bold text-emerald-600">Dynamic adjustments</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="col-span-2 space-y-8">
                                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700/50 transition-all duration-300">
                                            <div className="p-6 flex items-center justify-between border-b border-indigo-100/50 dark:border-indigo-800/50">
                                                <div>
                                                    <h2 className="text-xl font-bold">Analysis: {studentDetails.student.full_name}</h2>
                                                    <p className="text-xs text-slate-400 font-medium mt-1">Real-time Biometric Integration • {studentDetails.stats.totalSessions} Sessions Total</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                        <span className="material-icons-round text-lg">history</span>
                                                        History
                                                    </button>
                                                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200">
                                                        <span className="material-icons-round text-lg">visibility</span>
                                                        Live View
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid grid-cols-3 gap-4 mb-8">
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] transition-all duration-300 cursor-default">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Load</div>
                                                        <div className="text-2xl font-bold">{studentDetails.logs[0]?.type || 'N/A'}</div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] transition-all duration-300 cursor-default">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Support Status</div>
                                                        <div className={`text-2xl font-bold ${studentDetails.stats.adaptationCount > 5 ? 'text-primary' : 'text-emerald-500'}`}>
                                                            {studentDetails.stats.adaptationCount > 5 ? 'Assisted' : 'Optimal'}
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02] transition-all duration-300 cursor-default">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Engagement</div>
                                                        <div className="text-2xl font-bold text-primary">High</div>
                                                    </div>
                                                </div>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <h3 className="text-sm font-bold">Interaction Timeline (Latest Events)</h3>
                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> State</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Adaptation</div>
                                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Success</div>
                                                    </div>
                                                </div>
                                                <div className="h-16 flex rounded-xl overflow-hidden mb-2 shadow-inner border border-slate-100 dark:border-slate-800">
                                                    {studentDetails.logs.slice(0, 10).reverse().map((log: any) => (
                                                        <div
                                                            key={log.id}
                                                            className={`h-full flex-1 border-r border-white/10 ${log.type.includes('SUCCESS') ? 'bg-emerald-400' :
                                                                log.description !== 'State update' ? 'bg-amber-400' : 'bg-primary'
                                                                }`}
                                                            title={`${log.time}: ${log.type}`}
                                                        ></div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-300 dark:text-slate-500 px-1 uppercase tracking-tighter">
                                                    <span>Earliest</span>
                                                    <span>Timeline of Live Interaction</span>
                                                    <span>Latest</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100/50 dark:border-rose-800/30 shadow-sm p-6 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-700/50 transition-all duration-300">
                                            <h2 className="text-lg font-bold mb-6">Learning Distribution</h2>
                                            <div className="h-48 border-b border-l border-slate-100 dark:border-slate-800 relative flex items-end justify-around px-12">
                                                <div className="w-1/3 flex flex-col items-center gap-1 group cursor-pointer">
                                                    <div className="w-12 bg-primary/10 rounded-t-lg h-32 relative group-hover:bg-primary/20 transition-colors">
                                                        <div className="absolute bottom-0 w-full bg-primary rounded-t-lg h-24 group-hover:h-28 transition-all duration-500 ease-out"></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 group-hover:text-primary transition-colors">Cognitive Load</span>
                                                </div>
                                                <div className="w-1/3 flex flex-col items-center gap-1 group cursor-pointer">
                                                    <div className="w-12 bg-amber-100 dark:bg-amber-900/20 rounded-t-lg h-32 relative group-hover:bg-amber-200 dark:group-hover:bg-amber-900/40 transition-colors">
                                                        <div className="absolute bottom-0 w-full bg-amber-400 rounded-t-lg h-16 group-hover:h-20 transition-all duration-500 ease-out"></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 group-hover:text-amber-500 transition-colors">Assistance</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full max-h-[calc(100vh-16rem)]">
                                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                                            <h2 className="text-lg font-bold">Adaptation Log</h2>
                                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-primary text-[10px] font-bold rounded uppercase tracking-wider">Live</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
                                            <div className="flex px-4 py-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm z-10 rounded-lg">
                                                <div className="w-24 shrink-0">Time</div>
                                                <div>Event & State</div>
                                            </div>
                                            <div className="space-y-3">
                                                {studentDetails.logs.length > 0 ? studentDetails.logs.map((log: any) => (
                                                    <div key={log.id} className={`flex rounded-xl p-4 shadow-sm border transition-all group ${log.isCritical ? 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-200/50 dark:border-rose-700/50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600'}`}>
                                                        <div className="w-24 shrink-0">
                                                            <div className={`text-xs font-bold ${log.isCritical ? 'text-rose-600 dark:text-rose-400' : ''}`}>{log.time}</div>
                                                            <div className="text-[9px] text-slate-400 uppercase">{log.ampm}</div>
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm font-bold transition-colors ${log.isCritical ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200 group-hover:text-primary'}`}>
                                                                {log.type.replace(/_/g, ' ')}
                                                            </div>
                                                            <div className={`text-[10px] ${log.isCritical ? 'text-rose-600/70 dark:text-rose-400/70' : 'text-slate-400'}`}>
                                                                {log.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-8 text-center text-xs text-slate-400">No interaction events logged yet</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6 border-t border-slate-50 dark:border-slate-800 shrink-0">
                                            <button className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-colors border border-primary/10 dark:border-primary/20">
                                                Export Full Analysis
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-card-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <span className="material-icons-round text-4xl text-slate-300 mb-4">person_search</span>
                                <p className="text-slate-500 font-medium">Select a student to view detailed analysis</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentAnalysis;
