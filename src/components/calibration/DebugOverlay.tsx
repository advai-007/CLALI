import type { FaceMetrics } from '../../utils/tracking/FaceFeatureExtractor';

interface DebugOverlayProps {
    metrics: FaceMetrics | null;
    isTracking: boolean;
}

export function DebugOverlay({ metrics, isTracking }: DebugOverlayProps) {
    return (
        <div className="fixed top-4 right-4 z-50 bg-stone-900/85 backdrop-blur-md text-white rounded-2xl px-5 py-4 shadow-xl font-mono text-xs min-w-[220px] border border-stone-700/50">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-700/50">
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="font-sans font-semibold text-sm tracking-tight">
                    {isTracking ? 'Tracking Active' : 'Not Tracking'}
                </span>
            </div>

            {metrics ? (
                <div className="space-y-1.5">
                    <MetricRow label="EAR" value={metrics.ear.toFixed(3)} color="text-cyan-400" />
                    <MetricRow label="Yaw" value={`${(metrics.headYaw * 100).toFixed(1)}°`} color="text-amber-400" />
                    <MetricRow label="Pitch" value={`${(metrics.headPitch * 100).toFixed(1)}°`} color="text-violet-400" />
                    <MetricRow label="Roll" value={`${(metrics.headRoll * (180 / Math.PI)).toFixed(1)}°`} color="text-emerald-400" />
                </div>
            ) : (
                <p className="text-stone-400 text-center py-2">No face detected</p>
            )}
        </div>
    );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-stone-400">{label}</span>
            <span className={`${color} font-bold tabular-nums`}>{value}</span>
        </div>
    );
}
