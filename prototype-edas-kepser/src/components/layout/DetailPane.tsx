import { Close, PictureAsPdf, ZoomIn, ContentCopy, VerifiedUser, FactCheck, EditDocument, Info } from '../Icons';
import { Document, Role } from '../../types';

interface DetailPaneProps {
  selectedDoc: Document | null;
  setSelectedDoc: (doc: Document | null) => void;
  role: Role;
}

export const DetailPane = ({ selectedDoc, setSelectedDoc, role }: DetailPaneProps) => {
  if (!selectedDoc) return null;

  return (
    <aside className="w-[380px] h-full bg-surface-container flex flex-col shrink-0 border-l border-outline-variant/15">
      <div className="p-8 h-full flex flex-col overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-headline font-extrabold text-xl text-on-surface tracking-tight">Document Details</h3>
          <button onClick={() => setSelectedDoc(null)} className="text-outline hover:text-primary transition-colors p-1">
            <Close size={20} />
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm mb-8 border border-outline-variant/15">
          <div className="h-40 bg-primary/5 relative group flex items-center justify-center">
            <PictureAsPdf size={48} className="text-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <ZoomIn size={32} className="text-primary" />
            </div>
          </div>
          <div className="p-4 flex justify-between items-center bg-white">
            <span className="text-[9px] font-extrabold text-outline uppercase tracking-widest">Preview Mode</span>
            <button className="text-primary text-[10px] font-extrabold hover:underline uppercase tracking-wider">Expand View</button>
          </div>
        </div>

        <div className="flex-1 space-y-8 pr-1">
          <div className="flex border-b border-outline-variant/15">
            <button className="px-5 py-3 text-[11px] font-extrabold text-primary border-b-2 border-primary uppercase tracking-wider">Metadata</button>
            <button className="px-5 py-3 text-[11px] font-bold text-outline hover:text-on-surface transition-colors uppercase tracking-wider">History</button>
            <button className="px-5 py-3 text-[11px] font-bold text-outline hover:text-on-surface transition-colors uppercase tracking-wider">Links</button>
          </div>

          <div className="space-y-5">
            <div className="group">
              <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Document ID</label>
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/40 group-hover:border-primary transition-colors">
                <span className="text-xs font-bold text-on-surface">{selectedDoc.id}</span>
                <ContentCopy size={16} className="text-outline cursor-pointer hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="group">
              <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Owner</label>
              <div className="flex items-center gap-3 py-2 border-b border-outline-variant/40 group-hover:border-primary transition-colors">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {selectedDoc.owner.charAt(0)}
                </div>
                <span className="text-xs font-bold text-on-surface">{selectedDoc.owner}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Dept</label>
                <div className="py-2 border-b border-outline-variant/40 group-hover:border-primary transition-colors">
                  <span className="text-xs font-bold text-on-surface">{selectedDoc.deptFunction}</span>
                </div>
              </div>
              <div className="group">
                <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Year</label>
                <div className="py-2 border-b border-outline-variant/40 group-hover:border-primary transition-colors">
                  <span className="text-xs font-bold text-on-surface">{selectedDoc.year}</span>
                </div>
              </div>
            </div>

            {role === 'arsiparis' && (
              <div className="group">
                <label className="text-[9px] font-extrabold text-outline uppercase tracking-[0.15em] block mb-1">Masa Retensi Arsip</label>
                <div className="py-2 border-b border-outline-variant/40 group-hover:border-primary transition-colors">
                  <span className="text-xs font-bold text-on-surface">{selectedDoc.retentionPeriod || '-'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-4 pb-4 shrink-0">
          <button className="flex-1 py-4 sunset-gradient text-white rounded-lg font-extrabold hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
            {role === 'bendahara' ? 'Setujui Pencairan' : 'Approve'}
          </button>
          <button className="flex-1 py-4 border-2 border-primary text-primary rounded-lg font-extrabold hover:bg-primary/5 transition-all active:scale-95 text-xs uppercase tracking-widest">
            Reject
          </button>
        </div>
        <p className="text-[9px] text-center text-outline mt-2 uppercase tracking-tighter">
          {role === 'bendahara' ? 'Approval will trigger automated bank instruction' : 'Approval will authorize subsequent processes'}
        </p>
      </div>
    </aside>
  );
};
