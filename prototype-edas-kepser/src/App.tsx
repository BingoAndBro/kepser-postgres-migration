import { useState, useMemo } from 'react';
import { Role, MOCK_DOCUMENTS } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MainHeader } from './components/layout/MainHeader';
import { DetailPane } from './components/layout/DetailPane';
import { Dashboard } from './components/Dashboard';
import { UserView } from './components/roles/UserView';
import { PPKView } from './components/roles/PPKView';
import { TreasurerView } from './components/roles/TreasurerView';
import { ArchivistView } from './components/roles/ArchivistView';
import { AdminView } from './components/roles/AdminView';

export default function App() {
  const [role, setRole] = useState<Role>('user');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(MOCK_DOCUMENTS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = useMemo(() => {
    return MOCK_DOCUMENTS.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const renderRoleView = () => {
    if (activeTab === 'dashboard') return <Dashboard />;
    
    switch (role) {
      case 'user':
        return <UserView filteredDocs={filteredDocs} selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc} role={role} />;
      case 'ppk':
        return <PPKView filteredDocs={filteredDocs} selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc} role={role} />;
      case 'bendahara':
        return <TreasurerView filteredDocs={filteredDocs} selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc} role={role} />;
      case 'arsiparis':
        return <ArchivistView filteredDocs={filteredDocs} selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc} role={role} />;
      case 'admin':
        return <AdminView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background relative selection:bg-primary-container selection:text-on-primary-container">
      {/* Moving Background Mesh */}
      <div className="mesh-bg">
        <div className="mesh-blob mesh-blob-1"></div>
        <div className="mesh-blob mesh-blob-2"></div>
        <div className="mesh-blob mesh-blob-3"></div>
      </div>

      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          role={role} 
          setRole={setRole} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />

        <main className="flex-1 flex overflow-hidden">
          <section className="flex-1 flex flex-col min-w-0 bg-background border-r border-outline-variant/15">
            {!(activeTab !== 'dashboard' && (role === 'arsiparis' || role === 'admin')) && (
              <MainHeader role={role} activeTab={activeTab} />
            )}
            
            {renderRoleView()}
            
            <footer className="w-full py-4 flex justify-center gap-8 items-center mt-auto border-t border-outline-variant/15 shrink-0 bg-surface-container-lowest">
              <span className="font-body text-[10px] font-bold tracking-widest text-outline uppercase">© 2024 Solaris DMS Archive</span>
              <div className="flex gap-6">
                <button className="font-body text-[10px] text-outline hover:text-primary font-bold uppercase transition-colors">Support</button>
                <button className="font-body text-[10px] text-outline hover:text-primary font-bold uppercase transition-colors">Terms</button>
              </div>
            </footer>
          </section>

          {activeTab !== 'dashboard' && role !== 'arsiparis' && role !== 'admin' && (
            <DetailPane selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc} role={role} />
          )}
        </main>
      </div>
    </div>
  );
}
