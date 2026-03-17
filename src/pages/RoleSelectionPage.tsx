import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { School, Rocket, ChevronRight, Sparkles } from 'lucide-react';
import { useState, type MouseEvent, type ReactNode } from 'react';

interface Role {
    id: 'student' | 'teacher';
    title: string;
    subtitle: string;
    icon: ReactNode;
    color: string;
    path: string;
    mascot: string;
}

const FloatingElements = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-indigo-500/10 dark:bg-indigo-400/5 blur-3xl"
                    style={{
                        width: Math.random() * 400 + 200,
                        height: Math.random() * 400 + 200,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -50, 50, 0],
                        scale: [1, 1.1, 0.9, 1],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

const RoleCard = ({ 
    role, 
    index, 
    onClick 
}: { 
    role: Role, 
    index: number, 
    onClick: () => void 
}) => {
    const [hovered, setHovered] = useState(false);
    
    // 3D Tilt Effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const xPct = (mouseX / width) - 0.5;
        const yPct = (mouseY / height) - 0.5;
        
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setHovered(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
                duration: 0.6, 
                delay: index * 0.15,
                ease: [0.23, 1, 0.32, 1]
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={`relative group flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 text-center border border-white/20 dark:border-white/5 transition-colors duration-500 h-[380px] shadow-2xl hover:shadow-${role.id === 'student' ? 'cyan' : 'indigo'}-500/20`}
        >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-[3rem]`}></div>

            {/* Icon/Mascot Area with floating animation */}
            <motion.div 
                style={{ z: 50 }}
                animate={{ y: hovered ? -10 : 0 }}
                className={`size-24 rounded-[2rem] bg-gradient-to-br ${role.color} flex items-center justify-center text-white shadow-2xl mb-6 group-hover:rotate-6 transition-all duration-500`}
            >
                {role.icon}
                {/* Floating particles around icon */}
                {hovered && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute size-2 bg-white rounded-full"
                        animate={{
                          scale: [0, 1, 0],
                          x: [0, (i % 2 === 0 ? 1 : -1) * 40],
                          y: [0, (i < 2 ? 1 : -1) * 40],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </motion.div>
                )}
            </motion.div>

            {/* Text Content */}
            <div style={{ transform: "translateZ(30px)" }} className="z-10">
                <div className="flex flex-col items-center gap-1 mb-1">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
                        {role.title}
                    </h3>
                    <motion.div
                        animate={hovered ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
                        className="text-yellow-400"
                    >
                        {role.id === 'student' ? <Sparkles size={28} /> : null}
                    </motion.div>
                </div>
                

                <div className={`inline-flex items-center justify-center size-14 rounded-full bg-gradient-to-r ${role.color} text-white font-black shadow-lg group-hover:scale-110 transition-all duration-300`}>
                    <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>

            {/* Large Character Label */}
            <div className="absolute -bottom-4 right-6 text-9xl font-black opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none italic uppercase">
                {role.id}
            </div>
            
        </motion.button>
    );
};

const RoleSelectionPage = () => {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'student' as const,
            title: "Student",
            subtitle: "",
            icon: <Rocket size={56} />,
            color: 'from-cyan-400 to-blue-500',
            path: '/student-login',
            mascot: '🚀'
        },
        {
            id: 'teacher' as const,
            title: "Teacher",
            subtitle: "",
            icon: <School size={56} />,
            color: 'from-indigo-500 to-purple-600',
            path: '/login',
            mascot: '🎓'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1117] flex flex-col items-center justify-center p-6 relative overflow-hidden font-display selection:bg-indigo-500 selection:text-white">
            <FloatingElements />

            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="text-center mb-12 z-10"
            >
                <div 
                    className="flex items-center justify-center gap-4 mb-6"
                >
                    <div className="size-16 bg-white rounded-[1.5rem] flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-600/30 border border-slate-100 dark:border-slate-800 p-2">
                        <img src="/logo.png" alt="CLALI Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        CLALI
                    </h1>
                </div>
                <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mb-4"></div>
                <h2 className="text-xl font-black italic text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    Select Your Pathway
                </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl z-10 perspective-1000">
                {roles.map((role, index) => (
                    <RoleCard 
                        key={role.id} 
                        role={role} 
                        index={index} 
                        onClick={() => navigate(role.path)} 
                    />
                ))}
            </div>

            {/* Bottom Accent */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 text-slate-300 dark:text-slate-700 font-black tracking-widest text-xs uppercase z-0"
            >
                
            </motion.div>
        </div>
    );
};

export default RoleSelectionPage;
