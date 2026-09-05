import { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { Workspace } from '../types';
import { 
  Kanban, 
  CheckSquare, 
  Users, 
  History, 
  ChevronDown, 
  Plus, 
  LogOut, 
  Shield, 
  User as UserIcon, 
  RefreshCw,
  Building2,
  Check
} from 'lucide-react';

interface NavbarProps {
  currentView: 'boards' | 'my-tasks' | 'members' | 'activity';
  onViewChange: (view: 'boards' | 'my-tasks' | 'members' | 'activity') => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onSelectWorkspace: (workspace: Workspace) => void;
  onOpenCreateWorkspace: () => void;
  onRefresh: () => void;
}

export function Navbar({
  currentView,
  onViewChange,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onRefresh,
}: NavbarProps) {
  const { user, logout, demoSwitch, resetDemoDatabase } = useAuth();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    if (confirm('Reset all CollabBoard data back to initial default state?')) {
      setIsResetting(true);
      try {
        await resetDemoDatabase();
        onRefresh();
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header id="app-navbar" className="backdrop-blur-xl bg-slate-950/40 border-b border-white/10 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand + Workspace Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                <Kanban className="w-5 h-5" />
              </div>
              <span className="font-bold text-white tracking-tight hidden sm:inline text-lg">
                CollabBoard
              </span>
            </div>

            {/* Workspace Selector Dropdown */}
            <div className="relative">
              <button
                id="workspace-dropdown-btn"
                type="button"
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/15 hover:bg-white/15 text-sm font-medium text-white transition shadow-sm"
              >
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="max-w-[140px] sm:max-w-[200px] truncate text-white">
                  {currentWorkspace?.name || 'Select Workspace'}
                </span>
                {currentWorkspace?.role && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide ${
                      currentWorkspace.role === 'ADMIN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/10 text-white/80 border border-white/15'
                    }`}
                  >
                    {currentWorkspace.role}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-white/50 ml-1" />
              </button>

              {workspaceMenuOpen && (
                <div
                  id="workspace-dropdown-menu"
                  className="absolute left-0 mt-2 w-64 backdrop-blur-2xl bg-slate-900/90 rounded-2xl shadow-2xl border border-white/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-white"
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    My Workspaces
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    {workspaces.map((ws) => {
                      const isSelected = ws.id === currentWorkspace?.id;
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            onSelectWorkspace(ws);
                            setWorkspaceMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between text-sm transition ${
                            isSelected
                              ? 'bg-white/15 text-white font-semibold'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate text-white">{ws.name}</div>
                            <div className="text-xs text-white/40">
                              {ws.boardCount || 0} boards • {ws.taskCount || 0} tasks
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                ws.role === 'ADMIN'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-white/10 text-white/70'
                              }`}
                            >
                              {ws.role}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-white/10 mt-1 pt-1.5 px-2">
                    <button
                      id="btn-create-workspace-navbar"
                      type="button"
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        onOpenCreateWorkspace();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Views */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-boards-tab"
              type="button"
              onClick={() => onViewChange('boards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                currentView === 'boards'
                  ? 'bg-white/15 border border-white/20 text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Kanban className="w-4 h-4 text-indigo-400" />
              Boards
            </button>

            <button
              id="nav-my-tasks-tab"
              type="button"
              onClick={() => onViewChange('my-tasks')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                currentView === 'my-tasks'
                  ? 'bg-white/15 border border-white/20 text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              My Tasks
            </button>

            <button
              id="nav-members-tab"
              type="button"
              onClick={() => onViewChange('members')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                currentView === 'members'
                  ? 'bg-white/15 border border-white/20 text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              Team Members
            </button>

            <button
              id="nav-activity-tab"
              type="button"
              onClick={() => onViewChange('activity')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                currentView === 'activity'
                  ? 'bg-white/15 border border-white/20 text-white shadow-sm font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <History className="w-4 h-4 text-indigo-400" />
              Activity Log
            </button>
          </nav>

          {/* Right Action: Demo User Switcher + User Profile + Logout */}
          <div className="flex items-center gap-2.5">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                id="demo-switcher-btn"
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/10 border border-white/15 hover:bg-white/15 text-xs font-semibold text-white transition shadow-sm"
                title="Switch User to Test RBAC"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-white/70">Role Switcher:</span>
                <span className="text-indigo-300">{user?.name}</span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>

              {demoMenuOpen && (
                <div
                  id="demo-switcher-menu"
                  className="absolute right-0 mt-2 w-64 backdrop-blur-2xl bg-slate-900/90 rounded-2xl shadow-2xl border border-white/15 py-2 z-50 animate-in fade-in duration-100 text-white"
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Switch Active User (RBAC Test)
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {DEMO_USERS.map((u) => {
                      const isActive = u.email === user?.email;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            demoSwitch(u.email);
                            setDemoMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition ${
                            isActive
                              ? 'bg-white/15 text-white font-medium'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[11px] text-white/50">{u.roleDesc}</div>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-white/10 mt-2 pt-2 px-2">
                    <button
                      id="btn-reset-demo-db"
                      type="button"
                      disabled={isResetting}
                      onClick={handleResetData}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                      Reset Demo Seed Data
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar + Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/15">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 text-white font-bold flex items-center justify-center text-xs border border-white/20 shadow-sm"
                title={`${user?.name} (${user?.email})`}
              >
                {user?.name.charAt(0).toUpperCase()}
              </div>

              <button
                id="btn-logout"
                type="button"
                onClick={logout}
                className="p-1.5 text-white/50 hover:text-rose-400 hover:bg-white/10 rounded-xl transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-white/10 gap-2 no-scrollbar">
          <button
            type="button"
            onClick={() => onViewChange('boards')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
              currentView === 'boards'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'text-white/70 bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            Boards
          </button>
          <button
            type="button"
            onClick={() => onViewChange('my-tasks')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
              currentView === 'my-tasks'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'text-white/70 bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            My Tasks
          </button>
          <button
            type="button"
            onClick={() => onViewChange('members')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
              currentView === 'members'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'text-white/70 bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            Members
          </button>
          <button
            type="button"
            onClick={() => onViewChange('activity')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
              currentView === 'activity'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'text-white/70 bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            Activity Log
          </button>
        </div>
      </div>
    </header>
  );
}
