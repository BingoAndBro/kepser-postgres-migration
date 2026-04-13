import { Search, Notifications, Settings, LayoutDashboard } from '../Icons';
import { Role } from '../../types';

interface HeaderProps {
  role: Role;
  setRole: (role: Role) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header = ({ role, setRole, searchQuery, setSearchQuery }: HeaderProps) => {
  return (
    <header className="h-20 flex justify-between items-center px-10 bg-background/60 backdrop-blur-xl border-b border-outline-variant/10 z-40">
      <div className="flex items-center gap-12 flex-1">
        <div className="flex items-center gap-4">
          {role === 'admin' ? (
            <span className="text-xl font-extrabold tracking-tight text-primary shrink-0">Admin Curator</span>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full sunset-gradient flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <LayoutDashboard size={20} />
              </div>
              <h2 className="text-2xl font-black tracking-tighter text-on-surface font-headline shrink-0">Dashboard</h2>
            </>
          )}
        </div>

        {role === 'admin' && (
          <nav className="hidden md:flex gap-6 items-center h-full">
            <button className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">Dashboard</button>
            <button className="text-primary border-b-2 border-primary pb-1 font-bold text-sm">System</button>
            <button className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">Audit</button>
            <button className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">Logs</button>
          </nav>
        )}

        <div className="relative group flex-1 max-w-2xl">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-outline/40">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder={role === 'admin' ? "Quick search users..." : "Search documents, archives, or tasks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 pr-6 py-3.5 bg-surface-container/30 border border-outline-variant/20 rounded-2xl w-full text-sm focus:ring-2 focus:ring-primary/40 focus:bg-surface-container placeholder:text-outline/40 outline-none transition-all shadow-inner group-hover:border-outline-variant/40"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-5">
          <button className="text-outline hover:text-primary hover:bg-primary/5 p-2.5 rounded-xl transition-all relative">
            <Notifications size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
          </button>
          <button className="text-outline hover:text-primary hover:bg-primary/5 p-2.5 rounded-xl transition-all">
            <Settings size={22} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 pl-8 border-l border-outline-variant/10">
          <div className="flex flex-col items-end mr-2">
            <label className="text-[8px] font-black text-outline uppercase tracking-[0.2em] mb-1">Switch Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-surface-container/50 border border-outline-variant/20 rounded-lg text-[10px] font-black uppercase tracking-widest px-2 py-1 outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer hover:bg-surface-container transition-all"
            >
              <option value="user">User</option>
              <option value="ppk">PPK</option>
              <option value="bendahara">Bendahara</option>
              <option value="arsiparis">Arsiparis</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-on-surface uppercase tracking-wider">
              {role === 'admin' ? 'Alex Curator' : 'Sarah Connor'}
            </p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              {role === 'admin' ? 'Super Administrator' : role}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 p-0.5 shadow-xl">
            <div className="w-full h-full rounded-[14px] overflow-hidden border-2 border-background">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKnJgXl3SKGZYbh9W4B0Y2wkFx__w4_ftBo1IsKtyrP23bPegUVbRGEd8DxsDCxIZMCYT6rvclYWxlklhLbArUi-ZGiGDMJnqFrFJ_pV2l-sgC1U7yDA1nrrHNY5khQ7IAxwP87pxk5pcokDAFZ_J6RZQua0XHBUyJHRRF8EBZ72-9fJTwHXxbMSxYwkv4Lfddeg80Z3UA-tkWzv7CW2SzWfxtTiKDoBAxg73DgdbmCwKfPsmk-Z_YNOe9fEcggedsuEZ1uuQCjNE" 
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
