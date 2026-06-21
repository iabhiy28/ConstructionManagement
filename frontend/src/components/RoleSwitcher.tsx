import { useAuth, UserRole } from '../context/AuthContext';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function RoleSwitcher() {
  const { role, switchRole, apiMode, toggleApiMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roles: UserRole[] = [
    'Company Owner',
    'Project Manager',
    'Site Engineer',
    'Accountant',
    'Store Manager',
    'Contractor',
    'Vendor',
    'Labour Supervisor'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 font-sans">
      {/* DB Connection Mode Switcher */}
      <button
        onClick={toggleApiMode}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-300 border flex items-center gap-1.5 ${
          apiMode === 'api'
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25 pulse-glow'
            : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${apiMode === 'api' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        DB: {apiMode.toUpperCase()}
      </button>

      {/* Role Selector Trigger */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xl font-medium text-xs tracking-wide uppercase transition-all duration-200 border border-zinc-800 dark:border-zinc-200"
        >
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Role: {role}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-12 right-0 w-52 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl overflow-hidden py-1 transition-all duration-200 animate-in slide-in-from-bottom-2">
            <div className="px-3 py-2 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Simulation Portal
            </div>
            <div className="max-h-60 overflow-y-auto">
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs transition-colors duration-150 flex items-center justify-between ${
                    role === r
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {r}
                  {role === r && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
