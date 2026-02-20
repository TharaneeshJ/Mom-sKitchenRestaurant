import React, { useState, useRef, useEffect } from 'react';

// Use specific strings as we merged TableId enum into basic types or keep it if needed.
// Actually let's just define the tables here for now or use the enum.
export const TableId = {
    T1: 'T1',
    T2: 'T2',
    T3: 'T3',
    T4: 'T4',
    T5: 'T5',
    T6: 'T6',
    T7: 'T7',
    T8: 'T8',
    T9: 'T9',
    T10: 'T10',
} as const;

export type TableId = typeof TableId[keyof typeof TableId];

interface TableSelectorProps {
    selectedTable: string;
    onSelect: (table: string) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({ selectedTable, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (table: string) => {
        onSelect(table);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full md:w-48" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white border border-gray-200 text-gray-700 font-medium py-2.5 pl-4 pr-3 rounded-xl shadow-sm transition-all duration-200 hover:border-black/30 focus:outline-none focus:ring-1 focus:ring-black ${isOpen ? 'ring-1 ring-black border-black' : ''}`}
            >
                <span className="flex items-center gap-2">
                    {/* Status Indicator Dot */}
                    <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${selectedTable ? 'bg-brand-primary shadow-[0_0_8px_rgba(22,101,52,0.6)]' : 'bg-gray-300'}`}></span>
                    {selectedTable || 'Select Table'}
                </span>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-64 flex flex-col">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-50">
                        Dining Tables
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-1">
                        {Object.values(TableId).map((table) => (
                            <button
                                key={table}
                                onClick={() => handleSelect(table)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group mb-0.5 last:mb-0 ${selectedTable === table
                                    ? 'bg-green-50 text-brand-accent'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:pl-4'
                                    }`}
                            >
                                <span>{table}</span>
                                {selectedTable === table && (
                                    <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
