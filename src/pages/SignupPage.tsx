import { motion } from 'framer-motion';
import { Mail, Lock, Eye, ArrowRight, School, Globe, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const SignupPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Currently locking role to teacher as requested
    const role = 'teacher';

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            });

            if (signUpError) throw signUpError;

            // If signup is successful, we also want to ensure the user is in the public users table.
            // Some Supabase setups have a trigger for this, let's try to insert manually just in case
            // (If the trigger exists, this might fail with a unique constraint violation, which we can safely ignore)
            if (data.user) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([
                        { id: data.user.id, full_name: fullName, role: role }
                    ]);

                // If it fails because the row already exists (e.g. from a trigger), that's fine.
                if (insertError && insertError.code !== '23505') {
                    console.error("Error inserting into public users table:", insertError);
                }
            }

            // Redirect to the teacher dashboard
            navigate('/teacher-dashboard');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during signup.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#111a21] flex flex-col font-display transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="w-full px-6 lg:px-20 py-6 flex justify-between items-center bg-transparent">
                <Link to="/" className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                    <div className="size-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white">
                        <School size={24} />
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight">CLALI</h2>
                </Link>
                <div className="flex items-center gap-4">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                        aria-label="Toggle Dark Mode"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Already have an account?</span>
                    <Link to="/" className="bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200">
                        Login
                    </Link>
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
                    {/* Signup Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl shadow-[var(--color-primary)]/10 overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                        {/* Decorative Top Bar */}
                        <div className="h-2 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-mint)] to-[var(--color-pastel-yellow)]"></div>

                        <div className="p-8 sm:p-12">
                            {/* Branding Area */}
                            <div className="flex flex-col items-center text-center mb-10">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Create an account</h1>
                                <p className="text-slate-500 dark:text-slate-400">Join as a Teacher to start shaping minds.</p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                                    <div className="flex-1 text-sm font-medium">{error}</div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSignup} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="e.g., Alex Johnson"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="e.g., alex@school.edu"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            required
                                            minLength={6}
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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-full shadow-lg shadow-[var(--color-primary)]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                                    <ArrowRight size={20} />
                                </button>
                            </form>

                            {/* Bottom Info */}
                            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    By signing up, you agree to our <br className="sm:hidden" />
                                    <a href="#" className="text-slate-800 dark:text-slate-200 font-medium hover:underline"> Terms of Service</a> &
                                    <a href="#" className="text-slate-800 dark:text-slate-200 font-medium hover:underline"> Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Accessibility/Language Footer */}
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

export default SignupPage;
