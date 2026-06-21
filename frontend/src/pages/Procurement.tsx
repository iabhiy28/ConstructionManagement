import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Project, Vendor } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ShoppingCart, ClipboardCheck, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';

interface ProcurementProps {
  selectedProjectId: string;
}

export default function ProcurementPortal({ selectedProjectId }: ProcurementProps) {
  const { role } = useAuth();
  
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  // New PO State
  const [showPOModal, setShowPOModal] = useState(false);
  const [poTitle, setPOTitle] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [matName, setMatName] = useState('Cement');
  const [qty, setQty] = useState('');
  const [rate, setRate] = useState('');

  // Selected Quotation Details
  const [activePOCompare, setActivePOCompare] = useState<PurchaseOrder | null>(null);

  const loadProcurement = async () => {
    setLoading(true);
    try {
      const data = await api.getPOs();
      setPOs(data.filter(po => po.project_id === selectedProjectId));
      const v = await api.getVendors();
      setVendors(v);
      if (v.length > 0) setSelectedVendorId(v[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcurement();
  }, [selectedProjectId]);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poTitle || !qty || !rate || !selectedVendorId) return;

    const total = Number(qty) * Number(rate);

    try {
      await api.createPO({
        project_id: selectedProjectId,
        vendor_id: selectedVendorId,
        title: poTitle,
        total_amount: total,
        items: [{ materialName: matName, qty: Number(qty), rate: Number(rate), subtotal: total }],
        // Seed quotation comparison
        quotations_compared: [
          { vendorName: vendors.find(v => v.id === selectedVendorId)?.name || 'Chosen Vendor', price: total, leadTime: '3 Days' },
          { vendorName: 'Alternative Logistics Ltd', price: total * 1.1, leadTime: '2 Days' }
        ]
      });
      setShowPOModal(false);
      setPOTitle('');
      setQty('');
      setRate('');
      loadProcurement();
    } catch (err) {
      alert('Error creating procurement request');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approvePO(id);
      loadProcurement();
    } catch (err: any) {
      alert(err.message || 'Error approving PO');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Procurement Desk</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Approve purchase requests, compare quotes, and issue vendor orders.</p>
        </div>

        {['Super Admin', 'Company Owner', 'Project Manager', 'Store Manager'].includes(role) && (
          <button
            onClick={() => setShowPOModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Raise Purchase Request
          </button>
        )}
      </div>

      {/* PO list */}
      <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          Active Purchase Orders
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-muted/60 animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-2">Purchase Title</th>
                  <th className="py-3 px-2">Supplier Vendor</th>
                  <th className="py-3 px-2 text-right">Order Value</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center">Quote Checks</th>
                  <th className="py-3 px-2 text-center">Workflow Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pos.map(po => {
                  const vendor = vendors.find(v => v.id === po.vendor_id);
                  return (
                    <tr key={po.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-4 px-2 font-bold text-foreground">{po.title}</td>
                      <td className="py-4 px-2 text-muted-foreground font-semibold">{vendor?.name || 'Tata Steel Hub'}</td>
                      <td className="py-4 px-2 text-right font-black text-foreground">₹{po.total_amount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          po.status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600' :
                          po.status === 'Pending Approval' ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-600 animate-pulse' :
                          'bg-blue-100 dark:bg-blue-950/20 text-blue-600'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        {po.quotations_compared.length > 0 ? (
                          <button
                            onClick={() => setActivePOCompare(po)}
                            className="text-[9px] font-extrabold uppercase bg-muted border border-border px-2 py-1 rounded hover:bg-muted/80 text-foreground"
                          >
                            Compare Prices
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">Direct PO</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {po.status === 'Pending Approval' ? (
                          ['Super Admin', 'Company Owner', 'Accountant'].includes(role) ? (
                            <button
                              onClick={() => handleApprove(po.id)}
                              className="text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-xl shadow-md transition-all flex items-center gap-1 mx-auto"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Approve Release
                            </button>
                          ) : (
                            <span className="text-[9px] text-muted-foreground font-medium italic flex items-center gap-1 justify-center">
                              <ShieldAlert className="w-3 h-3 text-amber-500" />
                              PM Auth required
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 justify-center">
                            ✓ Released
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote Comparison Modal Matrix */}
      {activePOCompare && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground">Supplier Quotation Matrix</h3>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Side-by-side comparison for: {activePOCompare.title}</p>
              </div>
              <button 
                onClick={() => setActivePOCompare(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold hover:bg-muted p-1 px-2 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {activePOCompare.quotations_compared.map((quote, i) => (
                <div key={i} className={`border rounded-xl p-4 flex flex-col justify-between ${
                  i === 0 ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' : 'bg-muted/10 border-border'
                }`}>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">Vendor Quote #{i+1}</span>
                      {i === 0 && (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                          L1 Least Price
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-foreground">{quote.vendorName}</h4>
                    <p className="text-xl font-black text-foreground mt-2">₹{quote.price.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="pt-3 border-t border-border/50 mt-4 flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>Est. Delivery:</span>
                    <span>{quote.leadTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Raise PO request Modal Popup */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Raise Purchase Request</h3>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Order Title</label>
                <input
                  type="text" required value={poTitle} onChange={e => setPOTitle(e.target.value)}
                  placeholder="e.g. Cement refilling order"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Supplier Vendor</label>
                  <select
                    value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Material Required</label>
                  <select
                    value={matName} onChange={e => setMatName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Cement">Cement</option>
                    <option value="Steel Rebar">Steel Rebar</option>
                    <option value="River Sand">River Sand</option>
                    <option value="Red Bricks">Red Bricks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Order Quantity</label>
                  <input
                    type="number" required value={qty} onChange={e => setQty(e.target.value)}
                    placeholder="Log count"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Per Unit Rate (₹)</label>
                  <input
                    type="number" required value={rate} onChange={e => setRate(e.target.value)}
                    placeholder="e.g. 390"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Submit PO Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
