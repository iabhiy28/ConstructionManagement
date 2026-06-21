import React, { useState, useEffect } from 'react';
import { Equipment } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Truck, ShieldAlert, CheckCircle, Wrench, Fuel } from 'lucide-react';

export default function EquipmentManagement() {
  const { role } = useAuth();
  
  const [machinery, setMachinery] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  // Maintenance form state
  const [activeMachine, setActiveMachine] = useState<Equipment | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'Healthy' | 'Under Service' | 'Breakdown'>('Healthy');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [logDetails, setLogDetails] = useState('');

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipment();
      setMachinery(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const handleMaintenanceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMachine) return;

    try {
      await api.updateEquipment(activeMachine.id, {
        status: selectedStatus,
        fuel_consumed: fuelConsumed ? Number(fuelConsumed) : 0,
        log: logDetails || undefined
      });
      setActiveMachine(null);
      setFuelConsumed('');
      setLogDetails('');
      loadEquipment();
    } catch (err) {
      alert('Error updating equipment logs');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Heavy Machinery & Equipment</h2>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Monitor excavator run-times, JCB diesel usage, and schedule routine maintenance checks.</p>
      </div>

      {/* Machinery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map(i => <div key={i} className="h-44 rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {machinery.map(eq => (
            <div key={eq.id} className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Truck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{eq.name}</h4>
                    <p className="text-[9px] text-muted-foreground font-bold">{eq.brand} • {eq.model}</p>
                  </div>
                </div>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  eq.maintenance_status === 'Healthy' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600' :
                  eq.maintenance_status === 'Breakdown' ? 'bg-red-100 dark:bg-red-950/20 text-red-600 animate-pulse' :
                  'bg-amber-100 dark:bg-amber-950/20 text-amber-600'
                }`}>
                  {eq.maintenance_status}
                </span>
              </div>

              {/* Status details bar */}
              <div className="grid grid-cols-3 gap-2 text-center bg-muted/20 border border-border/40 rounded-xl p-3">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Hours Logged</p>
                  <p className="text-xs font-black text-foreground">{eq.utilization_hours}h</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Fuel Used</p>
                  <p className="text-xs font-black text-foreground flex items-center justify-center gap-0.5">
                    <Fuel className="w-3.5 h-3.5 text-muted-foreground" />
                    {eq.fuel_consumption}L
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Next Service</p>
                  <p className="text-[10px] font-extrabold text-foreground">{eq.next_service_date}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">
                  Service state: {eq.maintenance_status === 'Healthy' ? 'Operational' : 'Service Queue'}
                </span>
                
                {['Super Admin', 'Company Owner', 'Site Engineer'].includes(role) && (
                  <button
                    onClick={() => {
                      setActiveMachine(eq);
                      setSelectedStatus(eq.maintenance_status);
                    }}
                    className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/15 transition-all flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Log Maintenance
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Maintenance Update Modal */}
      {activeMachine && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Log Maintenance Update</h3>
            <form onSubmit={handleMaintenanceUpdate} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-foreground">Equipment: {activeMachine.name}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">Model: {activeMachine.brand} {activeMachine.model}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Health Status</label>
                  <select
                    value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Healthy">Healthy (Operational)</option>
                    <option value="Under Service">Under Service (Routine Check)</option>
                    <option value="Breakdown">Breakdown (Repair Required)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Refuel Amount (Litres)</label>
                  <input
                    type="number" value={fuelConsumed} onChange={e => setFuelConsumed(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Breakdown log details</label>
                <input
                  type="text" value={logDetails} onChange={e => setLogDetails(e.target.value)}
                  placeholder="e.g. Hose refit, oil filter cleaning"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => setActiveMachine(null)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Update Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
