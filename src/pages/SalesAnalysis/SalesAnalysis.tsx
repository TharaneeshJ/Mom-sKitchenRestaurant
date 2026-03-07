import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import type { Order, OrderItem } from '../../types';
import {
    TrendingUp,
    ShoppingBag,
    IndianRupee,
    BarChart2,
    Clock,
    Award,
    ArrowUpRight,
    ArrowDownRight,
    Utensils,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import './SalesAnalysis.css';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Period = 'day' | 'week' | 'month' | 'year' | 'custom';

const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* ─────────────────────────────────────────────
   Period helpers
───────────────────────────────────────────── */
function isInPeriod(timestamp: Date, period: Exclude<Period, 'custom'>): boolean {
    const now = new Date();
    const t = new Date(timestamp);
    switch (period) {
        case 'day': return t.toDateString() === now.toDateString();
        case 'week': {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 6);
            weekAgo.setHours(0, 0, 0, 0);
            return t >= weekAgo;
        }
        case 'month': {
            const monthAgo = new Date(now);
            monthAgo.setDate(now.getDate() - 29);
            monthAgo.setHours(0, 0, 0, 0);
            return t >= monthAgo;
        }
        case 'year': {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            yearAgo.setHours(0, 0, 0, 0);
            return t >= yearAgo;
        }
    }
}

function isInCustomDay(timestamp: Date, dateStr: string): boolean {
    const t = new Date(timestamp);
    return toYMD(t) === dateStr;
}

function isInPrevPeriod(timestamp: Date, period: Period, customDate?: string): boolean {
    const now = new Date();
    const t = new Date(timestamp);
    if (period === 'custom' && customDate) {
        // compare with 1 day before
        const prev = new Date(customDate);
        prev.setDate(prev.getDate() - 1);
        return toYMD(t) === toYMD(prev);
    }
    switch (period) {
        case 'day': {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            return t.toDateString() === yesterday.toDateString();
        }
        case 'week': {
            const start = new Date(now);
            start.setDate(now.getDate() - 13);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setDate(now.getDate() - 7);
            end.setHours(23, 59, 59, 999);
            return t >= start && t <= end;
        }
        case 'month': {
            const start = new Date(now);
            start.setDate(now.getDate() - 59);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setDate(now.getDate() - 30);
            end.setHours(23, 59, 59, 999);
            return t >= start && t <= end;
        }
        case 'year': {
            const start = new Date(now);
            start.setFullYear(now.getFullYear() - 2);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setFullYear(now.getFullYear() - 1);
            end.setHours(23, 59, 59, 999);
            return t >= start && t <= end;
        }
        default: return false;
    }
}

/* ─────────────────────────────────────────────
   Chart bucket builders
───────────────────────────────────────────── */
function buildChartData(
    orders: Order[],
    period: Period
): { label: string; revenue: number; orders: number }[] {
    const now = new Date();

    // Day buckets — 24 × 1h blocks
    if (period === 'day' || period === 'custom') {
        const buckets = Array.from({ length: 24 }, (_, i) => {
            const h = i % 12 || 12;
            const ampm = i < 12 ? 'AM' : 'PM';
            return {
                label: `${h} ${ampm}`,
                revenue: 0,
                orders: 0,
            };
        });
        orders.forEach(o => {
            const h = new Date(o.timestamp).getHours();
            buckets[h].revenue += o.totalAmount;
            buckets[h].orders += 1;
        });
        return buckets;
    }

    if (period === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const buckets = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (6 - i));
            return { label: days[d.getDay()], revenue: 0, orders: 0 };
        });
        const nowEndMs = new Date(now).setHours(23, 59, 59, 999);
        orders.forEach(o => {
            const orderDate = new Date(o.timestamp);
            const diffDays = Math.floor((nowEndMs - orderDate.getTime()) / 86400000);
            const idx = 6 - diffDays;
            if (idx >= 0 && idx < 7) {
                buckets[idx].revenue += o.totalAmount;
                buckets[idx].orders += 1;
            }
        });
        return buckets;
    }

    if (period === 'month') {
        const buckets = [
            { label: 'Wk 1', revenue: 0, orders: 0 },
            { label: 'Wk 2', revenue: 0, orders: 0 },
            { label: 'Wk 3', revenue: 0, orders: 0 },
            { label: 'Wk 4', revenue: 0, orders: 0 },
        ];
        const nowMs = Date.now();
        orders.forEach(o => {
            const diffDays = Math.floor((nowMs - new Date(o.timestamp).getTime()) / 86400000);
            const weekIdx = Math.min(Math.floor(diffDays / 7), 3);
            const idx = 3 - weekIdx;
            if (idx >= 0) {
                buckets[idx].revenue += o.totalAmount;
                buckets[idx].orders += 1;
            }
        });
        return buckets;
    }

    // Year — 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now);
        d.setMonth(now.getMonth() - (11 - i));
        return { label: months[d.getMonth()], revenue: 0, orders: 0 };
    });
    orders.forEach(o => {
        const t = new Date(o.timestamp);
        const monthDiff = (now.getFullYear() - t.getFullYear()) * 12 + (now.getMonth() - t.getMonth());
        const idx = 11 - monthDiff;
        if (idx >= 0 && idx < 12) {
            buckets[idx].revenue += o.totalAmount;
            buckets[idx].orders += 1;
        }
    });
    return buckets;
}

