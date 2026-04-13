import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  AssignmentInd, 
  Description, 
  AddBox, 
  VerifiedUser,
  FactCheck,
  EditDocument,
  Payments,
  TaskAlt,
  Archive,
  FolderOpen,
  Network,
  History,
  Settings,
  Help,
  Logout,
  Shield,
  Building,
  ClipboardList,
  FileCheck,
  Cloud
} from '../Icons';
import { Role } from '../../types';

interface SidebarProps {
  role: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ role, activeTab, setActiveTab }: SidebarProps) => {
  const menuGroups = [
    {
      title: 'GENERAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      ]
    },
    {
      title: role === 'arsiparis' ? 'ARCHIVE' : 'MANAGEMENT',
      items: role === 'user' ? [
        { id: 'tasks', label: 'Dokumen Diajukan', icon: <AssignmentInd size={18} />, badge: 12 },
        { id: 'docs', label: 'Dokumen Selesai', icon: <Description size={18} /> },
        { id: 'report', label: 'Ajukan Laporan', icon: <AddBox size={18} /> },
      ] : role === 'ppk' ? [
        { id: 'approval', label: 'Persetujuan Dokumen', icon: <VerifiedUser size={18} /> },
        { id: 'validated', label: 'Dokumen Tervalidasi', icon: <FactCheck size={18} /> },
        { id: 'revision', label: 'Revisi Dokumen', icon: <EditDocument size={18} /> },
        { id: 'finished', label: 'Daftar Dokumen Selesai', icon: <TaskAlt size={18} /> },
      ] : role === 'bendahara' ? [
        { id: 'payment', label: 'Pencairan Kegiatan', icon: <Payments size={18} />, badge: 12 },
        { id: 'finished', label: 'Daftar Dokumen Selesai', icon: <TaskAlt size={18} /> },
      ] : role === 'arsiparis' ? [
        { id: 'filing', label: 'Pemberkasan Arsip', icon: <Archive size={18} /> },
        { id: 'active_archive', label: 'Daftar Arsip Aktif', icon: <FolderOpen size={18} /> },
        { id: 'inactive_archive', label: 'Daftar Arsip Inaktif', icon: <Archive size={18} /> },
        { id: 'classification', label: 'Klasifikasi Arsip', icon: <Network size={18} /> },
      ] : [
        { id: 'master_user', label: 'Master User', icon: <Shield size={18} /> },
        { id: 'dept_function', label: 'Departemen Fungsi', icon: <Building size={18} /> },
        { id: 'master_activity', label: 'Master Kegiatan', icon: <ClipboardList size={18} /> },
        { id: 'doc_completeness', label: 'Kelengkapan Dokumen', icon: <FileCheck size={18} /> },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'history', label: 'Activity Log', icon: <History size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
      ]
    }
  ];

  return (
    <aside className="w-72 h-full bg-surface-container-lowest/40 backdrop-blur-2xl flex flex-col py-8 px-6 gap-8 border-r border-white/5 shrink-0 z-50">
      <div className="px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            {role === 'admin' ? <Cloud size={18} className="text-white" /> : <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>}
          </div>
          <h2 className="font-headline font-extrabold text-xl tracking-tight text-on-surface">
            {role === 'admin' ? 'Curator Admin' : 'DMS Architect'}
          </h2>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary ml-11">
          {role === 'admin' ? 'System Management' : `${role} Workspace`}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-8">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-[10px] font-black text-outline uppercase tracking-[0.25em] px-4">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item: any) => (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 group ${
                    activeTab === item.id 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                      : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${activeTab === item.id ? 'text-white' : 'text-outline group-hover:text-primary'} transition-colors`}>
                      {item.icon}
                    </span>
                    <span className={`text-sm tracking-tight ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${
                      activeTab === item.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-1 border-t border-outline-variant/10 pt-6">
          <button className="flex items-center gap-3 text-outline text-[11px] font-bold p-3 hover:text-primary transition-all group">
            <Help size={16} className="group-hover:rotate-12 transition-transform" />
            Support Center
          </button>
          <button className="flex items-center gap-3 text-outline text-[11px] font-bold p-3 hover:text-error transition-all group">
            <Logout size={16} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};
