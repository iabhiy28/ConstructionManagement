import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import RoleSwitcher from './components/RoleSwitcher';
import AIChatbot from './components/AIChatbot';
import api from './utils/api';
import { Project, FinancialTransaction, Material, Labour } from './utils/mockData';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import LabourManager from './pages/Labour';
import MaterialsInventory from './pages/Materials';
import ProcurementPortal from './pages/Procurement';
import Vendors from './pages/Vendors';
import EquipmentManagement from './pages/Equipment';
import Financials from './pages/Financials';
import DocumentOCR from './pages/Documents';
import BillingPortal from './pages/Billing';

export default function App() {
  const { user, role, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Shared metric states for graphs
  const [financials, setFinancials] = useState<FinancialTransaction[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [labour, setLabour] = useState<Labour[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load active projects on launch
  const loadProjectsList = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGeneralStats = async () => {
    if (!selectedProjectId) return;
    setLoadingData(true);
    try {
      const fin = await api.getFinancials();
      setFinancials(fin.filter(f => f.project_id === selectedProjectId));
      const mat = await api.getMaterials(selectedProjectId);
      setMaterials(mat);
      const lab = await api.getLabour();
      setLabour(lab);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadProjectsList();
  }, [user]);

  useEffect(() => {
    loadGeneralStats();
  }, [selectedProjectId, activePage]);

  // Adjust active view if role lacks permission
  useEffect(() => {
    const roleRoutes: Record<string, string[]> = {
      'Super Admin': ['dashboard', 'projects', 'labour', 'materials', 'procurement', 'equipment', 'financials', 'documents', 'billing'],
      'Company Owner': ['dashboard', 'projects', 'labour', 'materials', 'procurement', 'equipment', 'financials', 'documents', 'billing'],
      'Project Manager': ['dashboard', 'projects', 'labour', 'materials', 'procurement', 'equipment', 'financials', 'documents'],
      'Site Engineer': ['dashboard', 'projects', 'labour', 'materials', 'equipment', 'documents'],
      'Accountant': ['dashboard', 'labour', 'procurement', 'financials', 'documents'],
      'Store Manager': ['dashboard', 'materials', 'procurement'],
      'Contractor': ['dashboard', 'projects'],
      'Vendor': ['dashboard', 'procurement'],
      'Labour Supervisor': ['dashboard', 'labour']
    };

    const allowed = roleRoutes[role] || ['dashboard'];
    if (!allowed.includes(activePage)) {
      setActivePage(allowed[0]);
    }
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Initializing BuildFlow AI ERP...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard projects={projects} financials={financials} materials={materials} labour={labour} />;
      case 'projects':
        return <Projects projects={projects} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} onRefreshProjects={loadProjectsList} />;
      case 'labour':
        return <LabourManager selectedProjectId={selectedProjectId} projects={projects} />;
      case 'materials':
        return <MaterialsInventory selectedProjectId={selectedProjectId} />;
      case 'procurement':
        return <ProcurementPortal selectedProjectId={selectedProjectId} />;
      case 'vendors':
        return <Vendors />;
      case 'equipment':
        return <EquipmentManagement />;
      case 'financials':
        return <Financials selectedProjectId={selectedProjectId} projects={projects} />;
      case 'documents':
        return <DocumentOCR selectedProjectId={selectedProjectId} />;
      case 'billing':
        return <BillingPortal />;
      default:
        return <Dashboard projects={projects} financials={financials} materials={materials} labour={labour} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex transition-colors duration-200">
      
      {/* Sidebar Panel */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header toolbar */}
        <Header 
          projects={projects} 
          selectedProjectId={selectedProjectId} 
          setSelectedProjectId={setSelectedProjectId} 
        />

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/20">
          {renderContent()}
        </main>
      </div>

      {/* Floating Interactive Simulations Helpers */}
      <RoleSwitcher />
      <AIChatbot />

    </div>
  );
}
