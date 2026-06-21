import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Attempt PostgreSQL Pool initialization
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/buildflow';

export let pool: Pool | null = null;
let useMockDb = false;

try {
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
  
  // Test connection
  pool.query('SELECT NOW()').catch(err => {
    console.warn('Postgres connection failed. BuildFlow AI is running in MOCK DATABASE mode.');
    useMockDb = true;
  });
} catch (e) {
  console.warn('Could not initialize Postgres. BuildFlow AI is running in MOCK DATABASE mode.');
  useMockDb = true;
}

// In-memory mock database state for seamless local developer testing
export const mockDb = {
  companies: [
    { id: 'c1', name: 'Shiva Construction Ltd', gstin: '27AAAAA1111A1Z1', subscription_tier: 'Enterprise', billing_status: 'Active' }
  ],
  users: [
    { id: 'u1', company_id: 'c1', name: 'Rajesh Sharma', email: 'owner@buildflow.in', phone: '9876543210', role: 'Company Owner', password_hash: '$2b$10$xyz' },
    { id: 'u2', company_id: 'c1', name: 'Amit Verma', email: 'pm@buildflow.in', phone: '9876543211', role: 'Project Manager', password_hash: '$2b$10$xyz' },
    { id: 'u3', company_id: 'c1', name: 'Vijay Patil', email: 'engineer@buildflow.in', phone: '9876543212', role: 'Site Engineer', password_hash: '$2b$10$xyz' },
    { id: 'u4', company_id: 'c1', name: 'Sanjay Gupta', email: 'accountant@buildflow.in', phone: '9876543213', role: 'Accountant', password_hash: '$2b$10$xyz' }
  ],
  projects: [
    { id: 'p1', company_id: 'c1', name: 'Alpha Tech Park', client: 'Alpha Developers', address: 'Plot 42, Sector 5, Hitec City, Hyderabad', type: 'Commercial', budget: 120000000, start_date: '2026-01-10', end_date: '2027-06-30', status: 'Active', progress_pct: 65 },
    { id: 'p2', company_id: 'c1', name: 'Ganga Heights Residential', client: 'Ganga Builders', address: 'R.G. Road, Sector 12, Noida, UP', type: 'Residential', budget: 85000000, start_date: '2025-11-01', end_date: '2026-10-31', status: 'Delayed', progress_pct: 48 },
    { id: 'p3', company_id: 'c1', name: 'Smart City Highway Overlay', client: 'NHAI', address: 'NH-44 Bypass, Nagpur, Maharashtra', type: 'Infrastructure', budget: 350000000, start_date: '2026-04-15', end_date: '2027-12-15', status: 'Planned', progress_pct: 5 }
  ],
  tasks: [
    { id: 't1', project_id: 'p1', title: 'Foundation Concreting', description: 'Pouring M30 grade concrete for core columns', status: 'Completed', priority: 'High', due_date: '2026-05-10', assignee_id: 'u3', comments: [], attachments: [] },
    { id: 't2', project_id: 'p1', title: 'Brickwork Layer 2', description: 'Internal wall partition blockwork installation', status: 'In Progress', priority: 'Medium', due_date: '2026-06-28', assignee_id: 'u3', comments: [{user: 'Vijay Patil', text: '50% bricks consumed, waiting on replenishment.', time: '2026-06-20T10:00:00Z'}], attachments: [] },
    { id: 't3', project_id: 'p1', title: 'Electrical Conduit Routing', description: 'Laying wall conduits before plastering', status: 'Planned', priority: 'Low', due_date: '2026-07-15', assignee_id: 'u3', comments: [], attachments: [] },
    { id: 't4', project_id: 'p2', title: 'Pillar Reinforcement Steel Bending', description: 'Rebar fabrication checking for building blocks', status: 'Blocked', priority: 'Critical', due_date: '2026-06-15', assignee_id: 'u3', comments: [{user: 'Vijay Patil', text: 'Steel procurement delay from vendor.', time: '2026-06-18T14:30:00Z'}], attachments: [] }
  ],
  labour: [
    { id: 'l1', company_id: 'c1', name: 'Ramesh Kumar', skill: 'Mason', daily_wage: 750, contractor_name: 'Om Shakti Labour Agency', aadhaar_number: '123456789012', contact_details: '9123456780', status: 'Active', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
    { id: 'l2', company_id: 'c1', name: 'Sunil Yadav', skill: 'Carpenter', daily_wage: 800, contractor_name: 'Om Shakti Labour Agency', aadhaar_number: '234567890123', contact_details: '9123456781', status: 'Active', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' },
    { id: 'l3', company_id: 'c1', name: 'Deepak Nishad', skill: 'Welder', daily_wage: 850, contractor_name: 'Shiva Contractor Pool', aadhaar_number: '345678901234', contact_details: '9123456782', status: 'Active', photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120' },
    { id: 'l4', company_id: 'c1', name: 'Harish Chandra', skill: 'Helper', daily_wage: 500, contractor_name: 'Direct Payroll', aadhaar_number: '456789012345', contact_details: '9123456783', status: 'Active', photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120' },
    { id: 'l5', company_id: 'c1', name: 'Kamlesh Soren', skill: 'Electrician', daily_wage: 800, contractor_name: 'Shiva Contractor Pool', aadhaar_number: '567890123456', contact_details: '9123456784', status: 'On Leave', photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120' }
  ],
  attendance: [
    { id: 'a1', worker_id: 'l1', project_id: 'p1', date: '2026-06-20', check_in_time: '2026-06-20T08:05:00Z', status: 'Present', gps_lat: 17.4483, gps_lon: 78.3741, selfie_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', verified_by_ai: true },
    { id: 'a2', worker_id: 'l2', project_id: 'p1', date: '2026-06-20', check_in_time: '2026-06-20T08:12:00Z', status: 'Present', gps_lat: 17.4485, gps_lon: 78.3740, selfie_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', verified_by_ai: true },
    { id: 'a3', worker_id: 'l3', project_id: 'p1', date: '2026-06-20', check_in_time: '2026-06-20T08:00:00Z', status: 'Present', gps_lat: 17.4481, gps_lon: 78.3742, selfie_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', verified_by_ai: true },
    { id: 'a4', worker_id: 'l4', project_id: 'p1', date: '2026-06-20', check_in_time: '2026-06-20T08:15:00Z', status: 'Present', gps_lat: 17.4482, gps_lon: 78.3739, selfie_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', verified_by_ai: true },
    { id: 'a5', worker_id: 'l5', project_id: 'p1', date: '2026-06-20', check_in_time: '', status: 'Approved Leave', gps_lat: 0, gps_lon: 0, selfie_url: '', verified_by_ai: false }
  ],
  materials: [
    { id: 'm1', project_id: 'p1', name: 'Cement', stock_level: 450, unit: 'Bags', reorder_level: 100 },
    { id: 'm2', project_id: 'p1', name: 'Steel Rebar', stock_level: 12, unit: 'Tons', reorder_level: 5 },
    { id: 'm3', project_id: 'p1', name: 'River Sand', stock_level: 15, unit: 'Brass', reorder_level: 8 },
    { id: 'm4', project_id: 'p1', name: 'Red Bricks', stock_level: 22000, unit: 'Nos', reorder_level: 5000 },
    { id: 'm5', project_id: 'p2', name: 'Cement', stock_level: 80, unit: 'Bags', reorder_level: 100 }, // Low Stock!
    { id: 'm6', project_id: 'p2', name: 'Steel Rebar', stock_level: 2.5, unit: 'Tons', reorder_level: 5 } // Low Stock!
  ],
  vendors: [
    { id: 'v1', company_id: 'c1', name: 'UltraTech Cement Supplier', phone: '9988776655', email: 'sales@ultratech.co.in', gstin: '27AAACU1234F1Z0', ratings: 4.8, products: ['Cement', 'Concrete Mix'] },
    { id: 'v2', company_id: 'c1', name: 'Tata Tiscon Steel Hub', phone: '9988776656', email: 'contact@tatatiscon.co.in', gstin: '27AAACT5678B2Z1', ratings: 4.9, products: ['Steel Rebar', 'Structural Steel'] },
    { id: 'v3', company_id: 'c1', name: 'Apex Electricals India', phone: '9988776657', email: 'orders@apexelectricals.com', gstin: '27AAACA9999M3Z3', ratings: 4.2, products: ['Conduits', 'Wires', 'Switchboards'] }
  ],
  procurement: [
    { id: 'po1', project_id: 'p1', vendor_id: 'v1', title: 'Cement replenishment PO #1042', status: 'Delivered', total_amount: 195000, items: [{materialName: 'Cement', qty: 500, rate: 390, subtotal: 195000}], quotations_compared: [], invoice_url: 'https://buildflow.in/invoices/inv-1042.pdf', created_at: '2026-06-10T09:00:00Z' },
    { id: 'po2', project_id: 'p2', vendor_id: 'v2', title: 'Urgent Rebar Procurement PO #1043', status: 'Pending Approval', total_amount: 320000, items: [{materialName: 'Steel Rebar', qty: 5, rate: 64000, subtotal: 320000}], quotations_compared: [{vendorName: 'Tata Steel Hub', price: 320000, leadTime: '2 Days'}, {vendorName: 'JSW Steel Depot', price: 335000, leadTime: '1 Day'}], invoice_url: '', created_at: '2026-06-19T11:45:00Z' }
  ],
  equipment: [
    { id: 'eq1', project_id: 'p1', name: 'JCB 3DX Backhoe', brand: 'JCB', model: '2024 Model', utilization_hours: 320.5, fuel_consumption: 480, maintenance_status: 'Healthy', last_service_date: '2026-05-15', next_service_date: '2026-08-15', breakdown_history: [] },
    { id: 'eq2', project_id: 'p1', name: 'Tower Crane TC60', brand: 'Liebherr', model: '60 Ton', utilization_hours: 150.0, fuel_consumption: 120, maintenance_status: 'Under Service', last_service_date: '2026-06-18', next_service_date: '2026-09-18', breakdown_history: [{date: '2026-06-18', cause: 'Hydraulic leak resolved'}] }
  ],
  financials: [
    { id: 'f1', project_id: 'p1', category: 'Labour', amount: 84000, type: 'Expense', description: 'Weekly wage payments', transaction_date: '2026-06-15', reference_id: 'UPI-TXN-9012' },
    { id: 'f2', project_id: 'p1', category: 'Material', amount: 195000, type: 'Expense', description: 'UltraTech Cement Invoice PO #1042', transaction_date: '2026-06-12', reference_id: 'UPI-TXN-8843' },
    { id: 'f3', project_id: 'p1', category: 'Equipment', amount: 45000, type: 'Expense', description: 'JCB weekly fuel & maintenance lease', transaction_date: '2026-06-18', reference_id: 'UPI-TXN-7734' },
    { id: 'f4', project_id: 'p1', category: 'Labour', amount: 92000, type: 'Expense', description: 'Contractor settlement - Om Shakti', transaction_date: '2026-06-19', reference_id: 'UPI-TXN-6612' },
    { id: 'f5', project_id: 'p1', category: 'Miscellaneous', amount: 4500000, type: 'Income', description: 'Client Milestone payment #3 - Slab completion', transaction_date: '2026-06-14', reference_id: 'BANK-TRF-0012' },
    { id: 'f6', project_id: 'p2', category: 'Material', amount: 125000, type: 'Expense', description: 'Aggregate supply procurement', transaction_date: '2026-06-10', reference_id: 'UPI-TXN-5523' },
    { id: 'f7', project_id: 'p2', category: 'Labour', amount: 44000, type: 'Expense', description: 'Weekly wages', transaction_date: '2026-06-16', reference_id: 'UPI-TXN-4412' }
  ],
  siteUpdates: [
    { id: 'su1', project_id: 'p1', posted_by: 'u3', date: '2026-06-20', photos: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5'], notes: 'Third floor roof slab casting completed. Structural engineer checked reinforcement curing. Concrete cubes stored for strength testing.', ai_progress_estimation: 65, ai_analysis_notes: 'Casting matches construction blueprints. Progress stands at 65%. 2 days ahead of target scheduler.' }
  ],
  documents: [
    { id: 'd1', project_id: 'p1', title: 'Plot Sanction Plan Approved.pdf', type: 'Permit', file_url: 'https://buildflow.in/docs/permit-p1.pdf', ocr_data: { authority: 'GHMC', approval_number: 'AP/1042/2026', total_approved_area_sqft: '45,200' }, version: 1, uploaded_by: 'u2', created_at: '2026-01-12T10:00:00Z' },
    { id: 'd2', project_id: 'p1', title: 'Cement Procurement Invoice-1042.pdf', type: 'Invoice', file_url: 'https://buildflow.in/docs/inv-1042.pdf', ocr_data: { supplier: 'UltraTech Cement', invoice_no: 'UT/HYD/8892', total_amount: '1,95,000', gst_in: '27AAACU1234F1Z0' }, version: 1, uploaded_by: 'u4', created_at: '2026-06-12T16:20:00Z' }
  ] as any[],
  payroll: [] as any[]
};

// Helper queries selector that handles PostgreSQL queries if active, otherwise falls back to Mock state
export async function executeQuery(text: string, params?: any[]) {
  if (!useMockDb && pool) {
    try {
      const res = await pool.query(text, params);
      return res.rows;
    } catch (err) {
      console.error('Database query error, falling back to local simulation:', err);
    }
  }
  
  // Custom mock database handler for local developer experience (in-memory mock queries)
  // Matching simple route behaviors
  if (text.includes('SELECT * FROM users WHERE email =')) {
    const email = params ? params[0] : '';
    const user = mockDb.users.find(u => u.email === email);
    return user ? [user] : [];
  }
  
  if (text.includes('SELECT * FROM projects WHERE company_id =')) {
    return mockDb.projects;
  }
  
  if (text.includes('SELECT * FROM labour WHERE company_id =')) {
    return mockDb.labour;
  }
  
  if (text.includes('SELECT * FROM materials')) {
    return mockDb.materials;
  }
  
  if (text.includes('SELECT * FROM financial_transactions')) {
    return mockDb.financials;
  }

  return [];
}
