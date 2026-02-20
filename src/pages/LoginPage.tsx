import { motion } from 'framer-motion';
import { Mail, Lock, Eye, ArrowRight, School, Globe, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState<'parent' | 'teacher'>('parent');
    const [showPassword, setShowPassword] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#111a21] flex flex-col font-display transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="w-full px-6 lg:px-20 py-6 flex justify-between items-center bg-transparent">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                    <div className="size-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                        <School size={24} />
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight">CLALI</h2>
                </div>
                <div className="flex items-center gap-4">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                        aria-label="Toggle Dark Mode"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button onMouseDown={() => navigate('/student-login')} className="hidden sm:block text-sm font-semibold text-[var(--color-primary)] hover:underline mr-2">
                        Student Login
                    </button>

                    <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">New here?</span>
                    <button className="bg-[var(--color-mint)]/40 hover:bg-[var(--color-mint)]/60 text-slate-800 px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200">
                        Create Account
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-6 relative">
                {/* Background Decoration */}
                <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/3 bg-[var(--color-primary)]/5 rounded-full blur-[100px]"></div>
                <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/4 bg-[var(--color-mint)]/10 rounded-full blur-[100px]"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[480px]"
                >
                    {/* Login Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                        {/* Decorative Top Bar */}
                        <div className="h-2 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-mint)] to-[var(--color-pastel-yellow)]"></div>

                        <div className="p-8 sm:p-12">
                            {/* Branding Area (No Mascot) */}
                            <div className="flex flex-col items-center text-center mb-10">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Welcome back</h1>
                                <p className="text-slate-500 dark:text-slate-400">Adaptive learning for every mind.</p>
                            </div>

                            {/* Role Toggle */}
                            <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full flex mb-8 transition-colors duration-300">
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="parent"
                                        className="sr-only peer"
                                        checked={role === 'parent'}
                                        onChange={() => setRole('parent')}
                                    />
                                    <div className="text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-200 text-slate-500 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-slate-900 dark:peer-checked:text-slate-100 peer-checked:shadow-sm">
                                        Parent
                                    </div>
                                </label>
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="teacher"
                                        className="sr-only peer"
                                        checked={role === 'teacher'}
                                        onChange={() => setRole('teacher')}
                                    />
                                    <div className="text-center py-2.5 rounded-full text-sm font-semibold transition-all duration-200 text-slate-500 peer-checked:bg-white dark:peer-checked:bg-slate-700 peer-checked:text-slate-900 dark:peer-checked:text-slate-100 peer-checked:shadow-sm">
                                        Teacher
                                    </div>
                                </label>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email or Username</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="e.g., alex@example.com"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                                        <a href="#" className="text-xs font-semibold text-[var(--color-primary)] hover:underline">Forgot?</a>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <Eye size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-1">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="size-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400">Keep me logged in</label>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[var(--color-primary)] hover:opacity-90 text-slate-900 font-bold py-4 rounded-full shadow-lg shadow-[var(--color-primary)]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <span>Login to Dashboard</span>
                                    <ArrowRight size={20} />
                                </button>
                            </form>

                            {/* Bottom Info */}
                            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    By logging in, you agree to our <br className="sm:hidden" />
                                    <a href="#" className="text-slate-800 dark:text-slate-200 font-medium hover:underline"> Terms of Service</a> &
                                    <a href="#" className="text-slate-800 dark:text-slate-200 font-medium hover:underline"> Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Accessibility/Language Footer (Support Center removed) */}
                    <div className="mt-8 flex justify-center gap-6 text-slate-400 text-sm">
                        <a href="#" className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors">
                            <Globe size={16} />
                            <span>English (US)</span>
                        </a>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default LoginPage;
