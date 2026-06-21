import React, { useState, useEffect } from 'react';
import { FinancialTransaction, Project } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Sparkles, Plus, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, ClipboardList, IndianRupee 
} from 'lucide-react';

interface FinancialsProps {
  selectedProjectId: string;
  projects: Project[];
}

export default function Financials({ selectedProjectId, projects }: FinancialsProps) {
  const { role } = useAuth();
  
  const [ledger, setLedger] = useState<FinancialTransaction[]>([]);
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);

  // New Transaction Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [category, setCategory] = useState<'Labour' | 'Material' | 'Equipment' | 'Transportation' | 'Utilities' | 'Miscellaneous'>('Material');
  const [desc, setDesc] = useState('');
  const [refId, setRefId] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const loadFinancials = async () => {
    setLoading(true);
    try {
      const data = await api.getFinancials();
      setLedger(data.filter(t => t.project_id === selectedProjectId));
      const pred = await api.getCostPredictions(selectedProjectId);
      setAiPrediction(pred);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, [selectedProjectId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc) return;

    try {
      await api.createFinancialTransaction({
        project_id: selectedProjectId,
        category,
        amount: Number(amount),
        type,
        description: desc,
        reference_id: refId || `TXN-REF-${Date.now().toString().slice(-4)}`
      });
      setShowAddTxn(false);
      setAmount('');
      setDesc('');
      setRefId('');
      loadFinancials();
    } catch (err) {
      alert('Error updating transaction ledger');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Financial Ledger & AI Projections</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Control project funds flow, register vendor bills, and evaluate AI forecast metrics.</p>
        </div>

        {['Super Admin', 'Company Owner', 'Accountant'].includes(role) && (
          <button
            onClick={() => setShowAddTxn(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Transaction
          </button>
        )}
      </div>

      {/* AI Cost Predictions Dashboard Block */}
      {aiPrediction && (
        <div className="bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10 border border-primary/25 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
          {/* Glass background decoration */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl z-0" />
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">AI Cost & Completion Projection</h3>
            </div>
            
            <div className="bg-primary/10 text-primary text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Confidence Score: {aiPrediction.confidenceScore}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-border/60 rounded-xl p-3.5">
              <span className="text-[8px] font-bold text-muted-foreground uppercase">Project Budget</span>
              <p className="text-lg font-black text-foreground mt-1">₹{aiPrediction.budget.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-border/60 rounded-xl p-3.5">
              <span className="text-[8px] font-bold text-muted-foreground uppercase">Logged to Date</span>
              <p className="text-lg font-black text-foreground mt-1">₹{aiPrediction.currentExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-border/60 rounded-xl p-3.5">
              <span className="text-[8px] font-bold text-muted-foreground uppercase">AI Est. Final Cost</span>
              <p className="text-lg font-black text-foreground mt-1">₹{aiPrediction.predictedFinalCost.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm border border-border/60 rounded-xl p-3.5">
              <span className="text-[8px] font-bold text-muted-foreground uppercase">Overrun Warning</span>
              <p className={`text-lg font-black mt-1 ${aiPrediction.projectedOverrun > 0 ? 'text-destructive animate-pulse' : 'text-emerald-500'}`}>
                ₹{aiPrediction.projectedOverrun.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/40 flex flex-col md:flex-row justify-between gap-3 text-[10px] font-bold text-muted-foreground relative z-10">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              AI recommendation: Timeline forecast estimates site completion date by {aiPrediction.projectedCompletionDate}.
            </span>
            <span>Forecast model updated daily</span>
          </div>
        </div>
      )}

      {/* Ledger Lists and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledger logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-primary" />
              Cash Ledger Book
            </h3>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-xl" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Details</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ledger.map(txn => (
                      <tr key={txn.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-2 text-muted-foreground font-semibold">{txn.transaction_date}</td>
                        <td className="py-3 px-2">
                          <p className="font-bold text-foreground">{txn.description}</p>
                          <p className="text-[9px] text-muted-foreground font-semibold">{txn.reference_id}</p>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground font-bold">{txn.category}</td>
                        <td className={`py-3 px-2 text-right font-black ${
                          txn.type === 'Income' ? 'text-emerald-500' : 'text-foreground'
                        }`}>
                          {txn.type === 'Income' ? '+' : '-'} ₹{txn.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* AI Materials Procurement Recommendations */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              AI Material Demand Forecast
            </h3>

            <div className="space-y-3">
              {aiPrediction?.materialForecasts.map((mat: any, i: number) => (
                <div key={i} className="bg-muted/30 border border-border/60 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-foreground">{mat.materialName}</p>
                      <p className="text-[9px] text-muted-foreground font-medium">Stock: {mat.currentStock} {mat.unit}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      mat.urgency === 'Critical' ? 'bg-red-100 dark:bg-red-950/20 text-red-600 animate-pulse' : 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600'
                    }`}>
                      {mat.urgency}
                    </span>
                  </div>
                  {mat.suggestedPurchase > 0 && (
                    <div className="pt-2 border-t border-border/40 flex justify-between items-center text-[9px] font-bold text-primary">
                      <span>Suggested order size:</span>
                      <span>{mat.suggestedPurchase} {mat.unit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Record Transaction Modal */}
      {showAddTxn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Record Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Flow Direction</label>
                  <select
                    value={type} onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Expense">Expense (Outward Payment)</option>
                    <option value="Income">Income (Inward Capital)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Transaction Category</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Labour">Labour Wages</option>
                    <option value="Material">Material Cost</option>
                    <option value="Equipment">Equipment Lease</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Transaction Value (₹)</label>
                  <input
                    type="number" required value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="Log amount"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Reference ID / Txn ref</label>
                  <input
                    type="text" value={refId} onChange={e => setRefId(e.target.value)}
                    placeholder="UPI-txn ID or NEFT ref"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Payment Description</label>
                <input
                  type="text" required value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="e.g. Mason wages period start, Cement supply"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowAddTxn(false)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
