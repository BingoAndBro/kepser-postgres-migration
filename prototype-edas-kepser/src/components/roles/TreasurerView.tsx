import { PictureAsPdf, Description as DocIcon } from '../Icons';
import { Document, Role } from '../../types';

interface TreasurerViewProps {
  filteredDocs: Document[];
  selectedDoc: Document | null;
  setSelectedDoc: (doc: Document) => void;
  role: Role;
}

export const TreasurerView = ({ filteredDocs, selectedDoc, setSelectedDoc, role }: TreasurerViewProps) => {
  return (
    <div className="flex-1 overflow-auto px-8 custom-scrollbar">
      <table className="w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-[10px] text-outline font-bold uppercase tracking-[0.1em]">
            <th className="pb-2 pl-4">Document Name</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Validated by</th>
            <th className="pb-2 text-right pr-4">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocs.map((doc) => (
            <tr 
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`group cursor-pointer transition-all duration-200 ${
                selectedDoc?.id === doc.id 
                  ? 'bg-surface-container-lowest ring-2 ring-primary shadow-lg scale-[1.01] relative z-10' 
                  : 'bg-surface-container-lowest border border-outline-variant/15 hover:shadow-md'
              }`}
            >
              <td className={`py-4 pl-4 rounded-l-lg border-y border-l ${selectedDoc?.id === doc.id ? 'border-primary' : 'border-outline-variant/15'}`}>
                <div className="flex items-center gap-3">
                  {doc.type === 'pdf' ? <PictureAsPdf className="text-primary" /> : <DocIcon className="text-outline" />}
                  <span className={`text-sm ${selectedDoc?.id === doc.id ? 'font-bold' : 'font-semibold'} text-on-surface`}>
                    {doc.name}
                  </span>
                </div>
              </td>
              <td className={`py-4 border-y ${selectedDoc?.id === doc.id ? 'border-primary' : 'border-outline-variant/15'}`}>
                <span className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wider ${
                  doc.status === 'Approved' || doc.status === 'Ready to Pay'
                    ? 'bg-primary/10 text-primary'
                    : doc.status === 'Revision'
                    ? 'bg-error-container/10 text-error'
                    : 'bg-secondary-container text-on-secondary-container'
                }`}>
                  {doc.status}
                </span>
              </td>
              <td className={`py-4 text-on-surface-variant text-[11px] font-medium border-y ${selectedDoc?.id === doc.id ? 'border-primary' : 'border-outline-variant/15'}`}>
                Pejabat Pembuat Komitmen
              </td>
              <td className={`py-4 text-right pr-4 rounded-r-lg border-y border-r ${selectedDoc?.id === doc.id ? 'border-primary' : 'border-outline-variant/15'} text-outline text-[11px]`}>
                {doc.modified}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
