import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

interface ClassData {
    id: string;
    name: string;
    class_code: string;
    teacher_id: string;
    created_at: string;
    student_count?: number;
}

const ClassManagement: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newClassName, setNewClassName] = useState('');
    const [newClassGrade, setNewClassGrade] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const fetchClasses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch classes for this teacher
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('*')
                .eq('teacher_id', user.id)
                .order('created_at', { ascending: false });

            if (classError) throw classError;

            // For each class, fetch the student count
            const classesWithCounts = await Promise.all((classData || []).map(async (c) => {
                const { count, error: countError } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', c.id)
                    .eq('role', 'student');

                if (countError) console.error("Error fetching count for class", c.id, countError);
                return { ...c, student_count: count || 0 };
            }));

            setClasses(classesWithCounts);
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!user) return;
        if (!newClassName.trim() || !newClassGrade || newClassGrade === 'Select Grade Level') {
            setErrorMsg('Please provide a class name and grade level');
            return;
        }

        setSubmitting(true);
        try {
            // Generate a random 5-character alphanumeric class code
            const generateCode = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let result = '';
                for (let i = 0; i < 5; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return result;
            };

            const classCode = generateCode();

            // Store in Supabase
            const { error: insertError } = await supabase
                .from('classes')
                .insert([
                    {
                        name: `${newClassGrade} ${newClassName}`,
                        class_code: classCode,
                        teacher_id: user.id
                    }
                ]);

            if (insertError) throw insertError;

            // Reset form and refetch
            setNewClassName('');
            setNewClassGrade('');
            await fetchClasses();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to create class');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 font-display min-h-screen">
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
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/student-analysis')}
                            title="Student Analysis"
                        >
                            <span className="material-icons-round">groups</span>
                        </button>
                        <button
                            className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white hover:bg-[#3b82f6] hover:shadow-lg hover:shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all duration-300"
                            onClick={() => navigate('/class-management')}
                            title="Class Management"
                        >
                            <span className="material-icons-round">assignment</span>
                        </button>
                        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300">
                            <span className="material-icons-round">analytics</span>
                        </button>
                        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300">
                            <span className="material-icons-round">settings</span>
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
                        <img alt="Profile Avatar" className="w-10 h-10 rounded-xl object-cover border-2 border-slate-700 hover:border-[#3b82f6] hover:scale-110 cursor-pointer transition-all duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGoDb-nuQrQfKR8FGBsdEDXg8F4iYljtH_DmGqzgvC2reLZAyvDwINSIMhkxd-C3yjegIQPzxrtPThw7Fm8N2Gd2krKOEOJA35ZFtdbryUyHK9eP26XWZerbIbOh97xuDs1EBWGLFah6Fo8LmLewUOH92R9WFnCj_rYk6_55tagtxTNyIAywhiKJcVFww7kWKjzJBPDMBSAJTz9KYFAIK0vX5ydwlkM7Ou4SSCFPY34dM0xbqaa3y9ZG8O9BGt1aPgKXs8lC1742k" />
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-y-auto">
                    {/* Minimal Sticky Top Navigation */}
                    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20 transition-colors duration-300">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">CLALI</h2>
                            <div className="h-4 w-px bg-slate-300 dark:border-slate-700"></div>
                            <span className="text-slate-500 text-sm font-medium">Class Management</span>
                        </div>
                    </header>

                    <div className="p-8 max-w-7xl mx-auto w-full pb-20 mt-4">
                        {/* Scrollable Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Class Management</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your active learning environments and student groups.</p>
                            </div>

                            {/* Action Buttons & Search */}
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                                <div className="relative w-full sm:w-72">
                                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                                    <input className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm transition-all text-slate-900 dark:text-white shadow-sm" placeholder="Search classes or codes..." type="text" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                        onClick={() => setIsDark(!isDark)}
                                        title="Toggle Dark Mode"
                                    >
                                        <span className="material-icons-round text-xl hover:rotate-12 transition-transform duration-300">{isDark ? 'light_mode' : 'dark_mode'}</span>
                                    </button>
                                    <button
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white font-semibold rounded-xl text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
                                        onClick={() => {
                                            document.getElementById('quick-setup-section')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        <span className="material-icons-round font-bold text-lg">add</span>
                                        <span>Add New Class</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex justify-end gap-3 mb-8">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                                <span className="material-icons-round text-xl">filter_list</span>
                                <span className="text-sm font-medium">Filter</span>
                            </button>
                            <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <span className="material-icons-round">grid_view</span>
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                                {classes.map((cls, index) => {
                                    const gradients = [
                                        'from-blue-500/10 to-blue-600/5',
                                        'from-emerald-500/10 to-emerald-600/5',
                                        'from-amber-500/10 to-amber-600/5',
                                        'from-purple-500/10 to-purple-600/5',
                                    ];
                                    const textColors = ['text-blue-500', 'text-emerald-500', 'text-amber-500', 'text-purple-500'];
                                    const bgBadges = ['bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400', 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'];
                                    const colorIndex = index % 4;

                                    return (
                                        <div key={cls.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                                            <div className={`h-28 bg-gradient-to-br ${gradients[colorIndex]} p-5 flex items-start justify-between`}>
                                                <span className={`${bgBadges[colorIndex]} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>Active</span>
                                                <button className="p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-lg text-slate-600 dark:text-slate-300">
                                                    <span className="material-icons-round text-lg">more_horiz</span>
                                                </button>
                                            </div>
                                            <div className="p-6 -mt-10 flex-1 flex flex-col">
                                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl w-fit shadow-sm border border-slate-100 dark:border-slate-700 mb-4 h-12 flex items-center justify-center">
                                                    <span className={`material-icons-round ${textColors[colorIndex]} text-2xl`}>school</span>
                                                </div>
                                                <h3 className="text-lg font-bold dark:text-white">{cls.name}</h3>
                                                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-icons-round text-base text-slate-400">vpn_key</span>
                                                        <span>Code: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{cls.class_code}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-icons-round text-base text-slate-400">group</span>
                                                        <span>{cls.student_count} Students enrolled</span>
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-6 flex flex-col w-full">
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 w-full">
                                                        <button className="text-[#3b82f6] font-bold text-sm hover:underline shrink-0">View Class</button>
                                                        <button
                                                            className="text-red-500 font-medium text-sm hover:text-red-600 shrink-0"
                                                            onClick={async () => {
                                                                if (window.confirm('Are you sure you want to remove this class?')) {
                                                                    await supabase.from('classes').delete().eq('id', cls.id);
                                                                    fetchClasses();
                                                                }
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div
                                    className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group min-h-[260px]"
                                    onClick={() => document.getElementById('quick-setup-section')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <span className="material-icons-round text-3xl">add</span>
                                    </div>
                                    <span className="font-bold text-slate-600 dark:text-slate-300">Create New Class</span>
                                    <span className="text-xs text-slate-400 mt-1">Initialize workspace</span>
                                </div>
                            </div>
                        )}

                        <section id="quick-setup-section" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm scroll-mt-24">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Class Setup</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Provide basic information to initialize a new digital classroom. A unique code will be generated.</p>
                                {errorMsg && (
                                    <p className="text-red-500 text-sm mt-2">{errorMsg}</p>
                                )}
                            </div>
                            <form className="grid grid-cols-1 md:grid-cols-3 gap-8" onSubmit={handleCreateClass}>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Class Name</label>
                                    <input
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent py-2.5 px-3 transition-all outline-none dark:text-white"
                                        placeholder="e.g. Biology"
                                        type="text"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Grade Level</label>
                                    <select
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent py-2.5 px-3 transition-all outline-none dark:text-white"
                                        value={newClassGrade}
                                        onChange={(e) => setNewClassGrade(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Grade Level</option>
                                        <option value="Grade 1">Grade 1</option>
                                        <option value="Grade 2">Grade 2</option>
                                        <option value="Grade 3">Grade 3</option>
                                        <option value="Grade 4">Grade 4</option>
                                        <option value="Grade 5">Grade 5</option>
                                        <option value="Grade 6">Grade 6</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 dark:shadow-indigo-900/20 disabled:opacity-50"
                                        type="submit"
                                        disabled={submitting}
                                    >
                                        <span className="material-icons-round text-xl">{submitting ? 'hourglass_empty' : 'rocket_launch'}</span>
                                        <span>{submitting ? 'Creating...' : 'Initialize Class'}</span>
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ClassManagement;
