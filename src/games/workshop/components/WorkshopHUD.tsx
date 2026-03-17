import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkshop } from '../WorkshopContext';

interface WorkshopHUDProps {
    title: string;
    icon?: string;
    maxStars?: number;
    currentStars?: number;
}

export default function WorkshopHUD({
    title,
    icon = 'settings',
    maxStars,
    currentStars,
}: WorkshopHUDProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalStars, completedStations, adaptiveState } = useWorkshop();

    const isGarageHub = location.pathname === '/workshop';

    const displayStars = currentStars !== undefined && maxStars !== undefined
        ? `${currentStars}/${maxStars}`
        : `${totalStars}`;

    const adaptiveLabel = adaptiveState
        .toLowerCase()
        .replace(/_/g, ' ');

    return (
        <header className="fixed top-0 left-0 w-full z-50 px-4 pt-4 pointer-events-none">
            <div className="max-w-5xl mx-auto flex justify-between items-start">
                {/* Back Button */}
                <button
                    onClick={() => navigate(isGarageHub ? '/dashboard' : '/workshop')}
                    className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-white rounded-full plastic-up active:translate-y-1 active:shadow-none transition-all border-4 border-white hover:border-[var(--ws-blue)]/20 ws-touch-target"
                >
                    <span className="material-symbols-outlined text-[var(--ws-dark)] text-3xl font-bold">
                        arrow_back
                    </span>
                </button>

                {/* Title Pill */}
                <div className="pointer-events-auto bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl plastic-card border-b-4 border-black/5 flex items-center gap-3">
                    <span
                        className="material-symbols-outlined text-3xl font-bold"
                        style={{ color: 'var(--ws-yellow)' }}
                    >
                        {icon}
                    </span>
                    <h1 className="workshop-heading text-[var(--ws-dark)] text-xl sm:text-2xl font-bold tracking-tight uppercase">
                        {title}
                    </h1>
                </div>

                {/* Star Counter */}
                <div className="pointer-events-auto flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-full plastic-up border-4 border-white h-14">
                        <span
                            className="material-symbols-outlined text-3xl drop-shadow-sm"
                            style={{ color: 'var(--ws-yellow)', fontVariationSettings: "'FILL' 1" }}
                        >
                            star
                        </span>
                        <span className="workshop-math text-[var(--ws-dark)] text-2xl">
                            {displayStars}
                        </span>
                        <div className="h-6 w-px bg-slate-200 mx-1" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {completedStations}/4 fixed
                        </span>
                    </div>

                    {!isGarageHub && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/70 text-xs uppercase tracking-[0.2em] text-slate-500">
                            Assist: {adaptiveLabel}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
