import { Project, FinancialTransaction, Material, Labour } from '../utils/mockData';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Package, AlertTriangle, 
  Layers, CheckCircle, Clock, CalendarDays, DollarSign, FolderKanban 
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  financials: FinancialTransaction[];
  materials: Material[];
  labour: Labour[];
}

export default function Dashboard({ projects, financials, materials, labour }: DashboardProps) {
  // Aggregate Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const delayedProjects = projects.filter(p => p.status === 'Delayed').length;
  
  const totalExpenses = financials
    .filter(f => f.type === 'Expense')
    .reduce((s, x) => s + x.amount, 0);

  const totalIncome = financials
    .filter(f => f.type === 'Income')
    .reduce((s, x) => s + x.amount, 0);

  const profit = totalIncome - totalExpenses;
  const activeLabour = labour.filter(l => l.status === 'Active').length;
  const lowStockItems = materials.filter(m => m.stock_level < m.reorder_level).length;

  // Chart Data 1: Cash Flow (Area chart)
  const cashFlowData = [
    { name: 'Jan', Income: 1200000, Expense: 800000 },
    { name: 'Feb', Income: 1800000, Expense: 950000 },
    { name: 'Mar', Income: 1500000, Expense: 1100000 },
    { name: 'Apr', Income: 2200000, Expense: 1400000 },
    { name: 'May', Income: 3100000, Expense: 1850000 },
    { name: 'Jun', Income: totalIncome / 10, Expense: totalExpenses / 10 } // Scale for view
  ];

  // Chart Data 2: Expense Category breakups
  const categories = ['Labour', 'Material', 'Equipment', 'Transportation', 'Utilities', 'Miscellaneous'];
  const expenseData = categories.map(cat => {
    const sum = financials
      .filter(f => f.category === cat && f.type === 'Expense')
      .reduce((s, x) => s + x.amount, 0);
    return { name: cat, value: sum };
  }).filter(c => c.value > 0);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  // Chart Data 3: Site progress comparison
  const progressData = projects.map(p => ({
    name: p.name.substring(0, 10) + '..',
    Progress: p.progress_pct,
    Budget: p.budget / 1000000 // In Millions
  }));

  // Chart Data 4: Material Inventory stock check
  const inventoryData = materials.slice(0, 6).map(m => ({
    name: m.name + ` (${m.unit.substring(0,3)})`,
    Stock: m.stock_level,
    Reorder: m.reorder_level
  }));

  return (
    <div className="space-y-6 p-6 font-sans">
      
      {/* Page Title & Status Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">BuildFlow AI overview metrics and construction metrics tracker.</p>
        </div>
        <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-xl border border-border">
          <CalendarDays className="w-3.5 h-3.5" />
          Period: FY 2026-27 (Quarter 1)
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Projects Card */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Timeline</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-foreground">{activeProjects} <span className="text-xs text-muted-foreground font-medium">/ {totalProjects} Projects</span></h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500">
              <CheckCircle className="w-3 h-3" />
              <span>{delayedProjects} delayed currently</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Logged Expenses</span>
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-foreground">₹{totalExpenses.toLocaleString('en-IN')}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Direct material & wage ledger</span>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Allocated Capital</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-foreground">₹{totalIncome.toLocaleString('en-IN')}</h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500">
              <DollarSign className="w-3 h-3" />
              <span>Inward contract payouts</span>
            </div>
          </div>
        </div>

        {/* Active Labour Card */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Site Force</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-foreground">{activeLabour} <span className="text-xs text-muted-foreground font-medium">Workers</span></h4>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-500">
              <AlertTriangle className="w-3 h-3" />
              <span>{lowStockItems} low stock alerts</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Cash Flow (Area chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-xs font-bold text-foreground">Cash Flow Analysis (INR Scale)</h4>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Timeline track matching outward expenses against client inward billing.</p>
          </div>
          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expense breakups (Pie chart) */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-xs font-bold text-foreground">Expense Distribution</h4>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Budget consumption split by site operational tags.</p>
          </div>
          <div className="w-full h-64 mt-4 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute text-center">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Ledger total</span>
              <p className="text-sm font-black text-foreground">₹{(totalExpenses/1000).toFixed(0)}k</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {expenseData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[9px] font-bold text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Project Progress (Bar chart) */}
        <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-xs font-bold text-foreground">Site Progress Overview (%)</h4>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">AI estimated blueprint construction completeness rates.</p>
          </div>
          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Bar dataKey="Progress" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Progress < 40 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Inventory levels */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-xs font-bold text-foreground">Primary Stock Inventory vs Safety Marks</h4>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Stock level checking compared against reorder levels.</p>
          </div>
          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="Stock" fill="#3b82f6" name="Available Inventory" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reorder" fill="#ef4444" name="Reorder Alert Threshold" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
