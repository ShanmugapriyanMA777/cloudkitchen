import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, UserCheck, BarChart3, Database, Copy, Check, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { DashboardMetrics } from '../types';
import { OrderHistory } from './OrderHistory';

interface AdminDashboardProps {
  onBackToMenu: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToMenu }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedDbSchema, setCopiedDbSchema] = useState(false);
  const [schemaText, setSchemaText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchAdminMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) throw new Error('Unassigned administrative node access denied.');
      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching metrics.');
    }
  };

  const fetchSchemaFile = async () => {
    try {
      const response = await fetch('/api/supabase-schema');
      if (response.ok) {
        const text = await response.text();
        setSchemaText(text);
      }
    } catch (err) {
      console.error('Error fetching schema text', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchAdminMetrics(), fetchSchemaFile()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaText);
    setCopiedDbSchema(true);
    setTimeout(() => setCopiedDbSchema(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-4 h-[60vh] text-[#F5F5F5]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <h3 className="font-serif italic text-lg">Aggregating Admin Analytics...</h3>
        <p className="text-xs text-zinc-400 font-light">Performing transactional sales computation and grouping category stats.</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-950/30 border border-orange-500/15 text-orange-500 flex items-center justify-center">
          <Database className="w-8 h-8" />
        </div>
        <h3 className="font-serif italic text-lg text-white">Sync Desynchronized</h3>
        <p className="text-xs text-zinc-400 font-light">{error || 'Server error'}</p>
        <button 
          onClick={onBackToMenu} 
          className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer"
        >
          Return To Site
        </button>
      </div>
    );
  }

  // Calculate SVG Graph Dimensions
  const graphWidth = 500;
  const graphHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = graphWidth - paddingLeft - paddingRight;
  const chartHeight = graphHeight - paddingTop - paddingBottom;

  // Max value for line calculation
  const salesHistory = metrics.salesHistory || [];
  const maxSales = Math.max(...salesHistory.map(item => item.sales), 100);

  // Generate SVG path coordinates
  const points = salesHistory.map((item, index) => {
    const x = paddingLeft + (index / (salesHistory.length - 1)) * chartWidth;
    // Y is inverted in SVG, 0 is at top
    const y = paddingTop + chartHeight - (item.sales / maxSales) * chartHeight;
    return { x, y, data: item };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  // Filled area path for glassmorphic chart look
  const filledAreaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F5F5F5] animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button 
            onClick={onBackToMenu}
            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-2 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Return to kitchen menu</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-serif italic text-white leading-tight">
              Velvet Kitchen Analytical Suite
            </h1>
            <span className="text-[9px] font-mono font-bold tracking-widest bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full uppercase">
              LIVE GATEWAY SECURED
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-1.5">Real-time aggregate kitchen KPIs, customer orders, and cloud persistence schemas.</p>
        </div>

        <button 
          onClick={fetchAdminMetrics}
          className="flex items-center space-x-1.5 px-4 h-10 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 text-xs font-semibold text-zinc-300 hover:text-white self-start sm:self-center transition-all active:scale-95 duration-200 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metric Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, description: 'Gross finalized payout', icon: DollarSign, color: 'text-emerald-450 text-emerald-450 bg-emerald-500/10 text-emerald-400' },
          { label: 'Total Orders', value: metrics.totalOrders, description: 'Finalized transactions', icon: ShoppingCart, color: 'text-orange-500 bg-orange-500/10' },
          { label: 'Active Culinary Jobs', value: metrics.activeOrders, description: 'Simulated kitchen jobs', icon: UserCheck, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Avg Order Value (AOV)', value: `₹${metrics.averageOrderValue}`, description: 'Ticket value index', icon: BarChart3, color: 'text-purple-400 bg-purple-500/10' }
        ].map((c, idx) => (
          <div key={idx} className="p-5 sm:p-6 rounded-3xl border border-white/5 bg-[#0a0a0a] flex flex-col justify-between hover:border-white/10 transition-all duration-300">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{c.label}</span>
              <div className={`p-2 rounded-xl ${c.color}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight leading-none">
                {c.value}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1.5 font-light">{c.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Graphs Row Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Performance over columns: 12-column span 7 */}
        <div className="lg:col-span-12 xl:col-span-7 rounded-3xl border border-white/5 bg-[#0a0a0a] p-5 sm:p-6 flex flex-col hover:border-white/10 transition-all duration-300">
          <div className="mb-4">
            <h3 className="text-sm font-serif italic font-medium text-white tracking-tight">Sales History Metrics</h3>
            <p className="text-[10px] text-zinc-400 font-light">Total daily finalized receipt values (Past 7 days interval)</p>
          </div>

          {/* Custom SVG Line Graph */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <svg 
              viewBox={`0 0 ${graphWidth} ${graphHeight}`} 
              className="w-full min-w-[400px] h-full text-zinc-800 overflow-visible"
            >
              {/* Y-axis baseline grids */}
              {[4, 3, 2, 1, 0].map((step) => {
                const stepValue = Math.round((maxSales / 4) * step);
                const stepY = paddingTop + (chartHeight / 4) * (4 - step);
                return (
                  <g key={step} className="opacity-20">
                    <line 
                      x1={paddingLeft} 
                      y1={stepY} 
                      x2={graphWidth - paddingRight} 
                      y2={stepY} 
                      stroke="#555" 
                      strokeWidth="0.5" 
                      strokeDasharray="4 4"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={stepY + 3} 
                      fontSize="9" 
                      textAnchor="end" 
                      className="fill-zinc-500 font-mono font-bold"
                    >
                      ₹{stepValue}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {salesHistory.map((item, index) => {
                const x = paddingLeft + (index / (salesHistory.length - 1)) * chartWidth;
                return (
                  <text 
                    key={index}
                    x={x} 
                    y={graphHeight - 10} 
                    fontSize="9" 
                    textAnchor="middle" 
                    className="fill-zinc-500 font-mono font-bold"
                  >
                    {item.date}
                  </text>
                );
              })}

              {/* Smoothed filled area under curve */}
              <path 
                d={filledAreaPath} 
                fill="url(#area-gradient)" 
                className="opacity-15 pointer-events-none"
              />

              {/* Curved metric trace line */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="url(#line-gradient)" 
                strokeWidth="2.5" 
              />

              {/* Interaction helper circles on scatter points */}
              {points.map((pt, i) => (
                <g key={i} className="group/dot cursor-pointer">
                  {/* Outer breathing background circle */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="8" 
                    className="fill-orange-500/0 group-hover/dot:fill-orange-500/10 transition-colors"
                  />
                  {/* Sharp core point */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="3.5" 
                    className="fill-orange-500 stroke-[#0a0a0a] stroke-2 shadow-lg"
                  />
                  {/* Tooltip */}
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    textAnchor="middle"
                    fontSize="9"
                    className="fill-orange-400 font-mono font-bold opacity-0 group-hover/dot:opacity-100 transition-opacity"
                  >
                    ₹{pt.data.sales}
                  </text>
                </g>
              ))}

              {/* Define color gradients for the graphs */}
              <defs>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

            </svg>
          </div>
        </div>

        {/* Categories Distribution Grid: 12-column span 5 */}
        <div className="lg:col-span-12 xl:col-span-5 rounded-3xl border border-white/5 bg-[#0a0a0a] p-5 sm:p-6 flex flex-col justify-between hover:border-white/10 transition-all duration-300">
          <div>
            <h3 className="text-sm font-serif italic font-medium text-white tracking-tight">Category Distribution</h3>
            <p className="text-[10px] text-zinc-400 font-light">Culinary sales quantity distribution by cuisine class</p>
          </div>

          <div className="space-y-4 my-4">
            {metrics.categoryStats.map((stat, idx) => {
              const maxItems = Math.max(...metrics.categoryStats.map(s => s.count), 1);
              const barWidth = Math.max((stat.count / maxItems) * 100, 3);
              
              const categoryColors = [
                'bg-orange-600',
                'bg-[#B33A17]',
                'bg-[#9A301D]',
                'bg-[#82291E]',
                'bg-[#ED6A45]'
              ];

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-light">{stat.category}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {stat.count} items <span className="text-zinc-700">|</span> ₹{stat.sales}
                    </span>
                  </div>
                  {/* Progress bar container */}
                  <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${categoryColors[idx % categoryColors.length]}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-zinc-500 leading-normal border-t border-dashed border-white/5 pt-3 font-light">
            💡 "Mains" continue to yield highest transactional size, while "Starters" generate rapid inventory turnover.
          </p>
        </div>

      </div>

      {/* ORDER HISTORY LOG REGISTRY SECTION */}
      <OrderHistory onOrderUpdated={fetchAdminMetrics} />

      {/* SCHEMA COPY SECTION */}
      <div className="rounded-[2rem] border border-white/5 bg-[#0a0a0a] p-5 sm:p-6 space-y-4 hover:border-white/10 transition-all duration-300">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-serif italic font-medium text-white leading-tight">
                Supabase DDL PostgreSQL Schema (RLS Policy Active)
              </h3>
              <p className="text-[10px] text-zinc-400 font-light mt-0.5">Auto-generated secure relational database structure designed for production setups.</p>
            </div>
          </div>

          <button
            id="copy-sql-btn"
            onClick={handleCopySchema}
            className="flex items-center space-x-1.5 px-4 h-9 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:text-white transition-all text-xs font-semibold text-zinc-300 cursor-pointer"
          >
            {copiedDbSchema ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-mono text-[10px]">Schema Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL DDL</span>
              </>
            )}
          </button>
        </div>

        {/* Code shell container */}
        <div className="relative rounded-2xl overflow-hidden border border-white/5 group">
          <pre 
            className="text-[10px] font-mono leading-relaxed bg-[#050505] text-zinc-400 p-5 max-h-52 overflow-y-auto w-full no-scrollbar whitespace-pre-wrap select-all font-light"
          >
            {schemaText || '-- Retreiving PostgreSQL setup queries...'}
          </pre>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/[0.03] to-orange-500/[0.08] border border-orange-500/15 text-xs text-zinc-350">
          <p className="font-serif italic font-medium mb-1.5 text-white">
            📊 Production Deployment Recommendations:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-[11px] text-zinc-400 font-light">
            <li>Open your **Supabase CLI** or **SQL Editor Dashboard**, copy the PostgreSQL script, and run it.</li>
            <li>Row-level Security (RLS) guards order histories, letting clients query only their authenticated records via `auth.uid()`.</li>
            <li>Set up environment secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` to substitute local-storage simulation with production client synchronization.</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
