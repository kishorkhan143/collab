import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { MyTasksView } from './components/MyTasksView';
import { MembersView } from './components/MembersView';
import { ActivityLogView } from './components/ActivityLogView';
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal';
import { Workspace, WorkspaceMember, Column, Board } from './types';
import { api } from './services/api';
import { Building2, ShieldCheck, Plus, Sparkles, Layers } from 'lucide-react';

function CollabBoardMain() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'boards' | 'my-tasks' | 'members' | 'activity'>('boards');

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  // Modal
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user?.id]);

  useEffect(() => {
    if (currentWorkspace) {
      loadWorkspaceDetails(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const loadWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data);
      if (data.length > 0) {
        // Keep current selected if valid, else pick first
        const matched = currentWorkspace ? data.find(w => w.id === currentWorkspace.id) : null;
        setCurrentWorkspace(matched || data[0]);
      } else {
        setCurrentWorkspace(null);
        setMembers([]);
        setColumns([]);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const loadWorkspaceDetails = async (workspaceId: string) => {
    try {
      const [membersData, boardsData] = await Promise.all([
        api.getMembers(workspaceId).catch(() => []),
        api.getBoards(workspaceId).catch(() => []),
      ]);
      setMembers(membersData);

      // Collect columns from boards
      const allCols: Column[] = [];
      boardsData.forEach((b: Board) => {
        if (b.columns) allCols.push(...b.columns);
      });

      // Default fallback columns if board has none
      if (allCols.length === 0) {
        setColumns([
          { id: 'col-default-1', boardId: '', name: 'TODO', position: 1 },
          { id: 'col-default-2', boardId: '', name: 'IN PROGRESS', position: 2 },
          { id: 'col-default-3', boardId: '', name: 'DONE', position: 3 },
        ]);
      } else {
        // Dedup by column name if multiple boards
        setColumns(allCols.slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading workspace details:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white/70 backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="w-9 h-9 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shadow-lg shadow-indigo-500/30" />
          <p className="text-sm font-medium tracking-wide">Starting CollabBoard...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Auth View (Login / Signup)
  if (!user) {
    return <AuthView />;
  }

  return (
    <div id="collabboard-root" className="min-h-screen flex flex-col text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(ws) => {
          setCurrentWorkspace(ws);
          setCurrentView('boards');
        }}
        onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
        onRefresh={() => {
          loadWorkspaces();
          if (currentWorkspace) loadWorkspaceDetails(currentWorkspace.id);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loadingWorkspaces ? (
          <div className="py-20 text-center text-white/50 text-sm flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading workspaces...</span>
          </div>
        ) : !currentWorkspace ? (
          <div className="max-w-md mx-auto my-16 text-center p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400 shadow-lg shadow-indigo-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">No Workspaces Found</h3>
            <p className="text-sm text-white/60 mt-1.5 mb-6">
              You are not a member of any workspace yet. Create your own workspace to get started as an Administrator!
            </p>
            <button
              id="btn-create-first-workspace"
              type="button"
              onClick={() => setShowCreateWorkspaceModal(true)}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              Create Workspace
            </button>
          </div>
        ) : (
          <div>
            {/* View Switcher Output */}
            {currentView === 'boards' && (
              <KanbanBoard
                workspaceId={currentWorkspace.id}
                members={members}
              />
            )}

            {currentView === 'my-tasks' && (
              <MyTasksView
                workspaceId={currentWorkspace.id}
                columns={columns}
                members={members}
              />
            )}

            {currentView === 'members' && (
              <MembersView
                workspaceId={currentWorkspace.id}
                currentUserRole={currentWorkspace.role}
                members={members}
                onMembersUpdated={() => {
                  loadWorkspaceDetails(currentWorkspace.id);
                  loadWorkspaces();
                }}
              />
            )}

            {currentView === 'activity' && (
              <ActivityLogView workspaceId={currentWorkspace.id} />
            )}
          </div>
        )}
      </main>

      {/* Footer Info banner emphasizing Multi-tenant isolation & Architecture */}
      <footer className="backdrop-blur-xl bg-slate-950/40 border-t border-white/10 py-3.5 px-4 text-xs text-white/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="font-semibold text-white/90">CollabBoard Engine</span>
            <span className="text-white/40">• REST API + JWT Authentication + Multi-Tenant RBAC</span>
          </div>

          <div className="flex items-center gap-3">
            {currentWorkspace && (
              <span className="font-medium text-white/70">
                Tenant: <strong className="text-indigo-300 font-semibold">{currentWorkspace.name}</strong> ({currentWorkspace.role})
              </span>
            )}
            <span className="text-white/20">|</span>
            <span className="text-white/50">Signed in as {user.name}</span>
          </div>
        </div>
      </footer>

      {/* Create Workspace Modal */}
      {showCreateWorkspaceModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspaceModal(false)}
          onWorkspaceCreated={(newWs) => {
            setWorkspaces((prev) => [...prev, newWs]);
            setCurrentWorkspace(newWs);
            setCurrentView('boards');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CollabBoardMain />
    </AuthProvider>
  );
}