/* ─────────────────────────────────────────────
   Aggregation helpers
───────────────────────────────────────────── */
function buildDishStats(orders: Order[]) {
    const map: Record<string, { name: string; quantity: number; revenue: number; orderCount: number }> = {};
    orders.forEach(o => {
        o.items.forEach((item: OrderItem) => {
            if (!map[item.name]) map[item.name] = { name: item.name, quantity: 0, revenue: 0, orderCount: 0 };
            map[item.name].quantity += item.quantity;
            map[item.name].revenue += item.price * item.quantity;
            map[item.name].orderCount += 1;
        });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

function buildPaymentBreakdown(orders: Order[]) {
    const map: Record<string, number> = {};
    orders.forEach(o => {
        const method = o.paymentMethod || 'Cash';
        map[method] = (map[method] || 0) + o.totalAmount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
        .map(([method, amount]) => ({ method, amount, pct: total ? Math.round((amount / total) * 100) : 0 }))
        .sort((a, b) => b.amount - a.amount);
}

/* ─────────────────────────────────────────────
   Mini Calendar Component
───────────────────────────────────────────── */
const MiniCalendar: React.FC<{
    orders: Order[];
    selectedDate: string;
    onSelect: (ymd: string) => void;
    onClose: () => void;
}> = ({ orders, selectedDate, onSelect, onClose }) => {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    // Build set of dates that have orders (for dot indicators)
    const orderDates = useMemo(() => {
        const s = new Set<string>();
        orders.forEach(o => s.add(toYMD(new Date(o.timestamp))));
        return s;
    }, [orders]);

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="sa-cal-panel">
            <div className="sa-cal-header">
                <button className="sa-cal-nav" onClick={prevMonth}><ChevronLeft size={16} /></button>
                <span className="sa-cal-month-label">{monthNames[viewMonth]} {viewYear}</span>
                <button className="sa-cal-nav" onClick={nextMonth}><ChevronRight size={16} /></button>
                <button className="sa-cal-close" onClick={onClose}><X size={15} /></button>
            </div>
            <div className="sa-cal-weekdays">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d}>{d}</span>
                ))}
            </div>
            <div className="sa-cal-grid">
                {cells.map((day, idx) => {
                    if (!day) return <span key={idx} className="sa-cal-empty" />;
                    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = ymd === toYMD(today);
                    const isSelected = ymd === selectedDate;
                    const hasDot = orderDates.has(ymd);
                    const isFuture = new Date(ymd) > today;
                    return (
                        <button
                            key={idx}
                            disabled={isFuture}
                            className={[
                                'sa-cal-day',
                                isToday ? 'sa-cal-day--today' : '',
                                isSelected ? 'sa-cal-day--selected' : '',
                                isFuture ? 'sa-cal-day--future' : '',
                            ].join(' ')}
                            onClick={() => { if (!isFuture) onSelect(ymd); }}
                        >
                            {day}
                            {hasDot && !isSelected && <span className="sa-cal-dot" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Premium Bar + Line Chart  (refined)
───────────────────────────────────────────── */
const BarChartSVG: React.FC<{
    data: { label: string; revenue: number; orders: number }[];
    metric: 'revenue' | 'orders';
}> = ({ data, metric }) => {
    const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(800); // Default fallback

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setContainerW(entries[0].contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const values = data.map(d => (metric === 'revenue' ? d.revenue : d.orders));
    const maxVal = Math.max(...values, 1);

    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const niceMax = Math.ceil(maxVal / magnitude) * magnitude || 1;
    const GRID_N = 4;
    const gridLevels = Array.from({ length: GRID_N + 1 }, (_, i) => (niceMax / GRID_N) * i);

    const CHART_H = 320;
    const PLOT_TOP = 15;
    const PLOT_BTM = 35;
    const PLOT_H = CHART_H - PLOT_TOP - PLOT_BTM;
    const COL_W = data.length > 0 ? containerW / data.length : 60;
    const BAR_W = Math.min(24, Math.max(8, Math.floor(COL_W * 0.4)));
    const SVG_W = containerW;

    const orderMaxReal = Math.max(...data.map(d => d.orders), 1);
    const orderMag = Math.pow(10, Math.floor(Math.log10(orderMaxReal)));
    const niceOrderMax = Math.ceil(orderMaxReal / orderMag) * orderMag || 1;

    const linePts = data.map((d, i) => ({
        x: i * COL_W + COL_W / 2,
        y: PLOT_TOP + PLOT_H - (d.orders / (metric === 'orders' ? niceMax : niceOrderMax)) * PLOT_H,
    }));
    const pathD = linePts.length > 1
        ? linePts.reduce((acc, pt, i) => {
            if (i === 0) return `M ${pt.x},${pt.y}`;
            const prev = linePts[i - 1];
            const cx = (prev.x + pt.x) / 2;
            return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
        }, '')
        : '';
    const areaD = pathD
        ? `${pathD} L ${linePts[linePts.length - 1].x},${PLOT_TOP + PLOT_H} L ${linePts[0].x},${PLOT_TOP + PLOT_H} Z`
        : '';

    // Flat, premium colors (Stripe-like)
    const barGradient = metric === 'revenue'
        ? { start: '#10b981', end: '#10b981' }
        : { start: '#3b82f6', end: '#3b82f6' };

    // Blue accent for orders trend
    const trendColor = '#3b82f6'; // Blue 500

    // Helper for top-rounded bars
    const getBarPath = (x: number, y: number, w: number, h: number, r: number) => {
        if (h <= 0) return '';
        const clampedR = Math.min(r, h);
        return `M ${x},${y + h} L ${x},${y + clampedR} a ${clampedR},${clampedR} 0 0 1 ${clampedR},-${clampedR} L ${x + w - clampedR},${y} a ${clampedR},${clampedR} 0 0 1 ${clampedR},${clampedR} L ${x + w},${y + h} Z`;
    };

    const fmtY = (v: number) => {
        if (metric === 'orders') return v === 0 ? '0' : String(Math.round(v));
        if (v === 0) return '₹0';
        if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
        if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
        return `₹${Math.round(v)}`;
    };

    const fmtAmount = (v: number) =>
        `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    return (
        <div className="sa-chart-wrap">
            <div className="sa-y-axis">
                {[...gridLevels].reverse().map((v, i) => (
                    <span key={i}>{fmtY(v)}</span>
                ))}
            </div>

            <div className="sa-chart-body" ref={containerRef}>
                <svg
                    viewBox={`0 0 ${SVG_W} ${CHART_H}`}
                    preserveAspectRatio="none"
                    width="100%"
                    height="100%"
                    className="sa-chart-svg"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        {/* Bar Gradients */}
                        <linearGradient id="cBarNorm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={barGradient.start} stopOpacity="0.85" />
                            <stop offset="100%" stopColor={barGradient.end} stopOpacity="0.75" />
                        </linearGradient>
                        <linearGradient id="cBarHov" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={barGradient.start} stopOpacity="1" />
                            <stop offset="100%" stopColor={barGradient.end} stopOpacity="0.9" />
                        </linearGradient>

                        {/* Trend Area Gradient */}
                        <linearGradient id="cArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={trendColor} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={trendColor} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {gridLevels.map((v, i) => {
                        const y = PLOT_TOP + PLOT_H - (v / niceMax) * PLOT_H;
                        return (
                            <line key={i}
                                x1={0} y1={y} x2={SVG_W} y2={y}
                                stroke="currentColor" className="sa-grid-line"
                                strokeWidth={0.8}
                                strokeDasharray="4 4"
                                opacity={0.1}
                            />
                        );
                    })}

                    {areaD && <path d={areaD} fill="url(#cArea)" />}

                    {data.map((d, i) => {
                        const val = metric === 'revenue' ? d.revenue : d.orders;
                        const barH = niceMax > 0 ? (val / niceMax) * PLOT_H : 0;
                        const bx = i * COL_W + (COL_W - BAR_W) / 2;
                        const by = PLOT_TOP + PLOT_H - barH;
                        const isH = hoveredIdx === i;

                        return (
                            <g key={i}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                <rect
                                    x={i * COL_W} y={PLOT_TOP}
                                    width={COL_W} height={PLOT_H}
                                    fill={isH ? 'hsl(var(--muted)/0.4)' : 'transparent'}
                                    rx={8}
                                />
                                {barH > 1 && (
                                    <path
                                        d={getBarPath(bx, by, BAR_W, barH, 4)}
                                        fill={isH ? 'url(#cBarHov)' : 'url(#cBarNorm)'}
                                        className="sa-bar-animated"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {pathD && (
                        <path
                            d={pathD} fill="none"
                            stroke={trendColor} strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round"
                        />
                    )}

                    {linePts.map((pt, i) => (
                        <circle key={i}
                            cx={pt.x} cy={pt.y}
                            r={hoveredIdx === i ? 5 : 4}
                            fill={hoveredIdx === i ? trendColor : 'hsl(var(--card))'}
                            stroke={trendColor} strokeWidth={hoveredIdx === i ? '0' : '2'}
                            style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        />
                    ))}
                </svg>

                {/* X-axis labels (Moved out of SVG to avoid horizontal squeezing) */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    paddingRight: '0', // Offset if needed
                }}>
                    {data.map((d, i) => {
                        const isH = hoveredIdx === i;
                        const showLabel = (data.length !== 24 || i % 2 === 0);
                        return (
                            <div key={i} style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: '10px',
                                fontWeight: isH ? 800 : 600,
                                color: isH ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                opacity: showLabel ? 1 : 0,
                                transform: isH ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                {d.label}
                            </div>
                        );
                    })}
                </div>


                {hoveredIdx !== null && data[hoveredIdx] && (() => {
                    const pct = (hoveredIdx + 0.5) / data.length;
                    // Smart edge-aware positioning
                    const isLeft = pct < 0.25;
                    const isRight = pct > 0.75;
                    const leftPc = `${pct * 100}%`;
                    const transform = isLeft
                        ? 'translateX(0)'
                        : isRight
                            ? 'translateX(-100%)'
                            : 'translateX(-50%)';
                    const arrowLeft = isLeft ? '18px' : isRight ? 'calc(100% - 24px)' : '50%';
                    const d = data[hoveredIdx];
                    return (
                        <div
                            className="sa-chart-tooltip"
                            style={{ left: leftPc, transform }}
                        >
                            {/* Header */}
                            <div className="sa-tt-header">
                                <span className="sa-tt-time">{d.label}</span>
                                {d.orders > 0 && (
                                    <span className="sa-tt-orders-badge">{d.orders} order{d.orders !== 1 ? 's' : ''}</span>
                                )}
                            </div>

                            {/* Body rows */}
                            <div className="sa-tt-body">
                                <div className="sa-tt-row">
                                    <span className="sa-tt-swatch" style={{ background: '#10b981' }} />
                                    <span className="sa-tt-key">Revenue</span>
                                    <span className="sa-tt-val" style={{ color: '#10b981' }}>{fmtAmount(d.revenue)}</span>
                                </div>
                                <div className="sa-tt-row">
                                    <span className="sa-tt-swatch" style={{ background: '#3b82f6' }} />
                                    <span className="sa-tt-key">Orders</span>
                                    <span className="sa-tt-val" style={{ color: '#3b82f6' }}>{d.orders}</span>
                                </div>
                            </div>

                            {/* Dynamic arrow */}
                            <div className="sa-tt-arrow" style={{ left: arrowLeft }} />
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Sparkline
───────────────────────────────────────────── */
const Sparkline: React.FC<{ values: number[]; color?: string }> = ({ values, color = '#1c1917' }) => {
    if (values.length < 2) return null;
    const maxV = Math.max(...values, 1);
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * 80;
        const y = 20 - (v / maxV) * 18;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 80 22" width="80" height="22" className="sa-sparkline">
            <polyline points={pts} fill="none" stroke={color}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

/* ─────────────────────────────────────────────
   KPI Card
───────────────────────────────────────────── */
const KPICard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    change: { pct: number; up: boolean; zero: boolean };
    compareLabel: string;
    sparkline: number[];
    color: string;
}> = ({ icon, label, value, change, compareLabel, sparkline, color }) => (
    <div className="sa-kpi-card">
        <div className="sa-kpi-top">
            <div className="sa-kpi-icon" style={{ backgroundColor: `${color}18`, color }}>
                {icon}
            </div>
            <Sparkline values={sparkline} color={color} />
        </div>
        <div className="sa-kpi-value">{value}</div>
        <div className="sa-kpi-label">{label}</div>
        <div className="sa-kpi-change">
            {change.zero
                ? <span className="sa-change-neutral">— Same as {compareLabel.replace('vs ', '')}</span>
                : change.up
                    ? <span className="sa-change-up"><ArrowUpRight size={13} /> +{change.pct}% {compareLabel}</span>
                    : <span className="sa-change-down"><ArrowDownRight size={13} /> -{change.pct}% {compareLabel}</span>
            }
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const PERIOD_LABELS: Record<Period, string> = {
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    custom: 'Custom Day',
};
const PERIOD_COMPARE_LABELS: Record<Period, string> = {
    day: 'vs yesterday',
    week: 'vs last week',
    month: 'vs last month',
    year: 'vs last year',
    custom: 'vs prev day',
};
const DISH_PALETTE = [
    '#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#ec4899', '#06b6d4', '#84cc16', '#ef4444', '#a78bfa',
];

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export const SalesAnalysis: React.FC = () => {
    const { orders } = useRestaurant();
    const [period, setPeriod] = useState<Period>('day');
    const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
    const [customDate, setCustomDate] = useState<string>(toYMD(new Date()));
    const [calOpen, setCalOpen] = useState(false);
    const calRef = useRef<HTMLDivElement>(null);

    // Close calendar on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (calRef.current && !calRef.current.contains(e.target as Node)) {
                setCalOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Paid orders pool — primary check: paymentStatus (Supabase payment_status field, comes as 'PAID')
    // Fallback: legacy rows where status itself was set to 'paid'
    const paidOrders = useMemo(
        () => orders.filter(o =>
            (o.paymentStatus || '').toUpperCase() === 'PAID' ||
            (o.status || '').toLowerCase() === 'paid'),
        [orders]
    );

    // Filter by selected period
    const currentOrders = useMemo(() => {
        if (period === 'custom') {
            return paidOrders.filter(o => isInCustomDay(o.timestamp, customDate));
        }
        return paidOrders.filter(o => isInPeriod(o.timestamp, period));
    }, [paidOrders, period, customDate]);

    const prevOrders = useMemo(() =>
        paidOrders.filter(o => isInPrevPeriod(o.timestamp, period, customDate)),
        [paidOrders, period, customDate]
    );

    // KPI aggregates
    const totalRevenue = useMemo(() => currentOrders.reduce((s, o) => s + o.totalAmount, 0), [currentOrders]);
    const prevRevenue = useMemo(() => prevOrders.reduce((s, o) => s + o.totalAmount, 0), [prevOrders]);
    const totalOrders = currentOrders.length;
    const prevTotalOrders = prevOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const prevAvgOrderValue = prevTotalOrders > 0 ? prevRevenue / prevTotalOrders : 0;

    const uniqueCustomers = useMemo(() => {
        const names = new Set(currentOrders.map(o => o.customerName || 'Guest'));
        return names.size;
    }, [currentOrders]);
    const prevUniqueCustomers = useMemo(() => {
        const names = new Set(prevOrders.map(o => o.customerName || 'Guest'));
        return names.size;
    }, [prevOrders]);

    const chartData = useMemo(() => buildChartData(currentOrders, period), [currentOrders, period]);
    const dishStats = useMemo(() => buildDishStats(currentOrders), [currentOrders]);
    const topDishes = dishStats.slice(0, 8);
    const paymentBreakdown = useMemo(() => buildPaymentBreakdown(currentOrders), [currentOrders]);
    const revenueSparkline = chartData.map(d => d.revenue);

    function pctChange(curr: number, prev: number): { pct: number; up: boolean; zero: boolean } {
        if (prev === 0 && curr === 0) return { pct: 0, up: true, zero: true };
        if (prev === 0) return { pct: 100, up: true, zero: false };
        const pct = Math.round(((curr - prev) / prev) * 100);
        return { pct: Math.abs(pct), up: pct >= 0, zero: pct === 0 };
    }

    const revChange = pctChange(totalRevenue, prevRevenue);
    const ordChange = pctChange(totalOrders, prevTotalOrders);
    const aovChange = pctChange(avgOrderValue, prevAvgOrderValue);
    const custChange = pctChange(uniqueCustomers, prevUniqueCustomers);
    const maxDishRevenue = topDishes.length > 0 ? topDishes[0].revenue : 1;
    const peakBucket = [...chartData].sort((a, b) => b.revenue - a.revenue)[0];

    // Format custom date nicely for display
    const customDateLabel = useMemo(() => {
        const d = new Date(customDate + 'T00:00:00');
        const today = new Date();
        if (toYMD(d) === toYMD(today)) return 'Today';
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (toYMD(d) === toYMD(yesterday)) return 'Yesterday';
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }, [customDate]);

    const activePeriodLabel = period === 'custom' ? customDateLabel : PERIOD_LABELS[period];

    return (
        <div className="sa-page">
            {/* ── Header ── */}
            <header className="sa-header">
                <div>
                    <h1 className="sa-title">Sales Analysis</h1>
                    <p className="sa-subtitle">Real-time sales insights &amp; dish performance</p>
                </div>

                {/* Period controls */}
                <div className="sa-controls-row">
                    <div className="sa-period-switcher">
                        {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
                            <button
                                key={p}
                                className={`sa-period-btn ${period === p ? 'active' : ''}`}
                                onClick={() => { setPeriod(p); setCalOpen(false); }}
                            >
                                {PERIOD_LABELS[p]}
                            </button>
                        ))}
                    </div>

                    {/* Calendar picker */}
                    <div className="sa-cal-trigger-wrap" ref={calRef}>
                        <button
                            className={`sa-cal-trigger ${period === 'custom' ? 'active' : ''}`}
                            onClick={() => {
                                setCalOpen(v => !v);
                                if (period !== 'custom') setPeriod('custom');
                            }}
                            title="Pick a specific date"
                        >
                            <CalendarDays size={15} />
                            <span>{period === 'custom' ? customDateLabel : 'Pick Date'}</span>
                        </button>

                        {calOpen && (
                            <MiniCalendar
                                orders={paidOrders}
                                selectedDate={customDate}
                                onSelect={ymd => {
                                    setCustomDate(ymd);
                                    setPeriod('custom');
                                    setCalOpen(false);
                                }}
                                onClose={() => setCalOpen(false)}
                            />
                        )}
                    </div>
                </div>
            </header>

            {/* ── KPI Cards ── */}
            <div className="sa-kpi-grid">
                <KPICard icon={<IndianRupee size={20} />} label="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    change={revChange} compareLabel={PERIOD_COMPARE_LABELS[period]}
                    sparkline={revenueSparkline} color="#f97316" />
                <KPICard icon={<ShoppingBag size={20} />} label="Total Orders"
                    value={totalOrders.toLocaleString()}
                    change={ordChange} compareLabel={PERIOD_COMPARE_LABELS[period]}
                    sparkline={chartData.map(d => d.orders)} color="#3b82f6" />
                <KPICard icon={<TrendingUp size={20} />} label="Avg Order Value"
                    value={`₹${Math.round(avgOrderValue).toLocaleString('en-IN')}`}
                    change={aovChange} compareLabel={PERIOD_COMPARE_LABELS[period]}
                    sparkline={revenueSparkline.map((r, i) => chartData[i].orders > 0 ? r / chartData[i].orders : 0)}
                    color="#8b5cf6" />
                <KPICard icon={<Utensils size={20} />} label="Unique Customers"
                    value={uniqueCustomers.toLocaleString()}
                    change={custChange} compareLabel={PERIOD_COMPARE_LABELS[period]}
                    sparkline={chartData.map(d => d.orders)} color="#10b981" />
            </div>

            {/* ── Chart Row ── */}
            <div className="sa-chart-row">
                {/* Revenue & Orders chart card */}
                <div className="sa-card sa-chart-card">
                    <div className="sa-chart-card-top">
                        <div className="sa-chart-title-block">
                            <div className="sa-chart-title-row">
                                <BarChart2 size={17} />
                                <h2 className="sa-card-title">Revenue &amp; Orders</h2>
                            </div>
                            <p className="sa-card-subtitle">
                                {activePeriodLabel} — hover bars for details
                            </p>
                        </div>

                        <div className="sa-chart-controls">
                            {/* Metric toggle */}
                            <div className="sa-metric-toggle">
                                <button className={`sa-metric-btn ${chartMetric === 'revenue' ? 'active' : ''}`}
                                    onClick={() => setChartMetric('revenue')}>Revenue</button>
                                <button className={`sa-metric-btn ${chartMetric === 'orders' ? 'active' : ''}`}
                                    onClick={() => setChartMetric('orders')}>Orders</button>
                            </div>
                        </div>
                    </div>

                    {/* Summary strip */}
                    <div className="sa-chart-summary-strip">
                        <div className="sa-strip-item">
                            <span className="sa-strip-val">
                                ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                            <span className="sa-strip-lbl">Total Revenue</span>
                        </div>
                        <div className="sa-strip-divider" />
                        <div className="sa-strip-item">
                            <span className="sa-strip-val">{totalOrders}</span>
                            <span className="sa-strip-lbl">Orders</span>
                        </div>
                        <div className="sa-strip-divider" />
                        <div className="sa-strip-item">
                            <span className="sa-strip-val">
                                ₹{Math.round(avgOrderValue).toLocaleString('en-IN')}
                            </span>
                            <span className="sa-strip-lbl">Avg Value</span>
                        </div>
                        {peakBucket && peakBucket.revenue > 0 && (
                            <>
                                <div className="sa-strip-divider" />
                                <div className="sa-strip-item">
                                    <span className="sa-strip-val">{peakBucket.label}</span>
                                    <span className="sa-strip-lbl">Peak period</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Chart */}
                    {currentOrders.length === 0 ? (
                        <div className="sa-empty-state">
                            <BarChart2 size={36} />
                            <p>No data for {activePeriodLabel.toLowerCase()}</p>
                        </div>
                    ) : (
                        <BarChartSVG data={chartData} metric={chartMetric} />
                    )}

                    {/* Legend */}
                    <div className="sa-chart-footer">
                        <div className="sa-chart-legend">
                            <div className="sa-legend-item">
                                <div className="sa-legend-bar" />
                                <span>{chartMetric === 'revenue' ? 'Revenue' : 'Orders'} (bars)</span>
                            </div>
                            <div className="sa-legend-item">
                                <div className="sa-legend-line" style={{ background: '#3b82f6' }} />
                                <span>Order trend (line)</span>
                            </div>
                        </div>
                        {peakBucket && peakBucket.revenue > 0 && (
                            <div className="sa-peak-pill">
                                <Clock size={12} />
                                Peak: <strong>{peakBucket.label}</strong>
                                &nbsp;·&nbsp;
                                ₹{peakBucket.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Methods — compact inline strip */}
                <div style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '1rem',
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                }}>
                    <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'hsl(var(--muted-foreground))',
                        marginRight: '0.25rem',
                        whiteSpace: 'nowrap',
                    }}>Payment Methods</span>

                    {paymentBreakdown.length === 0 ? (
                        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>No data</span>
                    ) : paymentBreakdown.map((pm, i) => (
                        <div key={pm.method} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'hsl(var(--muted) / 0.5)',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '999px',
                            padding: '0.3rem 0.75rem',
                        }}>
                            <span style={{
                                width: 7, height: 7,
                                borderRadius: '50%',
                                background: DISH_PALETTE[i % DISH_PALETTE.length],
                                flexShrink: 0,
                                display: 'inline-block',
                            }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                {pm.method}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                ₹{pm.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                                {pm.pct}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Dish Performance Table ── */}
            <div className="sa-card sa-dish-card">
                <div className="sa-card-header">
                    <div>
                        <h2 className="sa-card-title">
                            <Award size={18} />
                            Dish Performance
                        </h2>
                        <p className="sa-card-subtitle">
                            {topDishes.length} dishes sold — {activePeriodLabel.toLowerCase()}
                        </p>
                    </div>
                </div>

                {topDishes.length === 0 ? (
                    <div className="sa-empty-state">
                        <Utensils size={36} />
                        <p>No dish data for {activePeriodLabel.toLowerCase()}</p>
                    </div>
                ) : (
                    <div className="sa-dish-table-wrap">
                        <table className="sa-dish-table">
                            <colgroup>
                                <col style={{ width: '44px' }} />
                                <col />
                                <col style={{ width: '80px' }} />
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '72px' }} />
                                <col style={{ width: '160px' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center' }}>#</th>
                                    <th>Dish Name</th>
                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Revenue</th>
                                    <th style={{ textAlign: 'center' }}>Orders</th>
                                    <th>Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topDishes.map((dish, idx) => {
                                    const share = maxDishRevenue > 0 ? (dish.revenue / maxDishRevenue) * 100 : 0;
                                    return (
                                        <tr key={dish.name} className="sa-dish-row">
                                            <td className="sa-td-center">
                                                <span className="sa-rank-badge" style={{
                                                    backgroundColor: idx === 0 ? 'rgba(234, 179, 8, 0.15)' : idx === 1 ? 'rgba(148, 163, 184, 0.15)' : idx === 2 ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                                                    color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#f97316' : 'hsl(var(--muted-foreground))',
                                                }}>{idx + 1}</span>
                                            </td>
                                            <td>
                                                <div className="sa-dish-name-cell">
                                                    <span className="sa-dish-color-dot"
                                                        style={{ background: DISH_PALETTE[idx % DISH_PALETTE.length] }} />
                                                    <span className="sa-dish-name-text">{dish.name}</span>
                                                </div>
                                            </td>
                                            <td className="sa-td-center">
                                                <span className="sa-qty-badge">{dish.quantity}</span>
                                            </td>
                                            <td className="sa-revenue-cell">
                                                ₹{dish.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="sa-td-center sa-order-count-cell">{dish.orderCount}</td>
                                            <td>
                                                <div className="sa-share-cell">
                                                    <div className="sa-share-bar-track">
                                                        <div className="sa-share-bar-fill"
                                                            style={{ width: `${share}%`, background: DISH_PALETTE[idx % DISH_PALETTE.length] }} />
                                                    </div>
                                                    <span className="sa-share-pct">{Math.round(share)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Summary Footer ── */}
            {currentOrders.length > 0 && (
                <div className="sa-summary-row">
                    <div className="sa-summary-pill">
                        <TrendingUp size={14} />
                        <span>Best selling: <strong>{topDishes[0]?.name ?? '—'}</strong></span>
                    </div>
                    <div className="sa-summary-pill">
                        <ShoppingBag size={14} />
                        <span>
                            {totalOrders} paid orders &nbsp;·&nbsp; Total ₹
                            {totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
