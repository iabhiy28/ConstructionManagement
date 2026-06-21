-- BuildFlow AI - Production PostgreSQL Database Schema
-- Optimized for Tenant Isolation, Soft Deletes, Activity Logs, and Performance Indexing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (SaaS Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    gstin VARCHAR(15), -- Indian GST Identification Number
    subscription_tier VARCHAR(50) DEFAULT 'Growth', -- Trial, Growth, Enterprise
    billing_status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS (RBAC Accounts)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Super Admin, Company Owner, Project Manager, Site Engineer, Accountant, Store Manager, Contractor, Vendor, Labour Supervisor
    is_mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete marker
);

-- 3. PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255),
    address TEXT NOT NULL,
    type VARCHAR(100), -- Residential, Commercial, Infrastructure, Industrial
    budget DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Planned', -- Planned, Active, Delayed, Completed, Suspended
    progress_pct DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete marker
);

-- 4. TASKS (Kanban Board)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Planned', -- Planned, In Progress, Blocked, Completed
    priority VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Critical
    due_date DATE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]', -- List of attachment URLs
    comments JSONB DEFAULT '[]', -- Structured chat remarks: [{user, text, time}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. LABOUR
CREATE TABLE labour (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(512),
    skill VARCHAR(100) NOT NULL, -- Mason, Carpenter, Welder, Helper, Electrician, Plumber
    daily_wage DECIMAL(10, 2) NOT NULL,
    contractor_name VARCHAR(255),
    aadhaar_number VARCHAR(12) UNIQUE, -- Masked / Encrypted in production
    contact_details VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Active', -- Active, Inactive, On Leave
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ATTENDANCE (GPS + Selfie verification)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES labour(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL, -- Present, Absent, Half Day, Approved Leave
    gps_lat DECIMAL(9, 6),
    gps_lon DECIMAL(9, 6),
    selfie_url VARCHAR(512),
    verified_by_ai BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PAYROLL
CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES labour(id) ON DELETE CASCADE,
    base_pay DECIMAL(12, 2) NOT NULL,
    overtime_pay DECIMAL(12, 2) DEFAULT 0.00,
    deductions DECIMAL(12, 2) DEFAULT 0.00,
    total_paid DECIMAL(12, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Processing, Paid, Failed
    payment_mode VARCHAR(50), -- UPI, Bank Transfer, Cash
    upi_transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. MATERIALS (Inventory tracking)
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Cement, Steel, Sand, Bricks, Paint, Electrical
    stock_level DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL, -- Bags, Tons, Brass, Numbers, Litres
    reorder_level DECIMAL(12, 2) NOT NULL DEFAULT 10.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. MATERIAL TRANSACTIONS
CREATE TABLE material_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Inward (Procurement), Outward (Consumption), Transfer, Audit Adjustment
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. VENDORS
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    gstin VARCHAR(15) UNIQUE, -- Goods and Services Tax ID
    ratings DECIMAL(3, 2) DEFAULT 5.00,
    products JSONB DEFAULT '[]', -- List of supplied material types
    performance_analysis JSONB DEFAULT '{}', -- Delivery rate, quality scorecard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. PROCUREMENT (Purchase Orders & Approvals)
CREATE TABLE procurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Pending Approval, Approved, Ordered, Delivered, Cancelled
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]', -- [{materialName, qty, rate, subtotal}]
    quotations_compared JSONB DEFAULT '[]', -- [{vendorName, price, leadTime}]
    invoice_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. EQUIPMENT
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL, -- JCB, Cranes, Excavators, Trucks
    brand VARCHAR(100),
    model VARCHAR(100),
    utilization_hours DECIMAL(10, 2) DEFAULT 0.00,
    fuel_consumption DECIMAL(10, 2) DEFAULT 0.00, -- Litres consumed
    maintenance_status VARCHAR(50) DEFAULT 'Healthy', -- Healthy, Under Service, Breakdown
    last_service_date DATE,
    next_service_date DATE,
    breakdown_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. FINANCIAL TRANSACTIONS (Double Entry Ledger)
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- Labour, Material, Equipment, Transportation, Utilities, Miscellaneous
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Income, Expense
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_id VARCHAR(255), -- Invoice id, UPI txn reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. SITE UPDATES (Progress verification photo/video feed)
CREATE TABLE site_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL REFERENCES users(id),
    photos JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    notes TEXT,
    ai_progress_estimation DECIMAL(5, 2) DEFAULT 0.00, -- AI calculated progress
    ai_analysis_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. DOCUMENTS (OCR supported agreements & layouts)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- Agreement, Drawing, Invoice, Permit
    file_url VARCHAR(512) NOT NULL,
    ocr_data JSONB DEFAULT '{}', -- OCR-extracted content metadata
    version INT DEFAULT 1,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. AUDIT LOGS (Security & compliance tracker)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- USER_LOGIN, PROJECT_CREATE, FINANCIAL_POST, etc.
    entity_name VARCHAR(100) NOT NULL, -- users, projects, attendance, financials
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- INDEXING STRATEGY
-- =========================================================================

-- Quick authentication lookup
CREATE INDEX idx_users_email ON users(email);

-- Active projects for tenant separation
CREATE INDEX idx_projects_tenant_active ON projects(company_id) WHERE deleted_at IS NULL;

-- Kanban state search filter
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

-- Attendance aggregation for payroll & verification
CREATE INDEX idx_attendance_worker_date ON attendance(worker_id, date);

-- Finance dashboards caching
CREATE INDEX idx_finances_project_date ON financial_transactions(project_id, transaction_date);

-- Inventory check indexes
CREATE INDEX idx_materials_project_name ON materials(project_id, name);

-- Tenant specific audit trails
CREATE INDEX idx_audit_company_date ON audit_logs(company_id, created_at DESC);
