import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const AddStudentPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    // Form State
    const [studentName, setStudentName] = useState('');
    const [parentName, setParentName] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

    const [classes, setClasses] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    const [addedStudentDetails, setAddedStudentDetails] = useState<any>(null);

    const avatars = [
        '🐼', '🦄', '🐱', '🐶', '🐻', '🦊', '🦁', '🐯',
        '🐸', '🐧', '🐨', '🦒', '🦩', '🐒', '🦥', '🦔'
    ];

    const secretIcons = [
        '🍕', '🚀', '⭐', '🍦', '🎨', '🎮', '🎸', '⚽',
        '🚲', '🍔', '🎧', '🌈', '🍿', '🍩', '🧩', '🧸'
    ];

    useEffect(() => {
        const fetchClasses = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('teacher_id', user.id);
            if (error) {
                console.error('Error fetching classes:', error);
            } else if (data) {
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0].id);
                }
            }
        };
        fetchClasses();
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!studentName.trim()) {
            setErrorMsg("Student Full Name is required");
            return;
        }
        if (!selectedClass) {
            setErrorMsg("Please select a class");
            return;
        }
        if (!selectedAvatar || !selectedIcon) {
            setErrorMsg("Please select both a Student Avatar and a Secret Access Icon.");
            return;
        }

        setIsSubmitting(true);
        try {
            // First, if parent details are provided, we could create a parent user.
            // For now, let's just create the student and attach the parent details if they exist in a single record wrapper or standard.
            // Under the `users` table:
            // - role = 'student'
            // - full_name = studentName
            // - class_id = selectedClass
            // - avatar = selectedAvatar
            // - secret_icon = selectedIcon
            // - teacher_id = user?.id

            // To properly link parent data, we'll create the parent first if details are provided.
            let parentId = null;

            if (parentName.trim()) {
                const newParentId = uuidv4();
                const { data: parentData, error: parentError } = await supabase
                    .from('users')
                    .insert({
                        id: newParentId,
                        role: 'parent',
                        full_name: parentName.trim() || 'Unknown Parent',
                        // We don't have a phone column in the basic schema, so we omit or store in metadata if available. 
                        // Since `database_tables.md` doesn't show phone, we skip saving phone directly to a column to avoid errors, 
                        // or we'd need to alter the table. We will just save the name.
                    })
                    .select()
                    .single();

                if (parentError) throw parentError;
                if (parentData) parentId = parentData.id;
            }

            // Now create the student
            const newStudentId = uuidv4();
            const { error: studentError } = await supabase
                .from('users')
                .insert({
                    id: newStudentId,
                    role: 'student',
                    full_name: studentName.trim(),
                    class_id: selectedClass,
                    avatar: selectedAvatar,
                    secret_icon: selectedIcon,
                    teacher_id: user?.id,
                    parent_id: parentId
                })
                .select()
                .single();

            if (studentError) throw studentError;

            // Success: Show Modal
            const addedClass = classes.find(c => c.id === selectedClass);
            setAddedStudentDetails({
                name: studentName.trim(),
                className: addedClass?.name || 'Unknown Class',
                classCode: addedClass?.class_code || 'N/A',
                avatar: selectedAvatar,
                secretIcon: selectedIcon
            });
            setModalType('success');
            setShowModal(true);

        } catch (error: any) {
            console.error('Error adding student:', error);
            setErrorMsg(error.message || 'Failed to add student. Please try again.');
            setModalType('error');
            setShowModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display flex flex-col md:flex-row">

            {/* Sidebar */}
            <aside className="w-20 bg-[#0c1427] flex flex-col items-center py-6 gap-8 z-50 shrink-0">
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
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"
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
                        className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white hover:bg-[#3b82f6] hover:shadow-lg hover:shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all duration-300"
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

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:h-screen overflow-hidden relative bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:to-slate-800">
                <header className="h-16 bg-white/80 backdrop-blur-md dark:bg-background-dark/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 sticky top-0 z-10 shrink-0 shadow-sm transition-all hover:bg-white dark:hover:bg-background-dark">
                    <div className="flex items-center gap-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-icons-round text-[#3b82f6]">waving_hand</span>
                            Good Morning, Teacher
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition-colors">
                            <span className="material-icons-round">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-16 flex flex-col items-center overflow-y-auto w-full max-w-full z-0 relative">
                    <div className="w-full max-w-[1024px]">
                        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 md:mb-10 w-full overflow-hidden text-ellipsis px-2 md:px-0 whitespace-nowrap">
                            <button className="hover:text-[#3b82f6] transition-colors group flex items-center gap-1" onClick={() => navigate('/teacher-dashboard')}>
                                <span className="material-icons-round text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                Dashboard
                            </button>
                            <span className="material-icons-round text-xs">chevron_right</span>
                            <span className="text-slate-900 dark:text-white font-medium truncate">Add New Student</span>
                        </nav>

                        <div className="bg-white/90 backdrop-blur-sm dark:bg-[#101922]/90 rounded-2xl shadow-xl shadow-blue-500/5 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 md:mb-0 w-full max-w-full hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                            <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/30 dark:to-slate-800/10">
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Add New Student</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">Complete the details below to register a new student.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12 md:space-y-16">
                                {/* Student Name */}
                                <section className="space-y-4 group">
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider group-focus-within:text-[#3b82f6] transition-colors">Student Full Name</label>
                                    <input
                                        type="text"
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        className={`w-full px-5 py-4 bg-white dark:bg-slate-800 border ${errorMsg && !studentName.trim() ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 dark:border-slate-700 focus:border-[#3b82f6] hover:border-[#3b82f6]/50'} rounded-xl focus:ring-4 focus:ring-[#3b82f6]/10 outline-none transition-all placeholder:text-slate-400 text-lg shadow-sm hover:shadow-md`}
                                        placeholder="e.g. Alex Johnson"
                                    />
                                    {errorMsg && !studentName.trim() && (
                                        <p className="mt-2 text-sm font-medium text-red-500 flex items-center gap-1">
                                            <span className="material-icons-round text-base">error</span>
                                            {errorMsg}
                                        </p>
                                    )}
                                </section>

                                {/* Parent Information */}
                                <section className="space-y-6 group">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Parent Information</h4>
                                    <div className="space-y-2 group">
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 uppercase group-focus-within:text-[#3b82f6] transition-colors">Parent / Guardian Name</label>
                                        <input
                                            type="text"
                                            value={parentName}
                                            onChange={(e) => setParentName(e.target.value)}
                                            className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] hover:border-[#3b82f6]/50 outline-none transition-all shadow-sm hover:shadow-md"
                                            placeholder="Enter name"
                                        />
                                    </div>
                                </section>

                                {/* Select Class */}
                                <section className="space-y-4 group">
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider group-focus-within:text-[#3b82f6] transition-colors">Select Class</label>
                                    <div className="relative hover:shadow-md transition-shadow rounded-xl">
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="w-full appearance-none px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] hover:border-[#3b82f6]/50 outline-none transition-all pr-12 text-lg shadow-sm cursor-pointer"
                                        >
                                            <option value="" disabled>Select a class</option>
                                            {classes.map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name} — {cls.class_code}
                                                </option>
                                            ))}
                                            {classes.length === 0 && (
                                                <option value="" disabled>No classes found. Set one up first.</option>
                                            )}
                                        </select>
                                        <span className="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-2xl">expand_more</span>
                                    </div>
                                    {errorMsg && !selectedClass && (
                                        <p className="mt-2 text-sm font-medium text-red-500 flex items-center gap-1">
                                            <span className="material-icons-round text-base">error</span>
                                            {errorMsg}
                                        </p>
                                    )}
                                </section>

                                {/* Student Avatar */}
                                <section className="space-y-6 md:space-y-8">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Student Avatar</h4>
                                        <p className="text-sm text-slate-500 mt-1">Pick a fun character that the student will use as their profile picture.</p>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-5 w-full">
                                        {avatars.map(icon => (
                                            <div
                                                key={icon}
                                                onClick={() => setSelectedAvatar(icon)}
                                                className={`transition-all duration-300 hover:scale-110 cursor-pointer aspect-square flex items-center justify-center text-3xl md:text-4xl rounded-2xl border-2 ${selectedAvatar === icon
                                                    ? 'border-[#3b82f6] ring-4 ring-[#3b82f6]/20 bg-blue-50 dark:bg-[#3b82f6]/10 shadow-lg shadow-blue-500/20 -translate-y-1'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-[#3b82f6]/30 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm'
                                                    }`}
                                            >
                                                {icon}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Secret Access Icon */}
                                <section className="space-y-6 md:space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-0">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Secret Access Icon</h4>
                                            <p className="text-sm text-slate-500 mt-1">This visual icon acts as the student's password.</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full inline-block self-start md:self-auto shrink-0">
                                            {secretIcons.length} Available Icons
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-5 w-full">
                                        {secretIcons.map(icon => (
                                            <div
                                                key={icon}
                                                onClick={() => setSelectedIcon(icon)}
                                                className={`transition-all duration-300 hover:scale-110 cursor-pointer aspect-square flex items-center justify-center text-3xl md:text-4xl rounded-2xl border-2 ${selectedIcon === icon
                                                    ? 'border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20 -translate-y-1'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm'
                                                    }`}
                                            >
                                                {icon}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="flex flex-col gap-6 pt-12 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-[#3b82f6] to-indigo-500 hover:from-[#2563eb] hover:to-indigo-600 disabled:opacity-50 text-white font-bold py-4 md:py-5 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-[0.99] active:translate-y-0 flex items-center justify-center gap-2 text-lg group"
                                    >
                                        <span className="material-icons-round group-hover:scale-110 transition-transform">person_add</span>
                                        {isSubmitting ? 'Adding...' : 'Add Student'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/teacher-dashboard')}
                                        className="text-center text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2 transition-colors uppercase tracking-widest"
                                    >
                                        Cancel and Return
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="h-10"></div>
                    </div>
                </main>
            </div>

            {/* Popup Modal (Success & Error) */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => modalType === 'success' ? navigate('/teacher-dashboard') : setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className={`p-8 text-center bg-gradient-to-br ${modalType === 'success' ? 'from-green-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-slate-900' : 'from-red-50 to-rose-100/50 dark:from-rose-900/20 dark:to-slate-900'}`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-lg animate-bounce ${modalType === 'success' ? 'bg-green-500 shadow-green-500/30 ring-8 ring-green-500/20' : 'bg-red-500 shadow-red-500/30 ring-8 ring-red-500/20'}`}>
                                    <span className="material-icons-round text-5xl">{modalType === 'success' ? 'check' : 'error_outline'}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                    {modalType === 'success' ? 'Student Added!' : 'Add Student Failed'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400">
                                    {modalType === 'success'
                                        ? 'The student profile has been created successfully.'
                                        : errorMsg || 'An unknown error occurred while saving to the database.'}
                                </p>
                            </div>

                            <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
                                {modalType === 'success' && addedStudentDetails && (
                                    <>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center gap-4">
                                                <div className="text-4xl">{addedStudentDetails.avatar}</div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student</p>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{addedStudentDetails.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-5xl opacity-50">{addedStudentDetails.secretIcon}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                                <p className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1">Enrolled Class</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2" title={addedStudentDetails.className}>{addedStudentDetails.className}</p>
                                            </div>
                                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                                <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">Class Code</p>
                                                <p className="font-black text-slate-800 dark:text-slate-200 tracking-widest">{addedStudentDetails.classCode}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {modalType === 'success' ? (
                                    <button
                                        onClick={() => navigate('/teacher-dashboard')}
                                        className="w-full mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Return to Dashboard
                                        <span className="material-icons-round text-sm">arrow_forward</span>
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 font-medium">
                                            If this is a "new row violates row-level security" error, please make sure you ran the SQL policy script in your Supabase dashboard.
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/25 transition-transform active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            Dismiss
                                            <span className="material-icons-round text-sm">refresh</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/teacher-dashboard')}
                                            className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold py-3 transition-colors text-sm uppercase tracking-widest mt-2"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddStudentPage;
