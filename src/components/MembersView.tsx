import { useState, type FormEvent } from 'react';
import { WorkspaceMember, Role } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  UserX, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Lock
} from 'lucide-react';

interface MembersViewProps {
  workspaceId: string;
  currentUserRole?: Role;
  members: WorkspaceMember[];
  onMembersUpdated: () => void;
}

export function MembersView({
  workspaceId,
  currentUserRole = 'MEMBER',
  members,
  onMembersUpdated,
}: MembersViewProps) {
  const { user } = useAuth();
  const isAdmin = currentUserRole === 'ADMIN';

  // Add member form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setMessage(null);
    setLoading(true);

    try {
      await api.addMember(workspaceId, { email: email.trim(), role });
      setMessage({ type: 'success', text: `Successfully added ${email} as ${role}` });
      setEmail('');
      setRole('MEMBER');
      onMembersUpdated();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add member' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: Role) => {
    setMessage(null);
    try {
      await api.updateMemberRole(workspaceId, targetUserId, newRole);
      setMessage({ type: 'success', text: 'Member role updated successfully' });
      onMembersUpdated();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update role' });
    }
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (confirm(`Remove ${name} from this workspace?`)) {
      setMessage(null);
      try {
        await api.removeMember(workspaceId, targetUserId);
        setMessage({ type: 'success', text: `${name} was removed from workspace` });
        onMembersUpdated();
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to remove member' });
      }
    }
  };

  return (
    <div id="members-view" className="space-y-6 max-w-4xl mx-auto py-2 text-white">
      {/* Header with RBAC indicator */}
      <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Workspace Team Members</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-medium border border-white/10">
              {members.length} members
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Manage access control, administrator permissions, and project contributors.
          </p>
        </div>

        {/* Current user's permission pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Your Access:</span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-xs'
                : 'bg-white/10 text-white/70 border-white/15'
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> : <Shield className="w-3.5 h-3.5 text-white/50" />}
            {currentUserRole}
          </span>
        </div>
      </div>

      {/* RBAC Member Notice when not Admin */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl backdrop-blur-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-300">Role-Based Access Control:</span> You are currently signed in as a <span className="font-bold">MEMBER</span>. You have view-only access to team members. Only workspace <span className="font-bold">ADMINs</span> can add, promote, or remove members. You can switch to Arun or Priya via the top-right Role Switcher to test Admin privileges.
          </div>
        </div>
      )}

      {/* Status feedback message */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border backdrop-blur-xl flex items-center gap-2 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-200 border-rose-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Admin Add Member Card */}
      {isAdmin && (
        <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Add Team Member</span>
          </div>

          <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                User Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                <input
                  id="add-member-email-input"
                  type="email"
                  required
                  placeholder="e.g. kishor@gmail.com, priya@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white/10 border border-white/15 text-white placeholder:text-white/30 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                Assigned Role
              </label>
              <select
                id="add-member-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full py-2 px-3 text-xs bg-slate-900/90 border border-white/15 text-white rounded-xl focus:ring-2 focus:ring-indigo-400"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                id="btn-add-member-submit"
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2 px-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/30"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List Table */}
      <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">
            Active Members
          </span>
          <span className="text-xs text-white/40">Total: {members.length}</span>
        </div>

        <div className="divide-y divide-white/10">
          {members.map((member) => {
            const isCurrentUser = member.userId === user?.id;

            return (
              <div
                key={member.id}
                id={`member-row-${member.userId}`}
                className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition"
              >
                {/* User avatar + name & email */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/30 text-indigo-200 font-bold flex items-center justify-center text-sm border border-indigo-400/30 shrink-0 shadow-xs">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {member.user.name}
                      {isCurrentUser && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-normal">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">{member.user.email}</div>
                  </div>
                </div>

                {/* Role badge & Admin controls */}
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as Role)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border focus:ring-2 focus:ring-indigo-400 ${
                        member.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-900/90 text-white border-white/15'
                      }`}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${
                        member.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-white/10 text-white/70 border-white/10'
                      }`}
                    >
                      {member.role}
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId, member.user.name)}
                      disabled={isCurrentUser}
                      className="p-1.5 text-white/40 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition disabled:opacity-20 disabled:cursor-not-allowed"
                      title={isCurrentUser ? 'Cannot remove yourself' : 'Remove Member'}
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
