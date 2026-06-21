import { localDb, Project, Task, Labour, Attendance, Material, Vendor, PurchaseOrder, Equipment, FinancialTransaction, SiteUpdate, Document } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API Mode Switch: 'mock' uses localDb (localStorage), 'api' calls the local Node server
let apiMode: 'mock' | 'api' = 'mock';

// Detect if server is running by attempting a health check
export async function detectApiMode() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) {
      apiMode = 'api';
      console.log('BuildFlow AI: Live API server detected! Switching to Live API mode.');
    }
  } catch {
    apiMode = 'mock';
    console.log('BuildFlow AI: Live API server offline. Using Local Mock database mode.');
  }
}

// Automatically detect mode on load
detectApiMode();

export function getApiMode() {
  return apiMode;
}

export function setApiMode(mode: 'mock' | 'api') {
  apiMode = mode;
}

// Request Helper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('buildflow_token');
  const role = localStorage.getItem('buildflow_role') || 'Company Owner';
  const userId = localStorage.getItem('buildflow_user_id') || 'u1';

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'x-bypass-auth': 'true',
    'x-mock-role': role,
    'x-mock-user-id': userId,
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Server request failed.');
  }

  return response.json();
}

export const api = {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  login: async (email: string, password?: string, isOtp?: boolean, otp?: string) => {
    if (apiMode === 'api') {
      return request<{ token: string; user: { id: string; name: string; email: string; role: string; companyId: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, isOtp, otp })
      });
    } else {
      // Mock Login
      if (isOtp && otp !== '123456') {
        throw new Error('Invalid verification OTP code. Try 123456.');
      }
      if (!isOtp && password !== 'admin123' && password !== 'owner') {
        throw new Error('Incorrect credentials password. Try admin123.');
      }
      
      const user = {
        id: 'u1',
        name: 'Rajesh Sharma',
        email: email,
        role: email.includes('pm') ? 'Project Manager' : email.includes('engineer') ? 'Site Engineer' : email.includes('accountant') ? 'Accountant' : 'Company Owner',
        companyId: 'c1'
      };
      
      localStorage.setItem('buildflow_token', 'mock-jwt-token-xyz');
      localStorage.setItem('buildflow_role', user.role);
      localStorage.setItem('buildflow_user_id', user.id);
      
      return { token: 'mock-jwt-token-xyz', user };
    }
  },

  signup: async (companyName: string, gstin: string, name: string, email: string, password: string, role: string) => {
    if (apiMode === 'api') {
      return request<{ token: string; user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ companyName, gstin, name, email, password, role })
      });
    } else {
      const user = { id: 'u_new', name, email, role: role || 'Company Owner', companyId: 'c_new' };
      localStorage.setItem('buildflow_token', 'mock-jwt-token-xyz');
      localStorage.setItem('buildflow_role', user.role);
      localStorage.setItem('buildflow_user_id', user.id);
      return { token: 'mock-jwt-token-xyz', user };
    }
  },

  sendOtp: async (phone: string) => {
    if (apiMode === 'api') {
      return request<any>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
    } else {
      return { success: true, message: `OTP verification code sent to ${phone}. Enter '123456' to log in.` };
    }
  },

  // ==========================================
  // PROJECTS
  // ==========================================
  getProjects: async (): Promise<Project[]> => {
    if (apiMode === 'api') {
      return request<Project[]>('/projects');
    } else {
      return localDb.getProjects();
    }
  },

  createProject: async (project: Omit<Project, 'id' | 'progress_pct'>): Promise<Project> => {
    if (apiMode === 'api') {
      return request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(project)
      });
    } else {
      const list = localDb.getProjects();
      const newProj: Project = {
        ...project,
        id: 'p' + (list.length + 1),
        progress_pct: 0
      };
      localDb.setProjects([...list, newProj]);

      // Seed materials for the project in mock DB too
      const mats = localDb.getMaterials();
      localDb.setMaterials([
        ...mats,
        { id: `m_new_${newProj.id}_1`, project_id: newProj.id, name: 'Cement', stock_level: 0, unit: 'Bags', reorder_level: 100 },
        { id: `m_new_${newProj.id}_2`, project_id: newProj.id, name: 'Steel Rebar', stock_level: 0, unit: 'Tons', reorder_level: 5 },
        { id: `m_new_${newProj.id}_3`, project_id: newProj.id, name: 'River Sand', stock_level: 0, unit: 'Brass', reorder_level: 10 }
      ]);

      // Seed finance capital entry
      const finances = localDb.getFinancials();
      localDb.setFinancials([
        ...finances,
        {
          id: 'f_seed_' + newProj.id,
          project_id: newProj.id,
          category: 'Miscellaneous',
          amount: newProj.budget,
          type: 'Income',
          description: 'Initial Project Allocated Capital',
          transaction_date: newProj.start_date,
          reference_id: 'ALLOCATED-CAPITAL'
        }
      ]);

      return newProj;
    }
  },

  // ==========================================
  // KANBAN TASKS
  // ==========================================
  getTasks: async (projectId: string): Promise<Task[]> => {
    if (apiMode === 'api') {
      return request<Task[]>(`/projects/${projectId}/tasks`);
    } else {
      return localDb.getTasks().filter(t => t.project_id === projectId);
    }
  },

  createTask: async (projectId: string, task: Omit<Task, 'id' | 'project_id' | 'comments' | 'attachments'>): Promise<Task> => {
    if (apiMode === 'api') {
      return request<Task>(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task)
      });
    } else {
      const list = localDb.getTasks();
      const newTask: Task = {
        ...task,
        id: 't' + (list.length + 1),
        project_id: projectId,
        attachments: [],
        comments: []
      };
      localDb.setTasks([...list, newTask]);
      return newTask;
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    if (apiMode === 'api') {
      return request<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } else {
      const list = localDb.getTasks();
      const idx = list.findIndex(t => t.id === taskId);
      if (idx === -1) throw new Error('Task not found');
      list[idx] = { ...list[idx], ...updates };
      localDb.setTasks(list);
      return list[idx];
    }
  },

  // ==========================================
  // LABOUR & ATTENDANCE
  // ==========================================
  getLabour: async (): Promise<Labour[]> => {
    if (apiMode === 'api') {
      return request<Labour[]>('/labour');
    } else {
      return localDb.getLabour();
    }
  },

  createLabour: async (worker: Omit<Labour, 'id' | 'status'>): Promise<Labour> => {
    if (apiMode === 'api') {
      return request<Labour>('/labour', {
        method: 'POST',
        body: JSON.stringify(worker)
      });
    } else {
      const list = localDb.getLabour();
      const newWorker: Labour = {
        ...worker,
        id: 'l' + (list.length + 1),
        status: 'Active'
      };
      localDb.setLabour([...list, newWorker]);
      return newWorker;
    }
  },

  getAttendance: async (projectId: string): Promise<Attendance[]> => {
    if (apiMode === 'api') {
      return request<Attendance[]>(`/projects/${projectId}/attendance`);
    } else {
      return localDb.getAttendance().filter(a => a.project_id === projectId);
    }
  },

  markAttendance: async (projectId: string, record: Omit<Attendance, 'id' | 'project_id' | 'verified_by_ai' | 'check_in_time'>): Promise<Attendance> => {
    if (apiMode === 'api') {
      return request<Attendance>(`/projects/${projectId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(record)
      });
    } else {
      const list = localDb.getAttendance();
      const verified_by_ai = record.status === 'Present';
      const check_in_time = record.status === 'Present' ? new Date().toISOString() : '';
      
      const newRecord: Attendance = {
        ...record,
        id: 'a' + (list.length + 1),
        project_id: projectId,
        check_in_time,
        verified_by_ai
      };
      
      // Filter out double check-ins on same day
      const filtered = list.filter(a => !(a.worker_id === record.worker_id && a.date === record.date));
      localDb.setAttendance([...filtered, newRecord]);
      return newRecord;
    }
  },

  // ==========================================
  // PAYROLL SYSTEM
  // ==========================================
  getPayroll: async (): Promise<any[]> => {
    if (apiMode === 'api') {
      return request<any[]>('/payroll');
    } else {
      // Local simulated payroll slips
      const pay = localStorage.getItem('buildflow_payroll_slips');
      return pay ? JSON.parse(pay) : [];
    }
  },

  generatePayroll: async (workerId: string, start: string, end: string, mode: 'UPI' | 'Bank Transfer' | 'Cash'): Promise<any> => {
    if (apiMode === 'api') {
      return request<any>('/payroll/generate', {
        method: 'POST',
        body: JSON.stringify({ worker_id: workerId, period_start: start, period_end: end, payment_mode: mode })
      });
    } else {
      const workers = localDb.getLabour();
      const worker = workers.find(w => w.id === workerId);
      if (!worker) throw new Error('Worker not found');

      const attendance = localDb.getAttendance();
      const days = attendance.filter(a => a.worker_id === workerId && a.date >= start && a.date <= end && a.status === 'Present').length;
      
      const basePay = days * worker.daily_wage;
      const totalPaid = basePay;
      const upiTxnId = mode === 'UPI' ? `TXN-UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}` : 'BANK-NEFT-9923';

      const slip = {
        id: 'pay_' + Date.now(),
        worker_id: workerId,
        base_pay: basePay,
        overtime_pay: 0,
        deductions: 0,
        total_paid: totalPaid,
        period_start: start,
        period_end: end,
        status: 'Paid',
        payment_mode: mode,
        upi_transaction_id: upiTxnId
      };

      const pay = localStorage.getItem('buildflow_payroll_slips');
      const currentPayrolls = pay ? JSON.parse(pay) : [];
      currentPayrolls.push(slip);
      localStorage.setItem('buildflow_payroll_slips', JSON.stringify(currentPayrolls));

      // Append to local ledger too
      const financials = localDb.getFinancials();
      localDb.setFinancials([
        ...financials,
        {
          id: 'f_pay_' + slip.id,
          project_id: 'p1', // Default to site 1 for demo dashboard tracking
          category: 'Labour',
          amount: totalPaid,
          type: 'Expense',
          description: `Salary release: ${worker.name} (${start} to ${end})`,
          transaction_date: new Date().toISOString().split('T')[0],
          reference_id: upiTxnId
        }
      ]);

      return slip;
    }
  },

  // ==========================================
  // MATERIALS & PROCUREMENT
  // ==========================================
  getMaterials: async (projectId: string): Promise<Material[]> => {
    if (apiMode === 'api') {
      return request<Material[]>(`/projects/${projectId}/materials`);
    } else {
      return localDb.getMaterials().filter(m => m.project_id === projectId);
    }
  },

  logMaterialTransaction: async (materialId: string, quantity: number, type: 'Inward' | 'Outward', notes?: string) => {
    if (apiMode === 'api') {
      return request<any>('/materials/transaction', {
        method: 'POST',
        body: JSON.stringify({ material_id: materialId, quantity, type, notes })
      });
    } else {
      const list = localDb.getMaterials();
      const idx = list.findIndex(m => m.id === materialId);
      if (idx === -1) throw new Error('Material not found');

      if (type === 'Inward') {
        list[idx].stock_level += quantity;
      } else {
        list[idx].stock_level = Math.max(0, list[idx].stock_level - quantity);
      }
      
      localDb.setMaterials(list);

      // Financial record
      if (type === 'Inward' && notes?.includes('Cash Purchase')) {
        const financials = localDb.getFinancials();
        localDb.setFinancials([
          ...financials,
          {
            id: 'f_mat_' + Date.now(),
            project_id: list[idx].project_id,
            category: 'Material',
            amount: quantity * 400,
            type: 'Expense',
            description: `Cash Purchase: ${list[idx].name} x ${quantity}`,
            transaction_date: new Date().toISOString().split('T')[0],
            reference_id: 'CASH-MATERIAL'
          }
        ]);
      }

      return { material: list[idx] };
    }
  },

  getVendors: async (): Promise<Vendor[]> => {
    if (apiMode === 'api') {
      return request<Vendor[]>('/vendors');
    } else {
      return localDb.getVendors();
    }
  },

  createVendor: async (vendor: Omit<Vendor, 'id' | 'ratings' | 'performance_analysis'>): Promise<Vendor> => {
    if (apiMode === 'api') {
      return request<Vendor>('/vendors', {
        method: 'POST',
        body: JSON.stringify(vendor)
      });
    } else {
      const list = localDb.getVendors();
      const newVendor: Vendor = {
        ...vendor,
        id: 'v' + (list.length + 1),
        ratings: 5.0,
        performance_analysis: { delivery_rate: '100%', compliance: 'High' }
      };
      localDb.setVendors([...list, newVendor]);
      return newVendor;
    }
  },

  getPOs: async (): Promise<PurchaseOrder[]> => {
    if (apiMode === 'api') {
      return request<PurchaseOrder[]>('/procurement');
    } else {
      return localDb.getPOs();
    }
  },

  createPO: async (po: Omit<PurchaseOrder, 'id' | 'status' | 'invoice_url' | 'created_at'>): Promise<PurchaseOrder> => {
    if (apiMode === 'api') {
      return request<PurchaseOrder>('/procurement', {
        method: 'POST',
        body: JSON.stringify(po)
      });
    } else {
      const list = localDb.getPOs();
      const newPO: PurchaseOrder = {
        ...po,
        id: 'po' + (list.length + 1),
        status: 'Pending Approval',
        invoice_url: '',
        created_at: new Date().toISOString()
      };
      localDb.setPOs([...list, newPO]);
      return newPO;
    }
  },

  approvePO: async (poId: string): Promise<PurchaseOrder> => {
    if (apiMode === 'api') {
      return request<PurchaseOrder>(`/procurement/${poId}/approve`, { method: 'PATCH' });
    } else {
      const list = localDb.getPOs();
      const idx = list.findIndex(p => p.id === poId);
      if (idx === -1) throw new Error('PO not found');

      list[idx].status = 'Approved';
      localDb.setPOs(list);

      // Increment materials stock levels
      const mats = localDb.getMaterials();
      list[idx].items.forEach(item => {
        const mat = mats.find(m => m.project_id === list[idx].project_id && m.name.toLowerCase() === item.materialName.toLowerCase());
        if (mat) {
          mat.stock_level += item.qty;
        }
      });
      localDb.setMaterials(mats);

      // Record transaction
      const financials = localDb.getFinancials();
      localDb.setFinancials([
        ...financials,
        {
          id: 'f_po_' + poId,
          project_id: list[idx].project_id,
          category: 'Material',
          amount: list[idx].total_amount,
          type: 'Expense',
          description: `Approved procurement purchase: ${list[idx].title}`,
          transaction_date: new Date().toISOString().split('T')[0],
          reference_id: `PO-REF-${poId}`
        }
      ]);

      return list[idx];
    }
  },

  // ==========================================
  // EQUIPMENT
  // ==========================================
  getEquipment: async (): Promise<Equipment[]> => {
    if (apiMode === 'api') {
      return request<Equipment[]>('/equipment');
    } else {
      return localDb.getEquipment();
    }
  },

  updateEquipment: async (id: string, fields: { status?: string; fuel_consumed?: number; log?: string }): Promise<Equipment> => {
    if (apiMode === 'api') {
      return request<Equipment>(`/equipment/${id}/maintenance`, {
        method: 'POST',
        body: JSON.stringify(fields)
      });
    } else {
      const list = localDb.getEquipment();
      const idx = list.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Equipment not found');

      if (fields.status) list[idx].maintenance_status = fields.status as any;
      if (fields.fuel_consumed) list[idx].fuel_consumption += fields.fuel_consumed;
      if (fields.log) {
        list[idx].breakdown_history.push({
          date: new Date().toISOString().split('T')[0],
          cause: fields.log
        });
      }

      localDb.setEquipment(list);
      return list[idx];
    }
  },

  // ==========================================
  // FINANCIAL LEDGER
  // ==========================================
  getFinancials: async (): Promise<FinancialTransaction[]> => {
    if (apiMode === 'api') {
      return request<FinancialTransaction[]>('/finances');
    } else {
      return localDb.getFinancials();
    }
  },

  createFinancialTransaction: async (txn: Omit<FinancialTransaction, 'id' | 'transaction_date'>): Promise<FinancialTransaction> => {
    if (apiMode === 'api') {
      return request<FinancialTransaction>('/finances/transaction', {
        method: 'POST',
        body: JSON.stringify(txn)
      });
    } else {
      const list = localDb.getFinancials();
      const newTxn: FinancialTransaction = {
        ...txn,
        id: 'f' + (list.length + 1),
        transaction_date: new Date().toISOString().split('T')[0]
      };
      localDb.setFinancials([...list, newTxn]);
      return newTxn;
    }
  },

  getCostPredictions: async (projectId: string): Promise<any> => {
    if (apiMode === 'api') {
      return request<any>(`/finances/ai-prediction?projectId=${projectId}`);
    } else {
      // Simulate locally
      const projects = localDb.getProjects();
      const proj = projects.find(p => p.id === projectId) || projects[0];
      const budget = proj.budget;
      const progress = proj.progress_pct;
      
      const financials = localDb.getFinancials();
      const expenses = financials
        .filter(f => f.project_id === projectId && f.type === 'Expense')
        .reduce((s, x) => s + x.amount, 0);

      const predictedFinalCost = progress > 0 ? (expenses / (progress / 100)) : budget;
      const overrun = predictedFinalCost - budget;

      const materials = localDb.getMaterials().filter(m => m.project_id === projectId);
      const forecasts = materials.map(m => {
        const isLow = m.stock_level < m.reorder_level;
        return {
          materialName: m.name,
          currentStock: m.stock_level,
          unit: m.unit,
          suggestedPurchase: isLow ? (m.reorder_level * 3) - m.stock_level : 0,
          urgency: isLow ? 'Critical' : 'Stable'
        };
      });

      return {
        projectId,
        budget,
        currentExpenses: expenses,
        predictedFinalCost: Math.round(predictedFinalCost),
        projectedOverrun: Math.round(overrun > 0 ? overrun : 0),
        confidenceScore: 85,
        projectedCompletionDate: '2026-11-20',
        materialForecasts: forecasts
      };
    }
  },

  // ==========================================
  // AI ASSISTANT CHAT
  // ==========================================
  sendMessageToAI: async (message: string): Promise<{ text: string }> => {
    if (apiMode === 'api') {
      return request<{ text: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    } else {
      // Direct JS simulated chatbot matching API controller terms
      const query = message.toLowerCase();
      let text = '';

      if (query.includes('cement') && query.includes('left')) {
        const cementStocks = localDb.getMaterials().filter(m => m.name.toLowerCase() === 'cement');
        text = `According to current inventory counts:
        - **Alpha Tech Park (Site 1)**: ${cementStocks[0]?.stock_level || 0} Bags are active in stock.
        - **Ganga Heights (Site 2)**: ${cementStocks[1]?.stock_level || 0} Bags are active (Warning: Low stock levels. Minimum reorder is 100 bags).
        I recommend initiating a purchase order for Ganga Heights immediately.`;
      } else if (query.includes('delayed') || query.includes('projects')) {
        const delayed = localDb.getProjects().filter(p => p.status === 'Delayed');
        text = `Currently, there is **1 delayed project**:\n\n**${delayed[0].name}** (${delayed[0].client}) is reporting 48% progress. Completion was targeted for ${delayed[0].end_date}. Rebar shortage from Tata Tiscon Steel Hub blocked reinforcing columns.`;
      } else if (query.includes('expense') || query.includes('cost') || query.includes('finance')) {
        const totalExpenses = localDb.getFinancials()
          .filter(f => f.type === 'Expense')
          .reduce((sum, item) => sum + item.amount, 0);
        text = `Total company expenses logged this period is **₹${totalExpenses.toLocaleString('en-IN')}**. Here is the breakdown:
        - **Material**: ₹2,75,000
        - **Labour (Wages)**: ₹2,20,000
        - **Equipment (Lease/Fuel)**: ₹45,000`;
      } else if (query.includes('vendor') || query.includes('pending') || query.includes('payment')) {
        const pendingPO = localDb.getPOs().filter(po => po.status === 'Pending Approval');
        text = `There is **1 pending payment approval** for **${pendingPO[0]?.title || 'PO #1043'}** amounting to **₹${(pendingPO[0]?.total_amount || 0).toLocaleString('en-IN')}** for vendor Tata Tiscon Steel Hub. Approve it via the Procurement portal to release rebar logs.`;
      } else {
        text = `Namaste! I am your BuildFlow AI assistant. I have cross-referenced your site notebooks.
        Ask me about:
        - "How much cement is left in stock?"
        - "Which projects are delayed?"
        - "Show labour expenses for this month."
        - "Which vendors have pending payments?"`;
      }

      return { text };
    }
  },

  // ==========================================
  // SITE PROGRESS & DOCUMENTS
  // ==========================================
  getSiteUpdates: async (projectId: string): Promise<SiteUpdate[]> => {
    return localDb.getSiteUpdates().filter(su => su.project_id === projectId);
  },

  uploadSiteProgress: async (projectId: string, photoUrl: string, notes: string): Promise<SiteUpdate> => {
    const list = localDb.getSiteUpdates();
    const activeProjects = localDb.getProjects();
    const idx = activeProjects.findIndex(p => p.id === projectId);
    
    // Increment progress slightly with the update
    if (idx !== -1 && activeProjects[idx].progress_pct < 95) {
      activeProjects[idx].progress_pct += 2;
      localDb.setProjects(activeProjects);
    }

    const newUpdate: SiteUpdate = {
      id: 'su_' + Date.now(),
      project_id: projectId,
      posted_by: 'Vijay Patil',
      photos: [photoUrl],
      videos: [],
      notes,
      ai_progress_estimation: idx !== -1 ? activeProjects[idx].progress_pct : 67,
      ai_analysis_notes: 'Structural layer changes successfully scanned. Material curing is estimated at 88% efficiency.',
      created_at: new Date().toISOString()
    };

    localDb.setSiteUpdates([...list, newUpdate]);
    return newUpdate;
  },

  getDocuments: async (projectId: string): Promise<Document[]> => {
    return localDb.getDocuments().filter(d => d.project_id === projectId);
  },

  uploadOCRDocument: async (title: string, type: 'Invoice' | 'Permit' | 'Agreement', fileUrl: string): Promise<Document> => {
    if (apiMode === 'api') {
      return request<Document>('/documents/ocr-upload', {
        method: 'POST',
        body: JSON.stringify({ title, type, file_url: fileUrl })
      });
    } else {
      let ocr_data = {};
      if (type === 'Invoice') {
        ocr_data = {
          supplier: 'Tata Tiscon Steel Hub',
          invoice_no: 'TT/MUM/9912',
          total_amount: '3,20,000',
          gst_in: '27AAACT5678B2Z1',
          materials_identified: '5 Tons Fe550 TMT Rebar'
        };
      } else if (type === 'Permit') {
        ocr_data = {
          authority: 'Municipal Corporation',
          permit_no: 'BPMC/8812/2026',
          permissible_floors: 'G + 4 floors'
        };
      } else {
        ocr_data = {
          detected_text: 'Simulated contract extraction: Land agreement signed by builders and owners.',
          signatories: 'Rajesh Sharma, Alpha Developers'
        };
      }

      const list = localDb.getDocuments();
      const newDoc: Document = {
        id: 'd' + (list.length + 1),
        project_id: 'p1',
        title,
        type,
        file_url: fileUrl,
        ocr_data,
        version: 1,
        uploaded_by: 'Sanjay Gupta',
        created_at: new Date().toISOString()
      };
      localDb.setDocuments([...list, newDoc]);
      return newDoc;
    }
  }
};
export default api;
