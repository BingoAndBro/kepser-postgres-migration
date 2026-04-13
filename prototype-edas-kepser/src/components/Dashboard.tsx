import { motion } from 'motion/react';
import { 
  AddBox, 
  FolderOpen, 
  AssignmentInd, 
  Archive, 
  Network, 
  History 
} from './Icons';

export const Dashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
      <div className="p-8 space-y-12 relative z-10 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-end gap-8"
        >
          <div className="max-w-2xl">
            <span className="text-primary font-headline text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Workspace Overview</span>
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-on-surface leading-tight tracking-tighter">
              Crafting the <span className="text-primary">Legacy</span> of Information.
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-4 rounded-lg font-headline font-bold text-sm shadow-xl shadow-primary/20 flex items-center gap-3 animate-breath uppercase tracking-widest"
            >
              <AddBox size={20} />
              Ajukan Laporan
            </motion.button>
            <p className="mt-4 text-[10px] text-outline font-bold uppercase tracking-wider">Last synced: 2 minutes ago</p>
          </div>
        </motion.div>

        {/* Quick Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/10 flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">System Status: Optimal</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/10 flex items-center gap-4 col-span-2">
            <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest shrink-0">Storage: 82% Full</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary w-[82%] shadow-[0_0_15px_rgba(139,92,246,0.3)]"></div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/10 flex items-center justify-center gap-4">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">12 New Notifications</span>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-12 gap-8"
        >
          {/* Summary Bento Grid */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Documents */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-lg shadow-primary/10">
                <FolderOpen size={28} />
              </div>
              <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em] mb-2">Total Documents</p>
              <h3 className="text-4xl font-headline font-black text-on-surface">12,482</h3>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg font-black uppercase tracking-widest">+12.5%</span>
                <span className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">Growth</span>
              </div>
            </motion.div>

            {/* Pending Reviews */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-lg shadow-primary/10">
                <AssignmentInd size={28} />
              </div>
              <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em] mb-2">Pending Reviews</p>
              <h3 className="text-4xl font-headline font-black text-on-surface">38</h3>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-black uppercase tracking-widest">Priority</span>
                <span className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">Action</span>
              </div>
            </motion.div>

            {/* Archived Files */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-8 group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-lg shadow-secondary/10">
                <Archive size={28} />
              </div>
              <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em] mb-2">Archived Files</p>
              <h3 className="text-4xl font-headline font-black text-on-surface">8,920</h3>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 bg-white/5 text-on-surface-variant rounded-lg font-black uppercase tracking-widest">Optimized</span>
                <span className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest">Healthy</span>
              </div>
            </motion.div>

            {/* Chart: Document Activity */}
            <motion.div 
              variants={itemVariants}
              className="col-span-1 md:col-span-3 bg-white/5 backdrop-blur-xl p-10 rounded-2xl border border-white/10 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h4 className="text-xl font-headline font-black tracking-tight">Document Activity</h4>
                  <p className="text-xs text-on-surface-variant/60 font-bold">Statistical flow of archival operations</p>
                </div>
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                  <button className="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-primary text-white shadow-lg shadow-primary/20 transition-all">Monthly</button>
                  <button className="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg text-on-surface-variant/40 hover:text-on-surface transition-all">Weekly</button>
                </div>
              </div>
              <div className="h-72 flex items-end justify-between gap-6 pt-4 px-2">
                {[40, 60, 55, 85, 70, 95].map((h, i) => (
                  <div key={i} className="w-full flex flex-col items-center gap-4 group">
                    <div className="w-full bg-white/5 rounded-t-xl relative overflow-hidden h-full">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "circOut" }}
                        className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-primary/40 opacity-80 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                      />
                    </div>
                    <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">
                      {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Side Bento Column */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            {/* Office Agenda Section */}
            <motion.div 
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 flex flex-col gap-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-headline font-black tracking-tight">Office Agenda</h4>
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-lg shadow-primary/10">
                  <Network size={20} />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <span key={`${d}-${i}`} className="text-[10px] font-black text-center text-on-surface-variant/40 uppercase tracking-[0.2em]">{d}</span>
                ))}
                {[...Array(31)].map((_, i) => {
                  const day = i - 2; // Offset to start at Wednesday for demo
                  if (day < 1) return <div key={i} className="aspect-square flex items-center justify-center text-xs text-outline/20"></div>;
                  if (day > 11) return null;
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        day === 9 ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-on-surface hover:bg-white/5'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-1 h-8 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Archive Audit Q1</p>
                    <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-widest">09:00 AM - 11:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-1 h-8 bg-secondary rounded-full"></div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Team Sync</p>
                    <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-widest">02:00 PM - 03:00 PM</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Storage Distribution */}
            <motion.div 
              variants={itemVariants}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all"
            >
              <h4 className="text-xl font-headline font-black tracking-tight mb-8">Storage Distribution</h4>
              <div className="flex items-center justify-center mb-10 relative">
                <div className="w-48 h-48 rounded-full border-[16px] border-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-black text-on-surface">82%</p>
                    <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Used</p>
                  </div>
                </div>
                {/* Simulated Pie Segments */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="88" fill="none" stroke="currentColor" strokeWidth="16" strokeDasharray="553" strokeDashoffset="100" className="text-primary opacity-80" />
                  <circle cx="50%" cy="50%" r="88" fill="none" stroke="currentColor" strokeWidth="16" strokeDasharray="553" strokeDashoffset="450" className="text-secondary opacity-80" />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                    <span className="text-xs font-bold text-on-surface">Financial Docs</span>
                  </div>
                  <span className="text-xs font-black text-primary">65%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                    <span className="text-xs font-bold text-on-surface">Legal Archive</span>
                  </div>
                  <span className="text-xs font-black text-secondary">25%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                    <span className="text-xs font-bold text-on-surface">Others</span>
                  </div>
                  <span className="text-xs font-black text-tertiary">10%</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* System Health & Team */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-sm"
            >
              <h4 className="text-lg font-headline font-black tracking-tight mb-6">System Health</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                    <span className="text-on-surface-variant/40">Server Load</span>
                    <span className="text-primary">24%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '24%' }}
                      className="h-full bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                    <span className="text-on-surface-variant/40">Uptime</span>
                    <span className="text-green-500">99.9%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '99.9%' }}
                      className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-sm flex-1"
            >
              <h4 className="text-lg font-headline font-black tracking-tight mb-6">Active Team</h4>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="relative group">
                    <div className="w-11 h-11 rounded-2xl border-2 border-white/10 overflow-hidden shadow-lg group-hover:scale-110 group-hover:border-primary transition-all duration-300">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full shadow-lg"></div>
                  </div>
                ))}
                <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-[10px] font-black text-on-surface-variant/60 border-2 border-white/10 shadow-lg">
                  +12
                </div>
              </div>
              <p className="mt-4 text-[10px] text-on-surface-variant/40 font-black uppercase tracking-[0.2em]">17 users online now</p>
            </motion.div>
          </div>

          {/* Recent Activity Timeline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-12 bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-sm"
          >
            <div className="flex justify-between items-center mb-10">
              <div>
                <h4 className="text-xl font-headline font-black tracking-tight">Recent Activity</h4>
                <p className="text-xs text-on-surface-variant/60 font-bold">Live stream of archival events</p>
              </div>
              <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 hover:text-on-surface transition-colors">
                <History size={16} />
                Full Log
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-white/5"></div>
              <div className="space-y-8">
                {[
                  { time: '10:24 AM', user: 'Sarah Connor', action: 'Archived', doc: 'Financial_Report_Q1.pdf', color: 'bg-primary' },
                  { time: '09:15 AM', user: 'John Doe', action: 'Validated', doc: 'Legal_Contract_v2.docx', color: 'bg-green-500' },
                  { time: 'Yesterday', user: 'System', action: 'Maintenance', doc: 'Database Optimization', color: 'bg-secondary' },
                  { time: 'Yesterday', user: 'Sarah Connor', action: 'Uploaded', doc: 'Project_Legacy_Draft.pdf', color: 'bg-primary' },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 relative"
                  >
                    <div className={`w-6 h-6 rounded-full ${item.color} border-4 border-background shadow-lg z-10 shrink-0`}></div>
                    <div className="flex-1 pb-2 border-b border-white/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            <span className="text-primary">{item.user}</span> {item.action} <span className="italic opacity-60">"{item.doc}"</span>
                          </p>
                          <p className="text-[10px] text-on-surface-variant/40 font-black mt-1 uppercase tracking-[0.2em]">Operation successful • ID: #ARC-{1000 + i}</p>
                        </div>
                        <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{item.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
