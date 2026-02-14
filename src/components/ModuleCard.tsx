import { motion } from 'framer-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ModuleCardProps {
    title: string;
    icon: any;
    color: string;
    gradient: string;
    shadow: string;
    onClick?: () => void;
    index: number;
}

const ModuleCard = ({ title, icon: Icon, gradient, shadow, onClick, index }: ModuleCardProps) => {
    return (
        <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.1 + 0.2,
                type: "spring",
                stiffness: 100
            }}
            whileHover={{
                scale: 1.03,
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.98 }}
            className={`group relative flex flex-col items-center justify-center p-8 rounded-[32px] cursor-pointer w-full aspect-[4/5] bg-white border border-slate-100 shadow-xl ${shadow} hover:shadow-2xl transition-all duration-300 overflow-hidden`}
            onClick={onClick}
        >
            {/* Background Gradient Blob */}
            <div className={`absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />

            {/* Icon Container */}
            <div className={`relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-8 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={48} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </div>

            {/* Text */}
            <h3 className="relative z-10 text-2xl font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
                {title}
            </h3>

            {/* "Start" Pill Button on Hover */}
            <div className="mt-4 px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-semibold text-sm opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                Start →
            </div>

        </motion.button>
    );
};

export default ModuleCard;
