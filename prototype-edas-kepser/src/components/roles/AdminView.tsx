import { motion } from 'motion/react';
import { 
  UserPlus, 
  Search, 
  FilterList, 
  Download, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Shield
} from '../Icons';
import { User } from '../../types';

const MOCK_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Amara Setiadi',
    email: 'amara.s@solaris.archive',
    department: 'Editorial Design',
    role: 'Lead Curator',
    status: 'Aktif',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNV_WYDNiMPp0F0KdybO4UZ4CUV8J0zJe_iptAOgdGloJKkshgP9efD34WSl0Xd03vtrLffSk4tsyf9l9nKE6WYljquNrx4vSISNzhidmFIHNR08Lm_iQUZOpr7PX3CxtBXSW3haCbEP47OWDXQLy3MaV16pTconLSRscUL1ouVlKE3u8p36t8BPB9HtLXUy20J3Ya4FERx2fNCYaF3MGwUMA_ABDSdxixot9MIqnvS6NUQqHbzq-HVZQdDrwPcBDdausKmDjq5NY'
  },
  {
    id: 'USR-002',
    name: 'Baskara Putra',
    email: 'baskara.p@solaris.archive',
    department: 'Legal & Compliance',
    role: 'Reviewer',
    status: 'Offline',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwtC4U_aVaLBTsjs5hcHQjRxjBq7Ka035_p62Cu8gOM9qiyT8msjoeAY3nqc8kJh0kapDBkeFkobmhY1fRUbol-QN5nNgUp8G4HzpkSQFA3MTLGSHurtit2YgPf7TDZ-B-hRN5IrF6Av6dmoEaoySQQrRmcRzv4JdoFI6Y5NEvV86tcDJUNj_oiPDd9Cp8B4M9BSAB2_CjQiCQGdCqaXxW_HDdAqD3SqpS9Dt3mtFwkvMUQXhQlkKL8oRDHEcwzkL_gc7RPPv99Cg'
  },
  {
    id: 'USR-003',
    name: 'Citra Lestari',
    email: 'citra.l@solaris.archive',
    department: 'IT Infrastructure',
    role: 'System Admin',
    status: 'Aktif',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIGURtljwKc1I8uilRKxuZDZ0x-bXDTQXaYo_GA-Q_J9CLhYxW30ngzt31-2jwkTqgDHSpk_nRnmt10eAWI-KhHMACStDZQ4IzbkOatZHk5VAVbnVgX59T_PWWTL1_nY5mmGg0mXAQ2PkaaaO375i02q4WYMIyLgEyPGqYy8W4LYMeZxVhJgtTPbnIHJo_Z_aKV3NSYLJ59itt_Hug0vUA025-QfXn4uVWJd7We1GZuiTjisZoGy1fdI3DbBq-WeX_Tl0dwDr6ikE'
  },
  {
    id: 'USR-004',
    name: 'Daffa Arkan',
    email: 'daffa.a@solaris.archive',
    department: 'Asset Management',
    role: 'Archivist',
    status: 'Suspended',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXuaYatuFxgq7_q3TZwhwRYB6b3CS7iN4T77IoOlKspQun-qcB1VDSi1_VLmtKC49BOnfVNe6wZAg1qc7oAJUhQwbBTcSi4xhWUGDMO21QxTvHjGUcsUipM4f8_lKVM1Ql4kAqz5pXxJgsqwYLHIA1xLhYCpIlH28Glqm1SCDL241XqPdvgEZDE5oo9LfHqTy5rtQty_KDWBCJlRb94R_SSv6scvEI4PZnDkT65B3IFig6-lwN3k3PtgJOyRUHOeZuNDHqSLZM7Ys'
  }
];

