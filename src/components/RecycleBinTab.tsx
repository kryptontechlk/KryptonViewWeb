import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrashItem } from '../types';
import { 
  Trash2, 
  RotateCcw, 
  Trash, 
  Info, 
  AlertCircle, 
  Search,
  ReceiptText,
  FileSignature,
  ShoppingBag,
  Grid,
  Sparkles
} from 'lucide-react';

interface RecycleBinTabProps {
  trashItems: TrashItem[];
  onRestore: (item: TrashItem) => Promise<void>;
  onDeletePermanently: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export default function RecycleBinTab({
  trashItems,
  onRestore,
  onDeletePermanently,
  onClearAll
}: RecycleBinTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'invoice' | 'quotation' | 'category'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter items
  const filteredItems = trashItems.filter(item => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    let label = '';
    if (item.type === 'product') {
      label = item.itemData?.name || '';
    } else if (item.type === 'invoice') {
      label = `${item.itemData?.invoiceNumber || ''} - ${item.itemData?.customerName || ''}`;
    } else if (item.type === 'quotation') {
      label = `${item.itemData?.quotationNumber || ''} - ${item.itemData?.customerName || ''}`;
    } else if (item.type === 'category') {
      label = item.itemData?.name || '';
    }

    const matchesSearch = label.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesType && matchesSearch;
  });

  const handleRestoreClick = async (item: TrashItem) => {
    setActionLoadingId(item.id);
    try {
      await onRestore(item);
    } catch (e) {
      console.error(e);
      alert("Failed to restore item");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePermanentlyClick = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this item? This action CANNOT be undone!")) {
      setActionLoadingId(id);
      try {
        await onDeletePermanently(id);
      } catch (e) {
        console.error(e);
        alert("Failed to delete item permanently");
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleClearAllClick = async () => {
    if (window.confirm("Are you sure you want to permanently empty the Recycle Bin? All deleted items will be lost forever!")) {
      try {
        await onClearAll();
      } catch (e) {
        console.error(e);
        alert("Failed to empty recycle bin");
      }
    }
  };

  const getItemLabel = (item: TrashItem) => {
    const data = item.itemData;
    switch (item.type) {
      case 'product':
        return (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{data?.name || 'Unnamed Product'}</p>
            <p className="text-[10px] text-slate-400 font-mono">Code: {data?.code || 'N/A'} • Price: LKR {data?.price || 0}</p>
          </div>
        );
      case 'invoice':
        return (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Invoice {data?.invoiceNumber || 'Draft'}</p>
            <p className="text-[10px] text-slate-400 font-mono">To: {data?.customerName || 'N/A'} • Total: LKR {data?.total?.toLocaleString() || 0}</p>
          </div>
        );
      case 'quotation':
        return (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Quotation {data?.quotationNumber || 'Draft'}</p>
            <p className="text-[10px] text-slate-400 font-mono">To: {data?.customerName || 'N/A'} • Total: LKR {data?.total?.toLocaleString() || 0}</p>
          </div>
        );
      case 'category':
        return (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{data?.name || 'Unnamed Category'}</p>
            <p className="text-[10px] text-slate-400 font-mono">Category ID: {data?.id || 'N/A'}</p>
          </div>
        );
      default:
        return <p className="font-semibold text-slate-800 dark:text-slate-200">Unknown Item</p>;
    }
  };

  const getItemIcon = (type: TrashItem['type']) => {
    switch (type) {
      case 'product':
        return <ShoppingBag size={15} className="text-blue-500" />;
      case 'invoice':
        return <ReceiptText size={15} className="text-emerald-500" />;
      case 'quotation':
        return <FileSignature size={15} className="text-purple-500" />;
      case 'category':
        return <Grid size={15} className="text-amber-500" />;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-5 sm:p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <Trash2 size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-display font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
              Recycle Bin <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full text-xs font-black">{trashItems.length}</span>
            </h2>
            <p className="text-xs text-slate-400">Restore deleted items or permanently remove them from your database.</p>
          </div>
        </div>

        {trashItems.length > 0 && (
          <button
            onClick={handleClearAllClick}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Trash size={14} />
            <span>Empty Recycle Bin</span>
          </button>
        )}
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search deleted items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-slate-800 dark:text-slate-100 text-xs outline-none transition"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-1 rounded-xl w-full md:w-auto">
          {(['all', 'product', 'invoice', 'quotation', 'category'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Types' : t + 's'}
            </button>
          ))}
        </div>

      </div>

      {/* Grid listing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center text-slate-350">
              <Info size={20} />
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No items found</p>
              <p className="text-xs text-slate-400 mt-1">The Recycle Bin is currently empty or filtered out.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
              >
                
                {/* Left: Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 shrink-0 mt-0.5`}>
                    {getItemIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-250/20 mb-1">
                      {item.type}
                    </span>
                    {getItemLabel(item)}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Deleted: {new Date(item.deletedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleRestoreClick(item)}
                    disabled={actionLoadingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-150 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-indigo-950/30 dark:hover:border-indigo-900 text-xs font-bold rounded-lg transition cursor-pointer text-slate-600 dark:text-slate-300 disabled:opacity-50"
                    title="Restore item back to original place"
                  >
                    <RotateCcw size={13} className={actionLoadingId === item.id ? "animate-spin" : ""} />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => handleDeletePermanentlyClick(item.id)}
                    disabled={actionLoadingId === item.id}
                    className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-150 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-rose-950/30 dark:hover:border-rose-900 rounded-lg transition cursor-pointer text-slate-450 disabled:opacity-50"
                    title="Permanently Delete"
                  >
                    <Trash size={13} />
                  </button>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Helpful info bar */}
      <div className="flex gap-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 py-3.5 px-4 rounded-xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        <AlertCircle size={15} className="shrink-0 text-amber-500 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">⚠️ Data Persistence & Permanent Deletion</span>
          Items deleted here are removed from the database permanently and cannot be recovered. Ensure you verify details before finalizing operations.
        </div>
      </div>

    </div>
  );
}
