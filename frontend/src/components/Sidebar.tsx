import { LayoutDashboard, FolderKanban, Users2, Package, ShoppingCart, Truck, IndianRupee, ShieldAlert, FileText, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const { role, logout, user } = useAuth();

  // Navigation Items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Site Engineer', 'Accountant', 'Store Manager', 'Contractor', 'Labour Supervisor'] },
    { id: 'projects', label: 'Projects', icon: FolderKanban, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Site Engineer', 'Contractor'] },
    { id: 'labour', label: 'Labour & Payroll', icon: Users2, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Site Engineer', 'Accountant', 'Labour Supervisor'] },
    { id: 'materials', label: 'Materials', icon: Package, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Site Engineer', 'Store Manager'] },
    { id: 'procurement', label: 'Procurement', icon: ShoppingCart, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Accountant', 'Store Manager', 'Vendor'] },
    { id: 'equipment', label: 'Equipment', icon: Truck, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Site Engineer'] },
    { id: 'financials', label: 'Financial Ledger', icon: IndianRupee, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Accountant'] },
    { id: 'documents', label: 'Documents OCR', icon: FileText, roles: ['Super Admin', 'Company Owner', 'Project Manager', 'Site Engineer', 'Accountant'] },
    { id: 'billing', label: 'SaaS Billing', icon: CreditCard, roles: ['Super Admin', 'Company Owner'] }
  ];

  // Filter items by role permission (RBAC)
  const allowedItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-border bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-screen font-sans">
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-extrabold text-base tracking-tighter">B</span>
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-tight text-foreground">BuildFlow AI</h1>
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">ERP platform</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {allowedItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-border bg-muted/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center font-bold text-primary text-sm shadow-sm">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-foreground truncate">{user?.name || 'Anonymous User'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{role}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-destructive/5 hover:bg-destructive/10 text-destructive border border-destructive/15 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
