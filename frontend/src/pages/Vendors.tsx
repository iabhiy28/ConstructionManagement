import React, { useState, useEffect } from 'react';
import { Vendor } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Star, ShieldCheck, Mail, Phone, Plus, Store } from 'lucide-react';

export default function Vendors() {
  const { role } = useAuth();
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);

  // New Vendor Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [productText, setProductText] = useState('');

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await api.getVendors();
      setVendors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !gstin) return;

    // GSTIN format checker: 15 characters (Standard Indian GSTIN formatting)
    if (gstin.length !== 15) {
      alert('GSTIN number must be exactly 15 characters.');
      return;
    }

    try {
      await api.createVendor({
        name,
        phone,
        email,
        gstin,
        products: productText.split(',').map(p => p.trim())
      });
      setShowAddVendor(false);
      setName('');
      setPhone('');
      setEmail('');
      setGstin('');
      setProductText('');
      loadVendors();
    } catch (err) {
      alert('Error registering supplier');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Suppliers & Vendors</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Manage building material dealers, monitor GST status, and track delivery ratings.</p>
        </div>

        {['Super Admin', 'Company Owner', 'Project Manager', 'Store Manager'].includes(role) && (
          <button
            onClick={() => setShowAddVendor(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Register Supplier
          </button>
        )}
      </div>

      {/* Vendors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vendors.map(v => (
            <div key={v.id} className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{v.name}</h4>
                  </div>
                  <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[9px] font-black">
                    <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                    {v.ratings}
                  </div>
                </div>

                <div className="space-y-1.5 text-[10px] font-bold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{v.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{v.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-foreground font-black">{v.gstin}</span>
                    <span className="bg-emerald-500/10 text-emerald-600 text-[8px] px-1 rounded">GSTIN Active</span>
                  </div>
                </div>
              </div>

              {/* Product catalog tags */}
              <div className="pt-3 border-t border-border flex flex-wrap gap-1.5">
                {v.products.map(p => (
                  <span key={p} className="bg-muted text-foreground text-[8px] font-extrabold uppercase px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Supplier Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Register Supplier</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Supplier Company Name</label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. UltraTech Dealer Ltd"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Phone Number</label>
                  <input
                    type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="Contact number"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Work Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="sales@supplier.in"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">GSTIN Identification ID</label>
                  <input
                    type="text" required value={gstin} onChange={e => setGstin(e.target.value)}
                    placeholder="15-digit GSTIN ID"
                    maxLength={15}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Catalogs (Comma-separated)</label>
                  <input
                    type="text" value={productText} onChange={e => setProductText(e.target.value)}
                    placeholder="Cement, Sand, Brick"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowAddVendor(false)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Register Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
