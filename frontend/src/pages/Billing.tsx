import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, QrCode, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export default function BillingPortal() {
  const { role } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<'Growth' | 'Enterprise' | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);

  const plans = [
    {
      name: 'Starter Trial',
      price: '₹0',
      description: 'Ideal for single site contractors starting digitization.',
      features: ['1 Active Project', 'Up to 5 Labour check-ins', 'Basic inventory levels', 'Local Excel exports'],
      action: 'Current Free Tier',
      enabled: false
    },
    {
      name: 'Enterprise Growth',
      price: '₹4,999',
      period: '/ month',
      description: 'Optimized for small-to-medium builders managing multiple sites.',
      features: ['Up to 5 Active Projects', 'Selfie GPS Attendance Log', 'AI Chatbot Assistant integration', 'Quotation comparison matrixes', 'WhatsApp updates notifications'],
      action: 'Upgrade to Growth',
      enabled: true,
      planId: 'Growth' as const
    },
    {
      name: 'Developer Enterprise',
      price: '₹14,999',
      period: '/ month',
      description: 'Complete ERP package for infrastructure firms and large developers.',
      features: ['Unlimited Active Projects', 'Full REST API capabilities', 'AI Document OCR reading', 'Automatic UPI payroll dispatching', 'Audit logs trails & Soft Delete indexing', 'Dedicated account manager Support'],
      action: 'Upgrade to Enterprise',
      enabled: true,
      planId: 'Enterprise' as const
    }
  ];

  const handleUpgradeSelect = (planId: 'Growth' | 'Enterprise') => {
    setSelectedPlan(planId);
    setShowQR(true);
  };

  const handlePaySuccess = () => {
    setShowQR(false);
    setIsUpgraded(true);
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">SaaS Subscription & Billing</h2>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Select a subscription tier, inspect billing history, and configure payment gateways.</p>
      </div>

      {/* Upgraded banner */}
      {isUpgraded && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl p-4 flex items-start gap-3 animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <div>
            <p className="text-xs font-bold">Subscription Upgrade Complete!</p>
            <p className="text-[10px] opacity-90 mt-0.5 leading-relaxed font-medium">
              Your company has been successfully upgraded to the **{selectedPlan}** plan tier. All premium modules are now active.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(p => (
          <div key={p.name} className={`bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 ${
            p.name.includes('Growth') ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.01]' : 'border-border'
          }`}>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-foreground">{p.name}</h4>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed">{p.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground">{p.price}</span>
                {p.period && <span className="text-xs text-muted-foreground font-medium">{p.period}</span>}
              </div>

              <ul className="space-y-2.5 pt-2">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[10px] font-bold text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {p.enabled ? (
              <button
                onClick={() => handleUpgradeSelect(p.planId!)}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all"
              >
                {p.action}
              </button>
            ) : (
              <button
                disabled
                className="w-full border border-border text-muted-foreground font-bold text-xs py-2.5 rounded-xl cursor-not-allowed text-center bg-muted/20"
              >
                {p.action}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* UPI QR Payment Modal Popup */}
      {showQR && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-foreground">Complete Subscription Payout</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Scan code using GPay, PhonePe, or BHIM to pay ₹{selectedPlan === 'Growth' ? '4,999' : '14,999'}</p>
            </div>

            <div className="w-44 h-44 bg-white border border-border rounded-xl p-2 mx-auto flex items-center justify-center relative group">
              <QrCode className="w-full h-full text-zinc-950" />
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black text-primary uppercase">UPI Deeplink</span>
                <span className="text-[8px] font-medium text-zinc-500 truncate max-w-[125px] select-all">
                  upi://pay?pa=buildflow@upi&pn=BuildFlowAI&am={selectedPlan === 'Growth' ? '4999' : '14999'}&cu=INR
                </span>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 text-primary rounded-xl p-3 flex items-center gap-2.5 justify-center">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <div className="text-left text-[10px] font-bold">
                <p>NPCI Secure Payment Gate</p>
                <p className="font-medium opacity-90">Auto upgrade will release instantly on transfer receipt.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowQR(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handlePaySuccess}
                className="flex-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
