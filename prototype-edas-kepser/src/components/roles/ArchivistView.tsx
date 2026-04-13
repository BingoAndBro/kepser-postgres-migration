import { ChevronRight, Search, Description, CheckCircle, Cancel, Info } from '../Icons';
import { Document, Role } from '../../types';

interface ArchivistViewProps {
  filteredDocs: Document[];
  selectedDoc: Document | null;
  setSelectedDoc: (doc: Document) => void;
  role: Role;
}

export const ArchivistView = ({ filteredDocs, selectedDoc, setSelectedDoc, role }: ArchivistViewProps) => {
  return (
    <div className="flex-1 overflow-y-auto relative bg-background custom-scrollbar">
      <div className="absolute inset-0 dotted-grid pointer-events-none"></div>
      
      {/* Document Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md px-8 py-6 z-10 border-b border-outline-variant/10">
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-outline font-extrabold mb-2">
          <button className="hover:text-primary transition-colors">Archive</button>
          <ChevronRight size={12} className="text-outline" />
          <span className="text-on-surface">Completed</span>
        </nav>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
              {selectedDoc?.name || 'Select a Document'}
            </h1>
            <p className="text-on-surface-variant text-xs font-semibold mt-1">
              ID: {selectedDoc?.id || 'N/A'} • Final Validation Required
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-outline">
            <span className="flex items-center gap-1"><Search size={14} /> {selectedDoc?.modified || 'N/A'}</span>
            <span className="flex items-center gap-1"><Description size={14} /> {selectedDoc?.type.toUpperCase()} • {selectedDoc?.size}</span>
          </div>
        </div>
      </header>

      <div className="px-8 pb-12 grid grid-cols-12 gap-8 relative mt-8">
        {/* Left Rail: Ready for Finalization */}
        <section className="col-span-12 lg:col-span-3 space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-outline font-extrabold px-2">Ready for Finalization</h3>
          <div className="space-y-2">
            {filteredDocs.slice(0, 4).map((doc) => (
              <div 
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 rounded-lg shadow-sm transition-all cursor-pointer ring-1 ring-black/5 ${
                  selectedDoc?.id === doc.id 
                    ? 'bg-surface-container-lowest border-l-4 border-primary' 
                    : 'hover:bg-surface-container-low border border-transparent group'
                }`}
              >
                <p className={`text-sm font-bold truncate ${selectedDoc?.id === doc.id ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                  {doc.name}
                </p>
                <p className="text-[11px] text-outline font-medium mt-1">Status: {doc.status}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Center Area: Metadata & Audit */}
        <section className="col-span-12 lg:col-span-6 space-y-8">
          {/* Metadata Section */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-extrabold text-on-surface">Inherited Metadata</h3>
              <button className="text-primary text-[10px] font-extrabold uppercase tracking-widest hover:underline">Edit Fields</button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Departemen Fungsi</label>
                <p className="text-sm font-bold text-on-surface">{selectedDoc?.deptFunction}</p>
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Jenis Kegiatan</label>
                <p className="text-sm font-bold text-on-surface">{selectedDoc?.activityType}</p>
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Tahun</label>
                <p className="text-sm font-bold text-on-surface">{selectedDoc?.year}</p>
              </div>
              <div>
                <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Classification</label>
                <p className="text-[10px] bg-error/10 text-error px-2 py-0.5 rounded-sm font-extrabold uppercase tracking-wider inline-block">Highly Confidential</p>
              </div>
            </div>
          </div>

          {/* Verification Audit Trail */}
          <div>
            <h3 className="font-headline font-extrabold text-on-surface mb-6">Verification Audit Trail</h3>
            <div className="space-y-0 relative">
              <div className="absolute left-[11px] top-4 bottom-4 w-px border-l border-dashed border-outline-variant"></div>
              
              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-600" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-on-surface">Bandahara menyetujui pencairan</p>
                    <p className="text-xs text-on-surface-variant mt-1">Persetujuan pembayaran telah divalidasi dan siap diproses.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-on-surface uppercase tracking-wider">Bendahara</p>
                    <p className="text-[10px] text-outline">Oct 23, 09:42 AM</p>
                  </div>
                </div>
              </div>

              <div className="relative pl-10 pb-8">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-600" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-on-surface">PPK memvalidasi dokumen</p>
                    <p className="text-xs text-on-surface-variant mt-1">Verifikasi teknis dan administratif telah disetujui.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-on-surface uppercase tracking-wider">Pejabat Pembuat Komitmen</p>
                    <p className="text-[10px] text-outline">Oct 22, 11:15 PM</p>
                  </div>
                </div>
              </div>

              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                  <Info size={14} className="text-outline" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-on-surface-variant">User mengajukan dokumen</p>
                    <p className="text-xs text-outline mt-1">Dokumen awal diunggah melalui portal pengajuan.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-outline uppercase tracking-wider">User</p>
                    <p className="text-[10px] text-outline">Oct 20, 02:30 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Rail: Archival Action */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-32 space-y-6">
            <div className="bg-surface-container-highest/50 rounded-xl p-6 border border-primary/10 shadow-sm">
              <h3 className="font-headline font-extrabold text-on-surface mb-6">Archival Action</h3>
              <form className="space-y-6">
                <div>
                  <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Archive Category</label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant/30 text-sm rounded-lg focus:ring-2 focus:ring-primary outline-none px-3 py-2 text-on-surface font-medium">
                    <option>Vendor Contracts</option>
                    <option>Employment Records</option>
                    <option>Financial Audits</option>
                    <option>Legal Templates</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Retention Period</label>
                  <div className="flex items-center gap-2">
                    <input className="w-20 bg-surface-container-lowest border border-outline-variant/30 text-sm rounded-lg focus:ring-2 focus:ring-primary outline-none px-3 py-2 text-on-surface font-bold" type="number" defaultValue="7"/>
                    <span className="text-sm font-bold text-on-surface-variant">Years</span>
                  </div>
                  <p className="text-[10px] text-outline mt-2 font-bold uppercase tracking-wider italic">Expiry: Oct 2031</p>
                </div>
                <div className="pt-4 space-y-3">
                  <button className="w-full bg-primary text-white font-headline font-extrabold py-4 px-4 rounded-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs shadow-lg shadow-primary/20" type="button">
                    <CheckCircle size={14} />
                    Finalize & Archive
                  </button>
                  <button className="w-full border-2 border-primary text-primary font-headline font-extrabold py-4 px-4 rounded-lg hover:bg-primary/5 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs" type="button">
                    <Cancel size={14} />
                    Reject Document
                  </button>
                </div>
              </form>
            </div>
            <div className="p-4 rounded-lg border border-dashed border-outline-variant bg-surface-container-low/50">
              <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                <Info size={14} className="text-primary inline mr-1" />
                Finalizing this document will move it to Immutable Storage. Access will be restricted by standard RBAC policies.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
