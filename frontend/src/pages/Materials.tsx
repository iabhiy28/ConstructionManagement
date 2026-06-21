import React, { useState, useEffect } from 'react';
import { Material } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Package, AlertTriangle } from 'lucide-react';

interface MaterialsProps {
  selectedProjectId: string;
}

export default function MaterialsInventory({ selectedProjectId }: MaterialsProps) {
  const { role } = useAuth();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Transaction Form State
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState('');
  const [txnType, setTxnType] = useState<'Inward' | 'Outward'>('Outward');
  const [notes, setNotes] = useState('');

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await api.getMaterials(selectedProjectId);
      setMaterials(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [selectedProjectId]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaterial || !quantity) return;

    try {
      await api.logMaterialTransaction(activeMaterial.id, Number(quantity), txnType, notes);
      setShowTxnModal(false);
      setQuantity('');
      setNotes('');
      setActiveMaterial(null);
      loadMaterials();
    } catch (err) {
      alert('Error updating inventory stock');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Material Inventory</h2>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Real-time tracking of cement bags, rebar tons, bricks, and sand brass counts.</p>
      </div>

      {/* Low Stock Alerts Banner */}
      {materials.some(m => m.stock_level < m.reorder_level) && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <div>
            <p className="text-xs font-bold">Critical Inventory Shortage Detected</p>
            <p className="text-[10px] opacity-90 mt-0.5 leading-relaxed font-medium">
              Some key items are below safety thresholds. Release a purchase request to avoid schedule delays.
            </p>
          </div>
        </div>
      )}

      {/* Grid inventory list */}
      <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Package className="w-4 h-4 text-primary" />
            Stock Registry
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/60 animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-2">Material Name</th>
                  <th className="py-3 px-2 text-right">Available Stock</th>
                  <th className="py-3 px-2 text-right">Reorder Threshold</th>
                  <th className="py-3 px-2 text-center">Status Tag</th>
                  {['Super Admin', 'Company Owner', 'Site Engineer', 'Store Manager'].includes(role) && (
                    <th className="py-3 px-2 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {materials.map(m => {
                  const isLow = m.stock_level < m.reorder_level;
                  return (
                    <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 px-2 font-bold text-foreground">{m.name}</td>
                      <td className="py-3.5 px-2 text-right font-black text-foreground">
                        {m.stock_level} <span className="text-[10px] font-medium text-muted-foreground">{m.unit}</span>
                      </td>
                      <td className="py-3.5 px-2 text-right text-muted-foreground font-semibold">
                        {m.reorder_level} {m.unit}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isLow ? 'bg-red-100 dark:bg-red-950/20 text-red-600 animate-pulse' : 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600'
                        }`}>
                          {isLow ? 'Low Stock' : 'Stable'}
                        </span>
                      </td>
                      {['Super Admin', 'Company Owner', 'Site Engineer', 'Store Manager'].includes(role) && (
                        <td className="py-3.5 px-2 text-center">
                          <button
                            onClick={() => {
                              setActiveMaterial(m);
                              setTxnType('Outward');
                              setShowTxnModal(true);
                            }}
                            className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/15 transition-all"
                          >
                            Update Stock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Transaction Modal */}
      {showTxnModal && activeMaterial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Log Stock Movement</h3>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-foreground">Item: {activeMaterial.name}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">Current stock level: {activeMaterial.stock_level} {activeMaterial.unit}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Transaction Type</label>
                  <select
                    value={txnType} onChange={e => setTxnType(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Outward">Outward (Consumption)</option>
                    <option value="Inward">Inward (Procurement)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Quantity ({activeMaterial.unit})</label>
                  <input
                    type="number" required value={quantity} onChange={e => setQuantity(e.target.value)}
                    placeholder="Log count"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Remarks / Notes</label>
                <input
                  type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Slab casting usage, Cash Purchase"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => {
                    setShowTxnModal(false);
                    setActiveMaterial(null);
                  }}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Commit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
