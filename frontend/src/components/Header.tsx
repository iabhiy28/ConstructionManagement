import { Sun, Moon, Bell, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Project } from '../utils/mockData';
import { useState } from 'react';

interface HeaderProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}

export default function Header({ projects, selectedProjectId, setSelectedProjectId }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { role } = useAuth();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Dynamic system notifications based on preseeded state data
  const notifications = [
    { id: 1, title: 'Low Inventory Alert', desc: 'Ganga Heights: Cement count is critical (80 bags).', time: '10m ago', type: 'warning' },
    { id: 2, title: 'Approval Required', desc: 'PO #1043 Tata Tiscon Steel Hub is pending validation.', time: '1h ago', type: 'info' },
    { id: 3, title: 'Schedule Delay Detected', desc: 'Ganga Heights: rebar bending is blocked.', time: '2h ago', type: 'error' }
  ];

  return (
    <header className="h-16 border-b border-border bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-6 flex items-center justify-between font-sans relative z-40">
      {/* Project Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Site:</span>
        <div className="relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-xl border border-border bg-background shadow-sm transition-all duration-200"
          >
            <span className="text-xs font-bold">{selectedProject?.name || 'Select Project'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute top-10 left-0 w-64 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in-50 slide-in-from-top-1">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors duration-150 flex items-center justify-between ${
                    selectedProjectId === p.id
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{p.address}</p>
                  </div>
                  {selectedProjectId === p.id && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Tools Header Actions */}
      <div className="flex items-center gap-4">
        {/* Connection status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/20 text-[10px] font-bold text-muted-foreground">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          System: Online
        </div>

        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl border border-border bg-background shadow-sm transition-colors"
          title="Toggle Color Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications Center Bell */}
        <div className="relative">
          <button
            onClick={() => setIsAlertOpen(!isAlertOpen)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-xl border border-border bg-background shadow-sm transition-colors relative"
            title="System alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full border border-background animate-ping" />
          </button>

          {isAlertOpen && (
            <div className="absolute top-10 right-0 w-80 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in-50 slide-in-from-top-1">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/10">
                <span className="text-xs font-bold text-foreground">Notifications</span>
                <span className="text-[10px] font-extrabold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">3 Alerts</span>
              </div>
              <div className="divide-y divide-border">
                {notifications.map(n => (
                  <div key={n.id} className="p-3.5 hover:bg-muted/40 transition-colors text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-bold ${
                        n.type === 'error' ? 'text-destructive' : n.type === 'warning' ? 'text-amber-500' : 'text-primary'
                      }`}>{n.title}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
