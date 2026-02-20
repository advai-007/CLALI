import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { School, ArrowLeft } from 'lucide-react';

// Mock Data
const MOCK_CLASS = {
    code: 'LION',
    name: "Ms. Frizzle's Class",
    students: [
        { id: 's1', name: 'Alex', avatar: '🐱', secret: '🍕' },
        { id: 's2', name: 'Sam', avatar: '🐶', secret: '🚀' },
        { id: 's3', name: 'Jordan', avatar: '🦊', secret: '⭐' },
        { id: 's4', name: 'Taylor', avatar: '🐼', secret: '🎈' },
        { id: 's5', name: 'Casey', avatar: '🐨', secret: '🎨' },
        { id: 's6', name: 'Riley', avatar: '🐯', secret: '🎵' },
    ]
};

const PASSWORD_ICONS = ['🍕', '🚀', '⭐', '🎈', '🎨', '🎵', '⚽', '📚', '🍎'];

const StudentLoginPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'code' | 'student' | 'secret'>('code');
    const [classCode, setClassCode] = useState('');
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<typeof MOCK_CLASS.students[0] | null>(null);

    // Check for saved class code on mount
    useEffect(() => {
        const savedCode = localStorage.getItem('classCode');
        if (savedCode === MOCK_CLASS.code) {
            setStep('student');
        }
    }, []);

    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (classCode.toUpperCase() === MOCK_CLASS.code) {
            localStorage.setItem('classCode', MOCK_CLASS.code);
            setStep('student');
            setError('');
        } else {
            setError('Oops! Try "LION"');
        }
    };

    const handleSwitchClass = () => {
        localStorage.removeItem('classCode');
        setStep('code');
        setClassCode('');
        setError('');
    };

    const handleStudentSelect = (student: typeof MOCK_CLASS.students[0]) => {
        setSelectedStudent(student);
        setStep('secret');
    };

    const handleSecretAttempt = (icon: string) => {
        if (selectedStudent && icon === selectedStudent.secret) {
            navigate('/dashboard');
        } else {
            setError('Try again!');
            setTimeout(() => setError(''), 1000);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[#111a21] flex flex-col font-display transition-colors duration-300">
            {/* Header */}
            <header className="p-6 flex items-center justify-between">
                <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="size-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                        <School size={24} />
                    </div>
                    <span className="font-bold text-xl text-slate-800 dark:text-slate-100">CLALI</span>
                </div>
                {step !== 'code' && (
                    <button
                        onClick={() => {
                            if (step === 'secret') setStep('student');
                            else setStep('code');
                            setError('');
                        }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                )}
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {/* STEP 1: CLASS CODE */}
                    {step === 'code' && (
                        <motion.div
                            key="code"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border-4 border-[var(--color-primary)] text-center"
                        >
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Class Code</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Ask your teacher for the magic word!</p>

                            <form onSubmit={handleCodeSubmit} className="space-y-6">
                                <input
                                    type="text"
                                    value={classCode}
                                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                                    placeholder="TYPE HERE"
                                    className="w-full text-center text-4xl font-black tracking-widest py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-[var(--color-primary)] outline-none uppercase placeholder:text-slate-300 dark:text-white transition-all"
                                    maxLength={6}
                                />
                                {error && <p className="text-red-500 font-bold animate-bounce">{error}</p>}
                                <button
                                    type="submit"
                                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
                                >
                                    Go to Class! 🚀
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* STEP 2: SELECT STUDENT */}
                    {step === 'student' && (
                        <motion.div
                            key="student"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-4xl text-center"
                        >
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-8">
                                Who are you?
                                <span className="block text-lg font-normal text-slate-500 dark:text-slate-400 mt-2">{MOCK_CLASS.name}</span>
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                {MOCK_CLASS.students.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleStudentSelect(student)}
                                        className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all border-b-8 border-slate-100 dark:border-slate-700 hover:border-[var(--color-primary)] group"
                                    >
                                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{student.avatar}</div>
                                        <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{student.name}</div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleSwitchClass}
                                className="mt-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline text-sm transition-colors"
                            >
                                Not your class? Switch Class
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 3: VISUAL PASSWORD */}
                    {step === 'secret' && selectedStudent && (
                        <motion.div
                            key="secret"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 text-center"
                        >
                            <div className="text-6xl mb-4">{selectedStudent.avatar}</div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Hello, {selectedStudent.name}!</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Tap your secret picture to login.</p>

                            <div className="grid grid-cols-3 gap-4">
                                {PASSWORD_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        onClick={() => handleSecretAttempt(icon)}
                                        className="aspect-square flex items-center justify-center text-4xl bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-[var(--color-mint)] dark:hover:bg-[var(--color-mint)] hover:scale-105 transition-all shadow-sm"
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                            {error && <p className="mt-6 text-red-500 font-bold">{error}</p>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default StudentLoginPage;
