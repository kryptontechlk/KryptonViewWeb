import React, { useState, useMemo } from 'react';
import { Invoice, Product } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Receipt, Calendar, ArrowUpRight, 
  ShoppingBag, Clock, Sparkles, Filter, Percent, Landmark,
  Search, X
} from 'lucide-react';

interface AnalyticsTabProps {
  invoices: Invoice[];
  products: Product[];
}

export default function AnalyticsTab({ invoices, products }: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<'all' | '6m' | '30d' | 'ytd'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'final' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar');

  // Parse custom YYYY-MM-DD date and group
  const getMonthName = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const parts = dateStr.split('-');
    if (parts.length < 2) return 'Unknown';
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${monthNames[monthIdx]} ${year.slice(-2)}`;
    }
    return 'Unknown';
  };

  // Filter invoices helper
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Status Filter
    if (statusFilter === 'final') {
      result = result.filter(inv => inv.status === 'final');
    } else if (statusFilter === 'draft') {
      result = result.filter(inv => inv.status === 'draft');
    }

    // Time Range Filter
    const now = new Date();
    const currentYear = now.getFullYear();

    if (timeRange === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      result = result.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= thirtyDaysAgo;
      });
    } else if (timeRange === '6m') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      result = result.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= sixMonthsAgo;
      });
    } else if (timeRange === 'ytd') {
      result = result.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getFullYear() === currentYear;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(inv => {
        const matchesCustomer = inv.customerName.toLowerCase().includes(query);
        const matchesRef = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesProduct = inv.items.some(item => 
          item.productName.toLowerCase().includes(query) || 
          (item.productCode && item.productCode.toLowerCase().includes(query))
        );
        return matchesCustomer || matchesRef || matchesProduct;
      });
    }

    // Sort by date chronologically
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [invoices, timeRange, statusFilter, searchQuery]);

  // KPIs calculations
  const kpis = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const invoiceCount = filteredInvoices.length;
    
    const uniqueCustomers = new Set(filteredInvoices.map(inv => inv.customerName.trim().toLowerCase()));
    const activeCustomersCount = uniqueCustomers.size;
    
    const averageTicketSize = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

    // Draft / final split
    const drafts = filteredInvoices.filter(inv => inv.status === 'draft').length;
    const finals = invoiceCount - drafts;

    return {
      totalRevenue,
      invoiceCount,
      activeCustomersCount,
      averageTicketSize,
      drafts,
      finals
    };
  }, [filteredInvoices]);

  // Trend Data: Group Revenue by Month
  const revenueTrendData = useMemo(() => {
    const groups: { [key: string]: { monthKey: string; revenue: number; drafts: number; billsCount: number; dateWeight: number } } = {};
    
    filteredInvoices.forEach(inv => {
      const label = getMonthName(inv.date);
      if (label === 'Unknown') return;
      
      const yearMonthParts = inv.date.split('-');
      const dateWeight = yearMonthParts.length >= 2 
        ? parseInt(yearMonthParts[0]) * 100 + parseInt(yearMonthParts[1]) 
        : 0;

      if (!groups[label]) {
        groups[label] = {
          monthKey: label,
          revenue: 0,
          drafts: 0,
          billsCount: 0,
          dateWeight
        };
      }
      
      groups[label].revenue += inv.total;
      groups[label].billsCount += 1;
      if (inv.status === 'draft') {
        groups[label].drafts += 1;
      }
    });

    // Sort chronologically by dateWeight
    return Object.values(groups).sort((a, b) => a.dateWeight - b.dateWeight);
  }, [filteredInvoices]);

  // Top Selling Products Data
  const topProductsData = useMemo(() => {
    const productSales: { [key: string]: { name: string; code: string; quantity: number; revenue: number } } = {};

    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const prodKey = item.productId || item.productCode || item.productName;
        if (!prodKey) return;

        if (!productSales[prodKey]) {
          productSales[prodKey] = {
            name: item.productName,
            code: item.productCode,
            quantity: 0,
            revenue: 0
          };
        }

        productSales[prodKey].quantity += item.quantity;
        productSales[prodKey].revenue += item.price * item.quantity;
      });
    });

    // Sort by quantity desc and take top 8
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [filteredInvoices]);

  // Customer Volume Data
  const customerVolumeData = useMemo(() => {
    const customerAggs: { [key: string]: { name: string; invoiceCount: number; totalSpent: number } } = {};

    filteredInvoices.forEach(inv => {
      const custKey = inv.customerName.trim();
      if (!custKey) return;

      if (!customerAggs[custKey]) {
        customerAggs[custKey] = {
          name: custKey,
          invoiceCount: 0,
          totalSpent: 0
        };
      }

      customerAggs[custKey].invoiceCount += 1;
      customerAggs[custKey].totalSpent += inv.total;
    });

    // Sort by total spent desc to extract high-value / frequency customers
    return Object.values(customerAggs)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8);
  }, [filteredInvoices]);

  // Chart Color Palette styling
  const COLORS = {
    indigo: '#4f46e5',
    purple: '#7c3aed',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    sky: '#0284c7',
    slate: '#475569',
    indigoLight: '#c7d2fe',
    emeraldLight: '#a7f3d0'
  };

  const hasData = invoices.length > 0;

  return (
    <div className="space-y-6 animate-fade-in no-print">
      {/* Search and control filter header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600 animate-pulse" />
            <span>Billing Metrics & Analytics Dashboard</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Visualize customer transactions, monthly billing trends, and dynamic inventory yields.
          </p>
        </div>

        {/* Inputs & Filters */}
        <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-3 w-full xl:w-auto">
          {/* SEARCH BOX */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setSearchQuery(searchTerm);
            }}
            className="flex items-center gap-1.5 min-w-[260px] flex-1 lg:flex-none h-9"
          >
            <div className="relative flex-1 select-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition h-9 font-semibold"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 h-9 cursor-pointer shadow-sm active:scale-95"
            >
              <Search size={13} />
              <span>Search</span>
            </button>
          </form>

          {/* Status & Window Filters Wrapper */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-[11px] h-9">
              <span className="text-slate-400 px-1.5 font-bold uppercase text-[9px] tracking-wider">Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('final')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  statusFilter === 'final' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Final
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  statusFilter === 'draft' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Drafts
              </button>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-[11px] h-9">
              <span className="text-slate-400 px-1.5 font-bold uppercase text-[9px] tracking-wider">Window:</span>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  timeRange === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeRange('ytd')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  timeRange === 'ytd' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                YTD
              </button>
              <button
                onClick={() => setTimeRange('6m')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  timeRange === '6m' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
                  timeRange === '30d' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between group hover:border-indigo-100 transition duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accumulated Income</span>
            <div className="text-base sm:text-lg font-black text-slate-800 font-mono tracking-tight">
              LKR <span className="text-indigo-600">{kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Based on active filter conditions
            </span>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition">
            <Landmark size={20} className="stroke-[1.8]" />
          </div>
        </div>

        {/* KPI: Customer Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between group hover:border-indigo-100 transition duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Base</span>
            <div className="text-base sm:text-lg font-black text-slate-800 font-mono tracking-tight">
              {kpis.activeCustomersCount} <span className="text-xs font-bold text-slate-400">Accounts</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Unique customer accounts billed
            </span>
          </div>
          <div className="p-3.5 bg-pink-50 text-pink-600 rounded-xl group-hover:scale-105 transition">
            <Users size={20} className="stroke-[1.8]" />
          </div>
        </div>

        {/* KPI: Invoice count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between group hover:border-indigo-100 transition duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoices Billed</span>
            <div className="text-base sm:text-lg font-black text-slate-800 font-mono tracking-tight">
              {kpis.invoiceCount} <span className="text-xs font-bold text-slate-400">Total</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block">
              {kpis.finals} Finalized • {kpis.drafts} Drafts
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition">
            <Receipt size={20} className="stroke-[1.8]" />
          </div>
        </div>

        {/* KPI: Average Ticket Size */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between group hover:border-indigo-100 transition duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Ticket Size</span>
            <div className="text-base sm:text-lg font-black text-slate-800 font-mono tracking-tight">
              LKR <span className="text-amber-600">{kpis.averageTicketSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Mean value generated per invoice
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition">
            <TrendingUp size={20} className="stroke-[1.8]" />
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
            <TrendingUp size={24} className="stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Billing Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Invoices and transactions will populate automatic performance charts here once you generate some invoices or save draft records.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart 1: Revenue Monthly Trend (Area/Bar Toggle Chart) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs lg:col-span-12 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Monthly Revenue Progress</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Monthly billing aggregations showing continuous yield totals</p>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setChartType('bar')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      chartType === 'bar' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Bar Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('area')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      chartType === 'area' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Area Chart
                  </button>
                </div>
                <div className="text-[10px] font-mono text-indigo-750 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold">
                  LKR {kpis.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })} Total
                </div>
              </div>
            </div>

            {revenueTrendData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                No monthly data points available in chosen window.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart
                      data={revenueTrendData}
                      margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.16}/>
                          <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="monthKey" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        width={75}
                        tickFormatter={(val) => `LKR ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                      />
                      <Tooltip 
                        contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px' }}
                        formatter={(value: any) => [`LKR ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={COLORS.indigo} 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        dot={{ r: 4.5, fill: COLORS.indigo, stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 6.5 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={revenueTrendData}
                      margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="monthKey" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        width={75}
                        tickFormatter={(val) => `LKR ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                      />
                      <Tooltip 
                        contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px' }}
                        formatter={(value: any) => [`LKR ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Revenue']}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill={COLORS.indigo} 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={45}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Top Selling Products (Bar Chart) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs lg:col-span-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Top Selling Stock Items</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Most purchased inventory items by combined quantity</p>
              </div>
              <ShoppingBag size={14} className="text-slate-400" />
            </div>

            {topProductsData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                No product items logged in chosen invoices list.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} vertical={true} />
                    <XAxis 
                      type="number" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#1e293b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      width={90}
                      tickFormatter={(name) => name.length > 14 ? `${name.slice(0, 12)}...` : name}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px' }}
                      formatter={(val: any, name: string, props: any) => {
                        if (name === 'revenue') return [`LKR ${Number(val).toFixed(2)}`, 'Revenue Yield'];
                        return [`${val} units`, 'Quantity Sold'];
                      }}
                    />
                    <Bar dataKey="quantity" fill={COLORS.purple} radius={[0, 4, 4, 0]} maxBarSize={16}>
                      {topProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.indigo : COLORS.purple} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 3: Client Billings Volume (Bar Chart) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs lg:col-span-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Client Volume Insights</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Top-spending customer accounts and checkout frequencies</p>
              </div>
              <Users size={14} className="text-slate-400" />
            </div>

            {customerVolumeData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                No customer transactions logged in chosen window.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={customerVolumeData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} vertical={true} />
                    <XAxis 
                      type="number" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `LKR ${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#1e293b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '11px' }}
                      formatter={(val: any, name: string) => {
                        if (name === 'totalSpent') return [`LKR ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Total Spent'];
                        return [`${val} invoices`, 'Invoice Volume'];
                      }}
                    />
                    <Bar dataKey="totalSpent" fill={COLORS.sky} radius={[0, 4, 4, 0]} maxBarSize={16}>
                      {customerVolumeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.emerald : COLORS.sky} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Table: Detailed Customer Breakdown List */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs lg:col-span-12 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Client Summary Rankings</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Granular performance overview sorted by transaction value</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-sans">Rank</th>
                    <th className="py-2.5 px-4 font-sans">Customer Name</th>
                    <th className="py-2.5 px-4 font-sans text-center">Invoices Count</th>
                    <th className="py-2.5 px-4 font-sans text-right">Aggregate Spent</th>
                    <th className="py-2.5 px-4 font-sans text-right">Average Order Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-sans">
                  {customerVolumeData.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {customer.name}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {customer.invoiceCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-650">
                        LKR {customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        LKR {(customer.totalSpent / customer.invoiceCount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
