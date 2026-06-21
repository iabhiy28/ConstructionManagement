import React, { useState, useEffect } from 'react';
import { Document } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FileText, Plus, Search, Eye, Sparkles, Upload } from 'lucide-react';

interface DocumentsProps {
  selectedProjectId: string;
}

export default function DocumentOCR({ selectedProjectId }: DocumentsProps) {
  const { role } = useAuth();
  
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Invoice' | 'Permit' | 'Agreement'>('Invoice');
  const [fileUrl, setFileUrl] = useState('');
  const [ocrScanning, setOcrScanning] = useState(false);
  const [lastUploadedDoc, setLastUploadedDoc] = useState<Document | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments(selectedProjectId);
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedProjectId]);

  const handleOCRUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) return;

    setOcrScanning(true);
    try {
      // Simulate delay for AI reading text lines
      setTimeout(async () => {
        try {
          const doc = await api.uploadOCRDocument(title, type, fileUrl);
          setLastUploadedDoc(doc);
          setOcrScanning(false);
          setShowUpload(false);
          // Reset
          setTitle('');
          setFileUrl('');
          loadDocuments();
        } catch {
          setOcrScanning(false);
        }
      }, 2000);
    } catch (err) {
      setOcrScanning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Documents & AI OCR</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Store agreements, draw structural layouts, and extract purchase items via invoice OCR scanning.</p>
        </div>

        {['Super Admin', 'Company Owner', 'Site Engineer', 'Accountant'].includes(role) && (
          <button
            onClick={() => {
              setLastUploadedDoc(null);
              setShowUpload(true);
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Bill / Permit
          </button>
        )}
      </div>

      {/* OCR Result Banner on last upload */}
      {lastUploadedDoc && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 animate-spin" />
            <h4 className="text-xs font-black text-foreground uppercase tracking-widest">AI Document OCR Extraction Completed</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-muted-foreground">
            {Object.entries(lastUploadedDoc.ocr_data).map(([key, val]) => (
              <div key={key} className="bg-white/40 dark:bg-white/[0.02] border border-border rounded-xl p-3">
                <span className="text-[8px] uppercase">{key.replace('_', ' ')}</span>
                <p className="text-xs text-foreground mt-1 font-black">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Docs table */}
      <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-primary" />
          Document Registry
        </h3>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-12 bg-muted rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-2">Document Title</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Uploaded By</th>
                  <th className="py-3 px-2">Upload Date</th>
                  <th className="py-3 px-2 text-center">Metadata extracted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-2 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-muted-foreground font-semibold">{doc.type}</td>
                    <td className="py-4 px-2 text-muted-foreground font-medium">{doc.uploaded_by}</td>
                    <td className="py-4 px-2 text-muted-foreground font-medium">{doc.created_at.split('T')[0]}</td>
                    <td className="py-4 px-2 text-center">
                      <button
                        onClick={() => setLastUploadedDoc(doc)}
                        className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl hover:bg-primary/15 transition-all inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect OCR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload with OCR Modal Popup */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-20">
          <div className="bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground mb-4">Upload File & Run OCR</h3>
            <form onSubmit={handleOCRUpload} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase">Document Display Name</label>
                <input
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Tata rebar invoice Nov"
                  className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Document Type</label>
                  <select
                    value={type} onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="Invoice">Invoice / Bill Receipt</option>
                    <option value="Permit">Permit / Sanction Plan</option>
                    <option value="Agreement">Legal Deed / Agreement</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Simulated S3 URL path</label>
                  <input
                    type="text" required value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                    placeholder="e.g. bills/inv-TataTiscon.pdf"
                    className="w-full bg-slate-100 dark:bg-zinc-800 text-xs border border-border/60 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              {ocrScanning && (
                <div className="bg-primary/5 border border-primary/20 text-primary text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-3">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>AI reading text columns, identifying GSTIN, and formatting invoice line ledger...</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button" disabled={ocrScanning} onClick={() => setShowUpload(false)}
                  className="px-4 py-2 border border-border text-xs font-bold text-foreground rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={ocrScanning}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg hover:bg-primary/95 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze Invoice OCR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
