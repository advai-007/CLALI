import { motion } from 'framer-motion';

export function ProgressBar({ current, total }: { current: number, total: number }) {
    const progressPerc = Math.round((current / total) * 100);

    return (
        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 flex items-center gap-3 z-30">
            <span className="text-sm font-semibold text-green-700 hidden sm:block">
                Story Progress
            </span>
            <div className="w-32 sm:w-48 h-4 bg-green-100 rounded-full overflow-hidden shadow-inner border border-green-200">
                <motion.div
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPerc}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                />
            </div>
        </div>
    );
}
