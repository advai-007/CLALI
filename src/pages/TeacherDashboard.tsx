import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 font-display">
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
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold dark:text-white">Good Morning, Ms. Sarah</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Check your students' latest cognitive load levels and learning activity.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center">
                                <span className="material-icons-round absolute left-3 text-slate-400">search</span>
                                <input className="pl-10 pr-12 py-2.5 w-64 rounded-full bg-card-light dark:bg-card-dark border-none shadow-sm focus:ring-2 focus:ring-[#3b82f6] text-sm" placeholder="Search for student / module..." type="text" />
                                <span className="absolute right-3 text-[10px] font-bold text-slate-400 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded flex items-center gap-1">
                                    <span className="material-icons-round text-xs">keyboard_command_key</span>K
                                </span>
                            </div>
                            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-card-light dark:bg-card-dark shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-300" onClick={() => setIsDark(!isDark)}>
                                <span className="material-icons-round hover:rotate-12 transition-transform duration-300">dark_mode</span>
                            </button>
                            <button className="flex items-center gap-2 bg-card-light dark:bg-card-dark shadow-sm px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-300">
                                <span className="material-icons-round text-lg">share</span>
                                Share
                            </button>
                        </div>
                    </header>
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 xl:col-span-7 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg">Active Class Modules</h2>
                                    <span className="material-icons-round text-slate-300 text-lg">info</span>
                                </div>
                                <span className="material-icons-round text-slate-400">north_east</span>
                            </div>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-50 dark:border-slate-800">
                                        <tr>
                                            <th className="pb-3 font-semibold">Module</th>
                                            <th className="pb-3 font-semibold text-center">Students</th>
                                            <th className="pb-3 font-semibold">Progress</th>
                                            <th className="pb-3 font-semibold text-right">Avg. Load</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4">
                                                <div className="font-semibold">Maths</div>
                                                <div className="text-xs text-slate-400">Mathematics Group B</div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex -space-x-2 justify-center shrink-0">
                                                    <img alt="Student" className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2fqYQMXH5_ZpA3hIomWNz6MQEp5Fil-EfunjYJwU5rPDvm0oemQGmLOuzc4zBuktaAZf5q_sqfetplELHy9JAaen7rI_sjaSDL3SMOpTDlFwiOzcrjQlXPsG_hD0MI0IgfMn4E8aQtlXsBQI1b3lwcHgnumN-WDJ5vGJNkNWPqkER79Y8Uib7NNyEY2EGF5kvGa4IiKy0F-l_cxNN2vHGSjFsUcquVQGk_V73GNboKPjypwOkgthCElf_4WcxXZydbMlXoWkd5FI" />
                                                    <img alt="Student" className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr3CLu4dcGriQxQMd2Onmv9HDJm8FcRUj0XC1LiLt93qo4iRonSztRDsKpgGjT_ntAosJZUlKKAbaE9DD1mykbSYU6Z-gCwXYxmQh7yVmT454DraDBo7EVMDUSC2Be2qNr2V6De1MkiAww3Yf9-3hhaN7vIU4yWlB8Flok8-y7QiXJivJhVNRV9M1PtswM9yiAnHGYjSFTOqPQiX0I8TUfpOFy-F_EO-9hZqJ0XmjoOhrs5s85waxz5HyXfUZS98NCvF-B9b4nAUU" />
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-card-dark flex items-center justify-center text-[10px] font-bold">+24</div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-emerald-400"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-emerald-400"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-emerald-400"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-emerald-400"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                                                    </div>
                                                    <span className="font-bold">92%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 shrink-0">
                                                    <span className="material-icons-round text-amber-500 text-sm">bolt</span>
                                                    <span className="font-bold">3.2</span>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-4">
                                                <div className="font-semibold">Reading</div>
                                                <div className="text-xs text-slate-400">Critical Thinking</div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex -space-x-2 justify-center shrink-0">
                                                    <img alt="Student" className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtQ-lRBHGvbJ0kpNw_JYOQfULfKdUIRb3LdI5_IVl5DC-m3ep9pOJLHUnelTIjmVSvzt9L33WZcv5JgAd9fWbicXpyNTbvqx-gf9-fDaRa55_mcjj-0L_7t0w29L-NczGxaRti-hf62air-FcFGkvNR9E-a8JXeStf-Bh5dvF2pxkfCx1M4tLLKFkqbUf9Z24mmqXMUTXq3EKMp14M_64IcpsuNUi1O_MCBF-FNNyRgq__vnoLm3PyItCskeIV9v_iy0IJ2l7iWkE" />
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-card-dark flex items-center justify-center text-[10px] font-bold">+8</div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-blue-400"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                                                        <div className="h-2 w-1 mr-0.5 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                                                    </div>
                                                    <span className="font-bold">24%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 shrink-0">
                                                    <span className="material-icons-round text-red-500 text-sm">bolt</span>
                                                    <span className="font-bold">4.8</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="col-span-12 xl:col-span-5 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg">Cognitive Load Overview</h2>
                                    <span className="material-icons-round text-slate-300 text-lg">info</span>
                                </div>
                                <span className="material-icons-round text-slate-400">north_east</span>
                            </div>
                            <div className="flex gap-8 items-center flex-wrap sm:flex-nowrap">
                                <div className="relative w-40 h-40 shrink-0">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="stroke-current text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                                        <path className="stroke-current text-[#3b82f6]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="3"></path>
                                        <path className="stroke-current text-emerald-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="40, 100" strokeDashoffset="-35" strokeLinecap="round" strokeWidth="3"></path>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">142</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Students</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4 min-w-[200px]">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                                            <span className="text-slate-500">Optimal Load</span>
                                            <span className="font-bold ml-auto">84</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                            <span className="text-slate-500">Low Load</span>
                                            <span className="font-bold ml-auto">42</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                            <span className="text-slate-500">Struggling</span>
                                            <span className="font-bold ml-auto">12</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            <span className="text-slate-500">Critical</span>
                                            <span className="font-bold ml-auto">4</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-3">
                                            <span className="material-icons-round text-sm">bolt</span> Intervention Queue
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-1.5 shrink-0">
                                                <img alt="Student" className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBstQM_9d2Acc4tvqxQ2fObP-u6eNwKsEG9AV4qBxZdQ6CTlQFcKAc0XjgiNTjjQevsO628dI-67wq4h2OcizLMLQ0FmlQR9DXciwn_bPSPqbOogM0TTgTt7JRSsToUdbE1_GFlFd_f6LaSjJyYqeXSqSlO6sRtF7Q1Ell-sMy8lypgLeZEVacfq7KXCc17UOBJE3d99xYfAsre8rcPgtnFf1VRIN4BwocceBzHFMzgvfvWJfYZ2UQQ3pnbp-Jm9aN1FCA43XUIZZc" />
                                                <img alt="Student" className="w-7 h-7 rounded-full border-2 border-white dark:border-card-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuGMY8K1rgx0nG1QWLrP72h4kMiajrQKZbvi3t22lI3hHRlPNicj6qFwPpFfuKuyVLVAa5JBpcTOBMMoT0aLhoehokyAjzh-6sJtoc8cct6mOIpLO6whvzm9htmc2shx_679s5qUcnZMn1vxGpKl0d6zTu88TXbtzR3dS3sYxdAWfTopl5YTZsyNxS5sb2n6kVx8p2Gz3RLvMz99ifQOKphrpjpYTDxw0O_vMKm7FsMqsLvsDpZvJPBtYnhTb5Z_G1gtNB7ut1uC8" />
                                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-card-dark flex items-center justify-center text-[10px] font-bold text-red-500">+3</div>
                                            </div>
                                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded whitespace-nowrap">High Priority</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-3 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg">Engagement</h2>
                                    <span className="material-icons-round text-slate-300 text-lg">info</span>
                                </div>
                                <span className="material-icons-round text-slate-400">north_east</span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Video Content</span>
                                        <span className="font-bold text-[#3b82f6]">4.9</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '95%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Interactive Quizzes</span>
                                        <span className="font-bold text-[#3b82f6]">4.2</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '80%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Reading Materials</span>
                                        <span className="font-bold text-[#3b82f6]">3.1</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Group Discussion</span>
                                        <span className="font-bold text-[#3b82f6]">1.8</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '35%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-6 text-[11px] text-slate-500 leading-relaxed italic">
                                Video content shows the highest engagement, while text-heavy materials may require more scaffolds.
                            </p>
                        </div>
                        <div className="col-span-12 lg:col-span-5 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg">Recommended Interventions</h2>
                                    <span className="material-icons-round text-slate-300 text-lg">info</span>
                                </div>
                                <span className="material-icons-round text-slate-400">north_east</span>
                            </div>
                            <div className="relative py-10">
                                <div className="flex items-center justify-between px-4">
                                    <div className="space-y-6">
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400 block">LOW LOAD</span>
                                            <span className="text-lg font-bold">32%</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400 block">OVERLOAD</span>
                                            <span className="text-lg font-bold">68%</span>
                                        </div>
                                    </div>
                                    <div className="absolute left-1/4 right-1/4 h-24 top-1/2 -translate-y-1/2 opacity-20 dark:opacity-30">
                                        <svg className="w-full h-full" viewBox="0 0 200 100">
                                            <path d="M0,20 C50,20 150,80 200,80" fill="none" stroke="#f59e0b" strokeWidth="20"></path>
                                            <path d="M0,80 C50,80 150,20 200,20" fill="none" stroke="#3b82f6" strokeWidth="20"></path>
                                        </svg>
                                    </div>
                                    <div className="space-y-4 min-w-[120px]">
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2 pr-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:scale-105 transition-transform cursor-pointer">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <span className="material-icons-round text-emerald-600 dark:text-emerald-400 text-sm">upgrade</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 block">CHALLENGE</span>
                                                <span className="text-sm font-bold">$3.2k</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2 pr-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:scale-105 transition-transform cursor-pointer">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <span className="material-icons-round text-amber-600 dark:text-amber-400 text-sm">psychology</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 block">SCAFFOLD</span>
                                                <span className="text-sm font-bold">$12.5k</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-center text-slate-500 mt-2 italic">Most students are experiencing high intrinsic load; consider simplifying visual assets.</p>
                        </div>
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                            <div className="flex-1 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-lg">Learning Time</h2>
                                        <span className="material-icons-round text-slate-300 text-lg">info</span>
                                    </div>
                                    <span className="material-icons-round text-slate-400">north_east</span>
                                </div>
                                <div className="flex items-end justify-center gap-2 h-20 mb-4">
                                    <div className="w-2 h-4 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                    <div className="w-2 h-8 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                    <div className="w-2 h-12 bg-amber-200 dark:bg-amber-500/30 rounded-full"></div>
                                    <div className="w-2 h-16 bg-amber-400 rounded-full"></div>
                                    <div className="w-2 h-20 bg-amber-400 rounded-full"></div>
                                    <div className="w-2 h-14 bg-amber-200 dark:bg-amber-500/30 rounded-full"></div>
                                    <div className="w-2 h-8 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                </div>
                                <div className="flex justify-center items-center gap-2 text-[11px] font-bold">
                                    <span className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-2 py-0.5 rounded">22h</span>
                                    <span className="text-slate-400">Team spent 18% more time vs last month.</span>
                                </div>
                            </div>
                            <div className="bg-[#3b82f6] p-6 rounded-xl shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 text-white cursor-pointer group">
                                <div className="flex items-center gap-2 mb-8 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <h2 className="font-bold text-sm uppercase tracking-wider">Module Completion Rate</h2>
                                    <span className="material-icons-round text-sm">info</span>
                                </div>
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <div className="text-4xl font-bold">76%</div>
                                        <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest mt-1">Complete</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold opacity-60">24%</div>
                                        <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest mt-1">In progress</div>
                                    </div>
                                </div>
                                <div className="relative w-full h-1 bg-white/20 rounded-full mb-6">
                                    <div className="absolute left-0 top-0 h-full bg-white rounded-full" style={{ width: '76%' }}></div>
                                    <div className="absolute w-3 h-3 bg-white border-2 border-primary rounded-full top-1/2 -translate-y-1/2" style={{ left: '76%' }}></div>
                                </div>
                                <p className="text-[11px] font-medium opacity-90">
                                    Completion rate is 12% higher than it was last month.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TeacherDashboard;