export const AdminView = () => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
      <header className="p-8 pb-6 flex justify-between items-end">
        <div>
          <p className="text-primary font-bold tracking-widest text-[10px] uppercase font-headline mb-1">USER MANAGEMENT</p>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Master User</h1>
          <p className="text-on-surface-variant text-xs mt-1 font-medium max-w-xl">Manage and curate system access across all departments within the Solaris Archive ecosystem.</p>
        </div>
        <button className="px-6 py-3 bg-primary text-white rounded-lg font-extrabold hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          <UserPlus size={18} /> Tambah User
        </button>
      </header>

      <div className="px-8 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm">
          <p className="text-[9px] font-extrabold text-outline uppercase tracking-wider mb-2">Total Users</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-headline text-on-surface">1,284</span>
            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">+12%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm">
          <p className="text-[9px] font-extrabold text-outline uppercase tracking-wider mb-2">Active Now</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-headline text-on-surface">452</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm">
          <p className="text-[9px] font-extrabold text-outline uppercase tracking-wider mb-2">Pending Tasks</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-headline text-on-surface">28</span>
            <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded uppercase">New</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm">
          <p className="text-[9px] font-extrabold text-outline uppercase tracking-wider mb-2">Storage Used</p>
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '64%' }}></div>
          </div>
          <p className="text-[9px] text-right font-bold text-on-surface-variant mt-1">6.4 GB / 10 GB</p>
        </div>
      </div>

      <div className="px-8 flex-1">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 bg-surface-container-low/50 flex justify-between items-center border-b border-outline-variant/20">
            <div className="flex gap-3">
              <select className="bg-white border border-outline-variant rounded-lg px-3 py-1.5 text-[11px] font-bold text-on-surface-variant focus:ring-1 focus:ring-primary outline-none">
                <option>All Departemen</option>
              </select>
              <select className="bg-white border border-outline-variant rounded-lg px-3 py-1.5 text-[11px] font-bold text-on-surface-variant focus:ring-1 focus:ring-primary outline-none">
                <option>All Roles</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-lg">
                <FilterList size={16} />
              </button>
              <button className="p-2 text-outline hover:text-primary transition-colors hover:bg-primary/5 rounded-lg">
                <Download size={16} />
              </button>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-6 py-3 text-[10px] font-extrabold text-outline uppercase tracking-widest border-b border-outline-variant/20">Nama</th>
                <th className="px-6 py-3 text-[10px] font-extrabold text-outline uppercase tracking-widest border-b border-outline-variant/20">Departemen</th>
                <th className="px-6 py-3 text-[10px] font-extrabold text-outline uppercase tracking-widest border-b border-outline-variant/20">Peran</th>
                <th className="px-6 py-3 text-[10px] font-extrabold text-outline uppercase tracking-widest border-b border-outline-variant/20">Status</th>
                <th className="px-6 py-3 text-[10px] font-extrabold text-outline uppercase tracking-widest border-b border-outline-variant/20 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-outline-variant/20" />
                      <div>
                        <p className="text-sm font-bold text-on-surface">{user.name}</p>
                        <p className="text-[10px] text-outline font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-on-surface-variant">{user.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-surface-container text-[9px] font-extrabold text-outline uppercase rounded">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'Aktif' ? 'bg-green-500' : 
                        user.status === 'Offline' ? 'bg-outline-variant' : 'bg-error'
                      }`}></div>
                      <span className={`text-[11px] font-bold ${
                        user.status === 'Aktif' ? 'text-green-600' : 
                        user.status === 'Offline' ? 'text-outline' : 'text-error'
                      }`}>{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-outline hover:text-primary transition-colors"><Edit size={16} /></button>
                      <button className="p-1.5 text-outline hover:text-error transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/20 flex items-center justify-between">
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Showing 1 to 4 of 1,284 users</p>
            <div className="flex gap-2">
              <button className="p-1 text-outline hover:text-primary transition-colors disabled:opacity-30"><ChevronLeft size={18} /></button>
              <button className="w-7 h-7 flex items-center justify-center bg-primary text-white rounded text-[10px] font-bold">1</button>
              <button className="w-7 h-7 flex items-center justify-center hover:bg-primary/10 text-outline hover:text-primary rounded text-[10px] font-bold transition-colors">2</button>
              <button className="w-7 h-7 flex items-center justify-center hover:bg-primary/10 text-outline hover:text-primary rounded text-[10px] font-bold transition-colors">3</button>
              <button className="p-1 text-outline hover:text-primary transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 flex justify-center gap-8 items-center mt-auto border-t border-outline-variant/20 shrink-0 bg-surface-container-lowest">
        <span className="font-body text-[10px] font-bold tracking-widest text-outline uppercase">Solaris Archive v2.4.1</span>
        <div className="flex gap-6">
          <span className="font-body text-[10px] text-outline font-bold uppercase tracking-widest">Last sync: Today, 14:22 PM</span>
          <span className="font-body text-[10px] text-outline font-bold uppercase tracking-widest flex items-center gap-1">
            <Shield size={12} className="text-primary" /> Encryption Active
          </span>
        </div>
      </footer>
    </div>
  );
};
