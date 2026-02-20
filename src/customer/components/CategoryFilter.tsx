import React, { useRef, useState, useEffect } from 'react';

interface CategoryFilterProps {
    categories: string[];
    activeCategory: string;
    onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    categories,
    activeCategory,
    onSelectCategory,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeft(scrollLeft > 0);
            setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [categories]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="relative mb-8 group">
            {/* Left Gradient & Button */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-brand-background via-brand-background/95 to-transparent z-10 flex items-center transition-all duration-500 ${showLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <button
                    onClick={() => scroll('left')}
                    className="bg-white rounded-2xl p-3 shadow-xl border border-brand-border/40 text-brand-primary hover:bg-brand-primary hover:text-white active:scale-90 transition-all ml-1"
                    aria-label="Scroll Left"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Area */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto no-scrollbar py-3 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth items-center"
            >
                <button
                    onClick={() => onSelectCategory('All')}
                    className={`shrink-0 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border shadow-sm active:scale-95 ${activeCategory === 'All'
                        ? 'bg-black text-white border-black shadow-xl shadow-black/10 scale-105'
                        : 'bg-white text-brand-muted border-brand-border/60 hover:border-black hover:text-black'
                        }`}
                >
                    All Items
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onSelectCategory(cat)}
                        className={`shrink-0 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border shadow-sm active:scale-95 ${activeCategory === cat
                            ? 'bg-black text-white border-black shadow-xl shadow-black/10 scale-105'
                            : 'bg-white text-brand-muted border-brand-border/60 hover:border-black hover:text-black'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
                {/* Spacer for Right Button Visibility overlap */}
                <div className="w-12 shrink-0 md:hidden"></div>
            </div>

            {/* Right Gradient & Button */}
            <div
                className={`absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-brand-background via-brand-background/95 to-transparent z-10 flex items-center justify-end transition-all duration-500 ${showRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <button
                    onClick={() => scroll('right')}
                    className="bg-white rounded-2xl p-3 shadow-xl border border-brand-border/40 text-brand-primary hover:bg-brand-primary hover:text-white active:scale-90 transition-all mr-1"
                    aria-label="Scroll Right"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
