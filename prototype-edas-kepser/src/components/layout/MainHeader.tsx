import { FilterList, Sort } from '../Icons';
import { Role } from '../../types';

interface MainHeaderProps {
  role: Role;
  activeTab: string;
}

export const MainHeader = ({ role, activeTab }: MainHeaderProps) => {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    tasks: 'Dokumen Diajukan',
    docs: 'Dokumen Selesai',
    report: 'Ajukan Laporan',
    approval: 'Persetujuan Dokumen',
    validated: 'Dokumen Tervalidasi',
    revision: 'Revisi Dokumen',
    payment: 'Pencairan Kegiatan',
    finished: 'Daftar Dokumen Selesai',
  };

  const descriptions: Record<string, string> = {
    dashboard: `Welcome back, Sarah. Here is your ${role} workspace overview.`,
    tasks: 'Reviewing active tasks assigned to your role.',
    docs: 'List of completed and archived documents.',
    report: 'Submit a new archival report or document.',
    approval: 'Review and validate incoming archival requests.',
    validated: 'List of documents that have been validated.',
    revision: 'Documents requiring revision or feedback.',
    payment: 'Dokumen tervalidasi PPK yang siap untuk proses pembayaran.',
    finished: 'Daftar dokumen yang telah melalui seluruh proses validasi.',
  };

  return (
    <header className="p-8 pb-6 flex justify-between items-end">
      <div>
        {role !== 'user' && (
          <p className="text-primary font-bold tracking-widest text-[10px] uppercase font-headline mb-1">
            {role.toUpperCase()} PORTAL
          </p>
        )}
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
          {titles[activeTab] || 'Overview'}
        </h1>
        <p className="text-on-surface-variant text-xs mt-1 font-medium max-w-xl">
          {descriptions[activeTab] || 'Manage your documents and workflows.'}
        </p>
      </div>
      <div className="flex gap-2">
        <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-primary/5 transition-colors">
          <FilterList size={14} />
          Filters
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-primary/5 transition-colors">
          <Sort size={14} />
          Sort
        </button>
      </div>
    </header>
  );
};
