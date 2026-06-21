import React, { useState, useEffect } from 'react';
import { Labour, Attendance, Project } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Users, UserPlus, QrCode, MapPin, CheckCircle, 
  Wallet, ShieldAlert, Award, FileText, ArrowRight, IndianRupee, Check 
} from 'lucide-react';

interface LabourProps {
  selectedProjectId: string;
  projects: Project[];
}

export default function LabourManager({ selectedProjectId }: LabourProps) {
  const { role } = useAuth();
  
  const [workers, setWorkers] = useState<Labour[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Hiring Form State
  const [showHireModal, setShowHireModal] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [workerSkill, setWorkerSkill] = useState('Mason');
  const [dailyWage, setDailyWage] = useState('');
  const [contractor, setContractor] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [phone, setPhone] = useState('');

  // Selfie / GPS simulator State
  const [activeCheckInWorker, setActiveCheckInWorker] = useState<Labour | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<'Present' | 'Absent' | 'Half Day'>('Present');
  
  // UPI QR simulation State
  const [activePayoutSlip, setActivePayoutSlip] = useState<any | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Load Data
  const loadLabourData = async () => {
    setLoading(true);
    try {
      const w = await api.getLabour();
      setWorkers(w);
      const att = await api.getAttendance(selectedProjectId);
      setAttendance(att);
      const pay = await api.getPayroll();
      setPayroll(pay);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabourData();
  }, [selectedProjectId]);

  // Handle Hire Action
  const handleHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName || !dailyWage || !aadhaar) return;

    // Basic Indian Aadhaar check (12 digits)
    if (aadhaar.length !== 12 || isNaN(Number(aadhaar))) {
      alert('Aadhaar number must be exactly 12 digits.');
      return;
    }

    try {
      await api.createLabour({
        name: workerName,
        skill: workerSkill,
        daily_wage: Number(dailyWage),
        contractor_name: contractor || 'Direct Payroll',
        aadhaar_number: aadhaar,
        contact_details: phone,
        photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
      });
      setShowHireModal(false);
      setWorkerName('');
      setDailyWage('');
      setContractor('');
      setAadhaar('');
      setPhone('');
      loadLabourData();
    } catch (err) {
      alert('Error hiring worker');
    }
  };

  // Submit Attendance check-in
  const triggerCheckInSubmit = async () => {
    if (!activeCheckInWorker) return;

    try {
      await api.markAttendance(selectedProjectId, {
        worker_id: activeCheckInWorker.id,
        date: new Date().toISOString().split('T')[0],
        status: checkInStatus as any,
        gps_lat: 17.4485,
        gps_lon: 78.3740,
        selfie_url: activeCheckInWorker.photo_url
      });
      setActiveCheckInWorker(null);
      loadLabourData();
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Payroll Slip
  const handleReleasePayroll = async (workerId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const pastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const slip = await api.generatePayroll(workerId, pastWeek, today, 'UPI');
      setActivePayoutSlip(slip);
      setShowQRModal(true);
      loadLabourData();
    } catch (err: any) {
      alert(err.message || 'Error processing payroll');
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Labour Force & UPI Payroll</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Track daily site logs, AI-verify check-in selfies, and release wage slips via BHIM UPI.</p>
        </div>

        {['Super Admin', 'Company Owner', 'Labour Supervisor'].includes(role) && (
          <button
            onClick={() => setShowHireModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Hire Site Worker
          </button>
        )}
      </div>

      {/* Workers Grid list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active roster column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Active Site Roster</h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted/60 animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {workers.map(w => {
                  const todayRecord = attendance.find(
                    a => a.worker_id === w.id && a.date === new Date().toISOString().split('T')[0]
                  );
                  return (
                    <div key={w.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <img 
                          src={w.photo_url} 
                          alt={w.name} 
                          className="w-10 h-10 rounded-full object-cover border border-border" 
                        />
                        <div>
                          <p className="text-xs font-bold text-foreground">{w.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{w.skill} • Daily: ₹{w.daily_wage} • {w.contractor_name}</p>
                        </div>
                      </div>

                      {/* Controls based on status */}
                      <div className="flex items-center gap-2">
                        {todayRecord ? (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            todayRecord.status === 'Present' ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600' : 'bg-slate-100 dark:bg-zinc-800 text-muted-foreground'
                          }`}>
                            {todayRecord.verified_by_ai && <Check className="w-3 h-3 text-emerald-600" />}
                            {todayRecord.status}
                          </span>
                        ) : (
                          ['Super Admin', 'Company Owner', 'Labour Supervisor', 'Site Engineer'].includes(role) && (
                            <button
                              onClick={() => {
                                setActiveCheckInWorker(w);
                                setCheckInStatus('Present');
                              }}
                              className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-xl font-bold hover:bg-primary/15 transition-all"
                            >
                              Check-In Log
                            </button>
                          )
                        )}

                        {/* Payroll pay trigger */}
                        {['Super Admin', 'Company Owner', 'Accountant'].includes(role) && (
                          <button
                            onClick={() => handleReleasePayroll(w.id)}
                            className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-bold hover:bg-emerald-500/15 transition-all"
                          >
                            Pay Slip
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Payroll History details */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1">
              <Wallet className="w-4 h-4 text-primary" />
              Recent Wage Settlements
            </h3>

            <div className="space-y-3">
              {payroll.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-[10px] font-medium border border-dashed border-border rounded-xl">
                  No payroll settlements logged this week.
                </div>
              ) : (
                payroll.slice().reverse().map(p => {
                  const worker = workers.find(w => w.id === p.worker_id);
                  return (
                    <div key={p.id} className="bg-muted/30 border border-border/60 rounded-xl p-3.5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-foreground">{worker?.name || 'Worker'}</p>
                          <p className="text-[9px] text-muted-foreground font-medium">{p.period_start} to {p.period_end}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-500">₹{p.total_paid}</span>
                      </div>
                      <div className="pt-1.5 border-t border-border/40 flex justify-between items-center text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Paid via {p.payment_mode}</span>
                        <span className="truncate max-w-[120px]" title={p.upi_transaction_id}>{p.upi_transaction_id}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Selfie GPS Attendance simulator Modal */}
      {activeCheckInWorker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-1">Check-in Photo Verification</h3>
            <p className="text-[10px] text-muted-foreground font-medium mb-4">Site coordinates: Hitec City Sector 5 (GPS verified)</p>

            <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-lg mb-4">
              <img 
                src={activeCheckInWorker.photo_url} 
                alt="Selfie Check-in" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center animate-pulse">
                <div className="border border-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[8px] text-emerald-400 font-extrabold tracking-widest uppercase">
                  Face Verified
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setCheckInStatus('Present')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    checkInStatus === 'Present' ? 'bg-primary text-white' : 'bg-muted text-foreground'
                  }`}
                >
                  Present
                </button>
                <button
                  onClick={() => setCheckInStatus('Half Day')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    checkInStatus === 'Half Day' ? 'bg-primary text-white' : 'bg-muted text-foreground'
                  }`}
                >
                  Half Day
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button" onClick={() => setActiveCheckInWorker(null)}
                  className="flex-1 px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={triggerCheckInSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Log Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Indian UPI QR Payout Modal */}
      {showQRModal && activePayoutSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-foreground">BHIM UPI Instant Settlement</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Scan QR to release wage amount to {workers.find(w => w.id === activePayoutSlip.worker_id)?.name}</p>
            </div>

            {/* Simulated UPI QR Code Frame */}
            <div className="w-48 h-48 bg-white border border-border rounded-2xl p-3 mx-auto flex items-center justify-center relative group">
              <QrCode className="w-full h-full text-zinc-950" />
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <span className="text-[8px] font-black text-primary tracking-widest uppercase">UPI Payload Link</span>
                <span className="text-[8px] font-medium text-zinc-500 select-all max-w-[140px] truncate">
                  upi://pay?pa=worker@upi&pn=Worker&am={activePayoutSlip.total_paid}&cu=INR
                </span>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-3 flex items-center gap-2.5 justify-center">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-bold">UPI Wage Generated Successfully</p>
                <p className="text-[9px] font-medium opacity-90">Payout reference: {activePayoutSlip.upi_transaction_id}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowQRModal(false);
                setActivePayoutSlip(null);
              }}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 py-2.5 rounded-xl font-bold text-xs shadow-md"
            >
              Done / Mark Settled
            </button>
          </div>
        </div>
      )}

      {/* Hiring Worker Modal Popup */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Hire New Site Worker</h3>
            <form onSubmit={handleHire} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Worker Name</label>
                  <input
                    type="text" required value={workerName} onChange={e => setWorkerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Worker Skill</label>
                  <select
                    value={workerSkill} onChange={e => setWorkerSkill(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Mason">Mason</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Welder">Welder</option>
                    <option value="Helper">Helper</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Daily Wage (₹)</label>
                  <input
                    type="number" required value={dailyWage} onChange={e => setDailyWage(e.target.value)}
                    placeholder="e.g. 750"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Aadhaar Card ID</label>
                  <input
                    type="text" required value={aadhaar} onChange={e => setAadhaar(e.target.value)}
                    placeholder="12-digit Aadhaar ID"
                    maxLength={12}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Contact Number</label>
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="Mobile number"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Labour Agency / Contractor</label>
                  <input
                    type="text" value={contractor} onChange={e => setContractor(e.target.value)}
                    placeholder="Agency Name (Optional)"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowHireModal(false)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
                >
                  Hire Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
