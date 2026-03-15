import React from 'react';

interface ConveyorBeltProps {
    items?: { id: string; label: string; color?: string }[];
    onPointerDown?: (id: string, e: React.PointerEvent) => void;
    activeDragId?: string | null;
    placedIds?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ConveyorBelt(_props: ConveyorBeltProps) {
    return (
        <div className="relative w-full max-w-4xl mx-auto h-32 md:h-40 rounded-2xl overflow-hidden mt-8 border-4 border-gray-400 z-10" style={{ backgroundColor: '#2d3748', boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)' }}>

            {/* Belt tracks visual */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.8) 40px, rgba(0,0,0,0.8) 50px)'
            }} />

            {/* Darker edge gradients to simulate cylinder curve */}
            <div className="absolute top-0 w-full h-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* The individual level files render their own draggable models on top of this belt visual. */}
            <div className="h-full w-full pointer-events-none" />

            {/* Metal casing overlay */}
            <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-gray-400 to-transparent pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-gray-400 to-transparent pointer-events-none" />
        </div>
    );
}
