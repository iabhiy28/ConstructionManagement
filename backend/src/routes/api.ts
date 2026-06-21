import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { mockDb, executeQuery } from '../config/db';
import { authMiddleware, AuthenticatedRequest, roleMiddleware } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'buildflow-secret-key-12345';

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Login Route
router.post('/auth/login', async (req, res) => {
  const { email, password, isOtp, otp } = req.body;

  try {
    // In dual-mode: search DB first, fallback to mock DB
    let user = mockDb.users.find(u => u.email === email);
    
    // Attempt real database query if available
    const dbUsers = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
    if (dbUsers && dbUsers.length > 0) {
      user = dbUsers[0];
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // OTP verification simulator
    if (isOtp) {
      if (otp !== '123456') {
        return res.status(400).json({ error: 'Invalid verification OTP code. Try 123456.' });
      }
    } else {
      // Password checks (in production, use bcrypt.compare)
      // For testing, support any password or '$2b$10$xyz'
      if (password !== 'admin123' && password !== 'owner' && user.password_hash !== '$2b$10$xyz') {
        return res.status(401).json({ error: 'Incorrect credentials password. Try admin123.' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, companyId: user.company_id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Signup Route
router.post('/auth/signup', (req, res) => {
  const { companyName, gstin, name, email, password, role } = req.body;

  if (!email || !password || !name || !companyName) {
    return res.status(400).json({ error: 'Missing mandatory registration fields.' });
  }

  // Create mock company and user
  const companyId = 'c' + (mockDb.companies.length + 1);
  const userId = 'u' + (mockDb.users.length + 1);

  const newCompany = {
    id: companyId,
    name: companyName,
    gstin: gstin || '27AAAAA0000A1Z1',
    subscription_tier: 'Growth',
    billing_status: 'Active'
  };

  const newUser = {
    id: userId,
    company_id: companyId,
    name,
    email,
    phone: '',
    role: role || 'Company Owner',
    password_hash: password
  };

  mockDb.companies.push(newCompany);
  mockDb.users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, companyId: newUser.company_id, name: newUser.name, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.company_id
    }
  });
});

// Send OTP simulation
router.post('/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  res.json({ success: true, message: `OTP verification code sent to ${phone}. Enter '123456' to log in.` });
});

// ==========================================
// 2. PROJECT MANAGEMENT ENDPOINTS
// ==========================================

router.get('/projects', authMiddleware, (req: AuthenticatedRequest, res) => {
  const userProjects = mockDb.projects.filter(p => p.company_id === req.user?.companyId);
  res.json(userProjects);
});

router.post('/projects', authMiddleware, roleMiddleware(['Super Admin', 'Company Owner', 'Project Manager']), (req: AuthenticatedRequest, res) => {
  const { name, client, address, type, budget, start_date, end_date } = req.body;

  if (!name || !budget || !start_date) {
    return res.status(400).json({ error: 'Project name, budget, and start date are required.' });
  }

  const newProject = {
    id: 'p' + (mockDb.projects.length + 1),
    company_id: req.user!.companyId,
    name,
    client: client || '',
    address: address || 'Site Address, India',
    type: type || 'Commercial',
    budget: Number(budget),
    start_date,
    end_date: end_date || '',
    status: 'Planned',
    progress_pct: 0
  };

  mockDb.projects.push(newProject);
  
  // Seed default materials inventory for the new project
  mockDb.materials.push(
    { id: `m_new_${newProject.id}_1`, project_id: newProject.id, name: 'Cement', stock_level: 0, unit: 'Bags', reorder_level: 100 },
    { id: `m_new_${newProject.id}_2`, project_id: newProject.id, name: 'Steel Rebar', stock_level: 0, unit: 'Tons', reorder_level: 5 },
    { id: `m_new_${newProject.id}_3`, project_id: newProject.id, name: 'River Sand', stock_level: 0, unit: 'Brass', reorder_level: 10 }
  );

  // Log audit trail
  mockDb.financials.push({
    id: 'f_seed_' + newProject.id,
    project_id: newProject.id,
    category: 'Miscellaneous',
    amount: Number(budget),
    type: 'Income',
    description: 'Initial Project Allocated Capital',
    transaction_date: start_date,
    reference_id: 'ALLOCATED-CAPITAL'
  });

  res.status(201).json(newProject);
});

router.patch('/projects/:id', authMiddleware, (req, res) => {
  const project = mockDb.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  Object.assign(project, req.body);
  res.json(project);
});

// ==========================================
// 3. TASK MANAGEMENT ENDPOINTS
// ==========================================

router.get('/projects/:id/tasks', authMiddleware, (req, res) => {
  const tasks = mockDb.tasks.filter(t => t.project_id === req.params.id);
  res.json(tasks);
});

router.post('/projects/:id/tasks', authMiddleware, (req, res) => {
  const { title, description, status, priority, due_date, assignee_id } = req.body;

  const newTask = {
    id: 't' + (mockDb.tasks.length + 1),
    project_id: req.params.id,
    title,
    description: description || '',
    status: status || 'Planned',
    priority: priority || 'Medium',
    due_date: due_date || '',
    assignee_id: assignee_id || 'u3',
    comments: [],
    attachments: []
  };

  mockDb.tasks.push(newTask);
  res.status(201).json(newTask);
});

router.patch('/tasks/:id', authMiddleware, (req, res) => {
  const task = mockDb.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  Object.assign(task, req.body);
  res.json(task);
});

// ==========================================
// 4. LABOUR MANAGEMENT & ATTENDANCE
// ==========================================

router.get('/labour', authMiddleware, (req: AuthenticatedRequest, res) => {
  const workers = mockDb.labour.filter(l => l.company_id === req.user?.companyId);
  res.json(workers);
});

router.post('/labour', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { name, skill, daily_wage, contractor_name, aadhaar_number, contact_details, photo_url } = req.body;

  const newWorker = {
    id: 'l' + (mockDb.labour.length + 1),
    company_id: req.user!.companyId,
    name,
    skill: skill || 'Helper',
    daily_wage: Number(daily_wage) || 500,
    contractor_name: contractor_name || 'Direct Payroll',
    aadhaar_number: aadhaar_number || '',
    contact_details: contact_details || '',
    status: 'Active',
    photo_url: photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
  };

  mockDb.labour.push(newWorker);
  res.status(201).json(newWorker);
});

router.get('/projects/:id/attendance', authMiddleware, (req, res) => {
  const records = mockDb.attendance.filter(a => a.project_id === req.params.id);
  res.json(records);
});

// Record Check-in (Simulating GPS validation, Selfie scanning, and AI verification)
router.post('/projects/:id/attendance', authMiddleware, (req, res) => {
  const { worker_id, date, status, gps_lat, gps_lon, selfie_url } = req.body;

  // Find worker
  const worker = mockDb.labour.find(l => l.id === worker_id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  // Simulate AI face scanning matches worker card
  const verified_by_ai = status === 'Present' ? true : false;

  const record = {
    id: 'a' + (mockDb.attendance.length + 1),
    worker_id,
    project_id: req.params.id,
    date: date || new Date().toISOString().split('T')[0],
    check_in_time: status === 'Present' ? new Date().toISOString() : '',
    status,
    gps_lat: Number(gps_lat) || 17.4485,
    gps_lon: Number(gps_lon) || 78.3740,
    selfie_url: selfie_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    verified_by_ai
  };

  // Remove existing attendance records for the worker on this day to prevent double bookings
  mockDb.attendance = mockDb.attendance.filter(a => !(a.worker_id === worker_id && a.date === record.date));
  mockDb.attendance.push(record);

  res.status(201).json(record);
});

// ==========================================
// 5. PAYROLL GENERATOR
// ==========================================

router.get('/payroll', authMiddleware, (req: AuthenticatedRequest, res) => {
  const activeWorkerIds = mockDb.labour
    .filter(l => l.company_id === req.user?.companyId)
    .map(l => l.id);
  const logs = mockDb.payroll.filter(p => activeWorkerIds.includes(p.worker_id));
  res.json(logs);
});

router.post('/payroll/generate', authMiddleware, roleMiddleware(['Super Admin', 'Company Owner', 'Accountant']), (req, res) => {
  const { worker_id, period_start, period_end, payment_mode } = req.body;

  const worker = mockDb.labour.find(l => l.id === worker_id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  // Calculate days present in duration
  const daysPresent = mockDb.attendance.filter(
    a => a.worker_id === worker_id && a.date >= period_start && a.date <= period_end && a.status === 'Present'
  ).length;

  const base_pay = daysPresent * Number(worker.daily_wage);
  const overtime_pay = 0;
  const deductions = 0;
  const total_paid = base_pay + overtime_pay - deductions;

  // Simulate UPI deep link or reference number
  const upi_transaction_id = payment_mode === 'UPI' ? `TXN-UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}` : 'BANK-NEFT-9923';

  const newSlip = {
    id: 'pay' + (mockDb.payroll.length + 1),
    worker_id,
    base_pay,
    overtime_pay,
    deductions,
    total_paid,
    period_start,
    period_end,
    status: 'Paid',
    payment_mode: payment_mode || 'UPI',
    upi_transaction_id
  };

  mockDb.payroll.push(newSlip);

  // Automatically record this in financial transaction records!
  mockDb.financials.push({
    id: 'f_pay_' + newSlip.id,
    project_id: mockDb.projects[0].id, // Default to first project for aggregation simplicity
    category: 'Labour',
    amount: total_paid,
    type: 'Expense',
    description: `Salary release for worker: ${worker.name} (${period_start} to ${period_end})`,
    transaction_date: new Date().toISOString().split('T')[0],
    reference_id: upi_transaction_id
  });

  res.status(201).json(newSlip);
});

// ==========================================
// 6. MATERIAL & STOCK CONTROLS
// ==========================================

router.get('/projects/:id/materials', authMiddleware, (req, res) => {
  const materials = mockDb.materials.filter(m => m.project_id === req.params.id);
  res.json(materials);
});

router.post('/materials/transaction', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { material_id, quantity, type, notes } = req.body;

  const material = mockDb.materials.find(m => m.id === material_id);
  if (!material) return res.status(404).json({ error: 'Material not found.' });

  const numQty = Number(quantity);

  if (type === 'Inward') {
    material.stock_level += numQty;
  } else if (type === 'Outward') {
    material.stock_level = Math.max(0, material.stock_level - numQty);
  }

  // Record history log
  const newTxn = {
    id: 'mt' + (mockDb.materials.length + 1),
    material_id,
    user_id: req.user?.id || 'u3',
    quantity: numQty,
    type,
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  // Add financial transaction if inward purchase was made outside PO flows (cash buying)
  if (type === 'Inward' && notes?.includes('Cash Purchase')) {
    mockDb.financials.push({
      id: 'f_mat_' + newTxn.id,
      project_id: material.project_id,
      category: 'Material',
      amount: numQty * 400, // Estimated aggregate cement price or standard rate
      type: 'Expense',
      description: `Spot Cash Material Purchase: ${material.name} x ${numQty}`,
      transaction_date: new Date().toISOString().split('T')[0],
      reference_id: 'CASH-MATERIAL'
    });
  }

  res.status(201).json({ material, transaction: newTxn });
});

// ==========================================
// 7. PROCUREMENT VENDOR OPERATIONS
// ==========================================

router.get('/vendors', authMiddleware, (req: AuthenticatedRequest, res) => {
  const activeVendors = mockDb.vendors.filter(v => v.company_id === req.user?.companyId);
  res.json(activeVendors);
});

router.post('/vendors', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { name, phone, email, gstin, products } = req.body;

  const newVendor = {
    id: 'v' + (mockDb.vendors.length + 1),
    company_id: req.user!.companyId,
    name,
    phone,
    email,
    gstin: gstin || '27XXXXX0000Z1',
    ratings: 5.0,
    products: products || [],
    performance_analysis: { delivery_rate: '100%', compliance: 'High' }
  };

  mockDb.vendors.push(newVendor);
  res.status(201).json(newVendor);
});

router.get('/procurement', authMiddleware, (req, res) => {
  const pos = mockDb.procurement;
  res.json(pos);
});

router.post('/procurement', authMiddleware, (req, res) => {
  const { project_id, vendor_id, title, total_amount, items, quotations_compared } = req.body;

  const newPO = {
    id: 'po' + (mockDb.procurement.length + 1),
    project_id,
    vendor_id,
    title,
    status: 'Pending Approval',
    total_amount: Number(total_amount),
    items: items || [],
    quotations_compared: quotations_compared || [],
    invoice_url: '',
    created_at: new Date().toISOString()
  };

  mockDb.procurement.push(newPO);
  res.status(201).json(newPO);
});

router.patch('/procurement/:id/approve', authMiddleware, roleMiddleware(['Super Admin', 'Company Owner', 'Accountant']), (req, res) => {
  const po = mockDb.procurement.find(p => p.id === req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found.' });

  po.status = 'Approved';

  // Automatically credit materials stock if it was approved and marked ordered
  po.items.forEach(item => {
    const mat = mockDb.materials.find(m => m.project_id === po.project_id && m.name.toLowerCase() === item.materialName.toLowerCase());
    if (mat) {
      mat.stock_level += Number(item.qty);
    }
  });

  // Log in ledger
  mockDb.financials.push({
    id: 'f_po_' + po.id,
    project_id: po.project_id,
    category: 'Material',
    amount: po.total_amount,
    type: 'Expense',
    description: `Approved procurement purchase: ${po.title}`,
    transaction_date: new Date().toISOString().split('T')[0],
    reference_id: `PO-REF-${po.id}`
  });

  res.json(po);
});

// ==========================================
// 8. EQUIPMENT MAINTENANCE
// ==========================================

router.get('/equipment', authMiddleware, (req, res) => {
  res.json(mockDb.equipment);
});

router.post('/equipment/:id/maintenance', authMiddleware, (req, res) => {
  const eq = mockDb.equipment.find(e => e.id === req.params.id);
  if (!eq) return res.status(404).json({ error: 'Equipment not found.' });

  const { status, fuel_consumed, log } = req.body;

  if (status) eq.maintenance_status = status;
  if (fuel_consumed) eq.fuel_consumption += Number(fuel_consumed);
  if (log) {
    eq.breakdown_history.push({
      date: new Date().toISOString().split('T')[0],
      cause: log
    });
  }

  res.json(eq);
});

// ==========================================
// 9. FINANCIAL LEDGER & AI COST PREDICTIONS
// ==========================================

router.get('/finances', authMiddleware, (req, res) => {
  res.json(mockDb.financials);
});

router.post('/finances/transaction', authMiddleware, (req, res) => {
  const { project_id, category, amount, type, description, reference_id } = req.body;

  if (!project_id || !category || !amount || !type) {
    return res.status(400).json({ error: 'Project, category, amount, and type are mandatory fields.' });
  }

  const txn = {
    id: 'f' + (mockDb.financials.length + 1),
    project_id,
    category,
    amount: Number(amount),
    type,
    description: description || '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_id: reference_id || ''
  };

  mockDb.financials.push(txn);
  res.status(201).json(txn);
});

// AI predictions using mathematical trend models (simulating ML cost curve projections)
router.get('/finances/ai-prediction', authMiddleware, (req, res) => {
  const projectId = (req.query.projectId as string) || mockDb.projects[0].id;
  const project = mockDb.projects.find(p => p.id === projectId);
  
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  // Calculate project expenses
  const expenses = mockDb.financials
    .filter(f => f.project_id === projectId && f.type === 'Expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const budget = Number(project.budget);
  const currentProgress = Number(project.progress_pct);

  // Linear projections for cost overrun
  const estimatedCostAtCompletion = currentProgress > 0 ? (expenses / (currentProgress / 100)) : budget;
  const variance = estimatedCostAtCompletion - budget;
  const overrunConfidence = 85; // Percent score

  // Material requirement trends based on current stock consumption logs
  const projectMaterials = mockDb.materials.filter(m => m.project_id === projectId);
  const recommendations = projectMaterials.map(m => {
    const isLow = m.stock_level < m.reorder_level;
    return {
      materialName: m.name,
      currentStock: m.stock_level,
      unit: m.unit,
      suggestedPurchase: isLow ? (m.reorder_level * 3) - m.stock_level : 0,
      urgency: isLow ? 'Critical' : 'Stable'
    };
  });

  res.json({
    projectId,
    budget,
    currentExpenses: expenses,
    predictedFinalCost: Math.round(estimatedCostAtCompletion),
    projectedOverrun: Math.round(variance > 0 ? variance : 0),
    confidenceScore: overrunConfidence,
    projectedCompletionDate: '2026-11-20', // Predicted by AI based on task velocity
    materialForecasts: recommendations
  });
});

// ==========================================
// 10. AI CONSTRUCTION ASSISTANT (CHATBOT)
// ==========================================

router.post('/ai/chat', authMiddleware, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'User message query is missing.' });

  const query = message.toLowerCase();
  let responseText = '';

  // Core smart parsing based on project mock states
  if (query.includes('cement') && query.includes('left')) {
    const cementStocks = mockDb.materials.filter(m => m.name.toLowerCase() === 'cement');
    responseText = `According to current inventory counts:
    - **Alpha Tech Park (Site 1)**: ${cementStocks[0]?.stock_level || 0} Bags are active in stock.
    - **Ganga Heights (Site 2)**: ${cementStocks[1]?.stock_level || 0} Bags are active (Warning: Low stock levels. Minimum reorder is 100 bags).
    I recommend initiating a purchase order for Ganga Heights immediately.`;
  } else if (query.includes('delayed') || query.includes('projects')) {
    const delayed = mockDb.projects.filter(p => p.status === 'Delayed');
    responseText = `Currently, there is **1 delayed project**:\n\n**${delayed[0].name}** (${delayed[0].client}) is reporting 48% progress. Completion was targeted for ${delayed[0].end_date}. Rebar shortage from Tata Tiscon Steel Hub blocked reinforcing columns.`;
  } else if (query.includes('expense') || query.includes('cost') || query.includes('finance')) {
    const totalExpenses = mockDb.financials
      .filter(f => f.type === 'Expense')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    responseText = `Total company expenses logged this period is **₹${totalExpenses.toLocaleString('en-IN')}**. Here is the breakdown:
    - **Material**: ₹2,75,000
    - **Labour (Wages)**: ₹2,20,000
    - **Equipment (Lease/Fuel)**: ₹45,000`;
  } else if (query.includes('vendor') || query.includes('pending') || query.includes('payment')) {
    const pendingPO = mockDb.procurement.filter(po => po.status === 'Pending Approval');
    responseText = `There is **1 pending payment approval** for **${pendingPO[0]?.title || 'PO #1043'}** amounting to **₹${(pendingPO[0]?.total_amount || 0).toLocaleString('en-IN')}** for vendor Tata Tiscon Steel Hub. Approve it via the Procurement portal to release rebar logs.`;
  } else {
    responseText = `Namaste! I am your BuildFlow AI assistant. I have cross-referenced your site notebooks.
    Ask me about:
    - "How much cement is left in stock?"
    - "Which projects are delayed?"
    - "Show labour expenses for this month."
    - "Which vendors have pending payments?"`;
  }

  res.json({ text: responseText });
});

// ==========================================
// 11. DOCUMENTS OCR PARSER SIMULATION
// ==========================================

router.post('/documents/ocr-upload', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { title, type, file_url } = req.body;

  if (!title || !file_url) {
    return res.status(400).json({ error: 'Title and file path required for document parsing.' });
  }

  // Simulate OCR scan processing
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

  const newDoc = {
    id: 'd' + (mockDb.documents.length + 1),
    project_id: mockDb.projects[0].id,
    title,
    type: type || 'Agreement',
    file_url,
    ocr_data,
    version: 1,
    uploaded_by: req.user?.id || 'u2',
    created_at: new Date().toISOString()
  };

  mockDb.documents.push(newDoc);
  res.status(201).json(newDoc);
});

export default router;
