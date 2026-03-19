import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { SECRET_ICONS, AVATAR_EMOJIS } from '../constants/emojiConstants';
import TeacherSidebar from '../components/TeacherSidebar';

const AddStudentPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form State
    const [studentName, setStudentName] = useState('');
    const [parentName, setParentName] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [classes, setClasses] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [addedStudentDetails, setAddedStudentDetails] = useState<any>(null);

    const avatars = AVATAR_EMOJIS;
    const secretIcons = SECRET_ICONS;

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
            let parentId = null;

            if (parentName.trim()) {
                const newParentId = uuidv4();
                const { data: parentData, error: parentError } = await supabase
                    .from('users')
                    .insert({
                        id: newParentId,
                        role: 'parent',
                        full_name: parentName.trim() || 'Unknown Parent',
                        teacher_id: user?.id
                    })
                    .select()
                    .single();

                if (parentError) throw parentError;
                if (parentData) parentId = parentData.id;
            }

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
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display transition-colors duration-300">
            <div className="flex h-screen overflow-hidden">
                <TeacherSidebar />

                <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 dark:bg-background-dark/50">
                    <header className="h-16 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 sticky top-0 z-10 shrink-0 shadow-sm transition-colors">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">CLALI</h2>
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Add Student</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold dark:text-white">{user?.user_metadata?.full_name || 'Teacher'}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{user?.user_metadata?.role || 'Educator'}</div>
                                </div>
                                <img alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" 
                                    src={user?.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'Teacher'}`} />
                            </div>
                        </div>
                    </header>

                    <div className="p-4 md:p-12 w-full flex flex-col items-center">
                        <div className="w-full max-w-4xl">
                            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                <button className="hover:text-[#3b82f6] transition-colors group flex items-center gap-1" onClick={() => navigate('/teacher-dashboard')}>
                                    <span className="material-icons-round text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                    Dashboard
                                </button>
                                <span className="material-icons-round text-xs">chevron_right</span>
                                <span className="text-slate-900 dark:text-white font-medium truncate">New Student Enrollment</span>
                            </nav>

                            <div className="bg-white dark:bg-card-dark rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden mb-12 hover:shadow-2xl transition-all duration-500">
                                <div className="p-6 md:p-10 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-slate-800/30 dark:to-slate-800/10">
                                    <h3 className="text-2xl font-bold dark:text-white">Profile Creation</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm md:text-base">Register a student and configure their personalized access.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-10 md:space-y-12">
                                    {/* Student Name */}
                                    <section className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Student Full Name</label>
                                        <input
                                            type="text"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            className={`w-full px-5 py-4 bg-white dark:bg-slate-800 border ${errorMsg && !studentName.trim() ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 dark:border-slate-700 focus:border-[#3b82f6] hover:border-[#3b82f6]/50'} rounded-2xl focus:ring-4 focus:ring-[#3b82f6]/10 outline-none transition-all placeholder:text-slate-400 text-lg shadow-sm`}
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
                                    <section className="space-y-6">
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Guardian Details</h4>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 uppercase">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={parentName}
                                                    onChange={(e) => setParentName(e.target.value)}
                                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] hover:border-[#3b82f6]/50 outline-none transition-all shadow-sm"
                                                    placeholder="Enter name"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Select Class */}
                                    <section className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Assign to Environment</label>
                                        <div className="relative">
                                            <select
                                                value={selectedClass}
                                                onChange={(e) => setSelectedClass(e.target.value)}
                                                className="w-full appearance-none px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] hover:border-[#3b82f6]/50 outline-none transition-all pr-12 text-lg shadow-sm cursor-pointer dark:text-white"
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
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-bold dark:text-white">Student Avatar</h4>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Profile Visual</span>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                            {avatars.map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => setSelectedAvatar(icon)}
                                                    className={`aspect-square flex items-center justify-center text-3xl md:text-4xl rounded-2xl border-2 transition-all duration-300 ${selectedAvatar === icon
                                                        ? 'border-[#3b82f6] bg-blue-50 dark:bg-[#3b82f6]/20 shadow-lg -translate-y-1'
                                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-[#3b82f6]/30 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                        }`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Secret Access Icon */}
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-bold dark:text-white">Secret Access Icon</h4>
                                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Visual Password</span>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                            {secretIcons.map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    onClick={() => setSelectedIcon(icon)}
                                                    className={`aspect-square flex items-center justify-center text-3xl md:text-4xl rounded-2xl border-2 transition-all duration-300 ${selectedIcon === icon
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 shadow-lg -translate-y-1'
                                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                        }`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    <div className="flex flex-col gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-[#3b82f6] hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 active:scale-[0.99] active:translate-y-0 flex items-center justify-center gap-2 text-lg"
                                        >
                                            <span className="material-icons-round">{isSubmitting ? 'hourglass_top' : 'person_add'}</span>
                                            {isSubmitting ? 'Processing Enrollment...' : 'Complete Enrollment'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/teacher-dashboard')}
                                            className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold py-3 transition-colors text-xs uppercase tracking-[0.2em]"
                                        >
                                            Discard Enrollment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
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
                            className="relative w-full max-w-md bg-white dark:bg-card-dark rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className={`p-10 text-center ${modalType === 'success' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-slate-900' : 'bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-slate-900'}`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-xl ${modalType === 'success' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>
                                    <span className="material-icons-round text-5xl">{modalType === 'success' ? 'check_circle' : 'error'}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                                    {modalType === 'success' ? 'Enrollment Successful!' : 'Enrollment Failed'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400">
                                    {modalType === 'success'
                                        ? 'Student has been successfully registered.'
                                        : errorMsg || 'An error occurred during registration.'}
                                </p>
                            </div>

                            <div className="p-10 space-y-6">
                                {modalType === 'success' && addedStudentDetails && (
                                    <>
                                        <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-4">
                                                <div className="text-4xl">{addedStudentDetails.avatar}</div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student</p>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{addedStudentDetails.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-5xl opacity-80">{addedStudentDetails.secretIcon}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                                <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase mb-1">Class</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={addedStudentDetails.className}>{addedStudentDetails.className}</p>
                                            </div>
                                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                                                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase mb-1">Access Code</p>
                                                <p className="font-black text-slate-800 dark:text-slate-200 tracking-widest">{addedStudentDetails.classCode}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={() => navigate('/teacher-dashboard')}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] ${modalType === 'success' ? 'bg-[#3b82f6] hover:bg-blue-600 shadow-blue-500/25' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'}`}
                                >
                                    {modalType === 'success' ? 'Return to Dashboard' : 'Retry Enrollment'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddStudentPage;
