import { useState, useEffect } from 'react';
import { Activity } from '../types';
import { api } from '../services/api';
import { 
  History, 
  PlusCircle, 
  ArrowRightCircle, 
  MessageSquare, 
  UserCheck, 
  Building2, 
  Kanban, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

interface ActivityLogViewProps {
  workspaceId: string;
}

export function ActivityLogView({ workspaceId }: ActivityLogViewProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [workspaceId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.getActivities(workspaceId);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (act: Activity) => {
    switch (act.action) {
      case 'TASK_MOVED':
        return {
          icon: <ArrowRightCircle className="w-4 h-4 text-sky-400" />,
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          title: 'Moved Task',
          desc: (
            <span>
              moved <strong className="text-white">"{act.metadata?.taskTitle || 'Task'}"</strong> from{' '}
              <span className="font-semibold text-white/90">{act.metadata?.from}</span> to{' '}
              <span className="font-semibold text-emerald-300">{act.metadata?.to}</span>
            </span>
          ),
        };
      case 'TASK_CREATED':
        return {
          icon: <PlusCircle className="w-4 h-4 text-indigo-400" />,
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          title: 'Created Task',
          desc: (
            <span>
              created task <strong className="text-white">"{act.metadata?.taskTitle}"</strong>
              {act.metadata?.priority && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-indigo-300">
                  {act.metadata?.priority}
                </span>
              )}
            </span>
          ),
        };
      case 'TASK_ASSIGNED':
        return {
          icon: <UserCheck className="w-4 h-4 text-amber-400" />,
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          title: 'Assigned Task',
          desc: (
            <span>
              assigned <strong className="text-white">"{act.metadata?.taskTitle}"</strong> to{' '}
              <span className="font-semibold text-indigo-300">{act.metadata?.assigneeName}</span>
            </span>
          ),
        };
      case 'COMMENT_ADDED':
        return {
          icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          title: 'Commented',
          desc: (
            <span>
              commented on <strong className="text-white">"{act.metadata?.taskTitle || 'Task'}"</strong>
            </span>
          ),
        };
      case 'WORKSPACE_CREATED':
        return {
          icon: <Building2 className="w-4 h-4 text-emerald-400" />,
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          title: 'Workspace Created',
          desc: <span>created the workspace <strong className="text-white">"{act.metadata?.workspaceName}"</strong></span>,
        };
      case 'BOARD_CREATED':
        return {
          icon: <Kanban className="w-4 h-4 text-blue-400" />,
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          title: 'Board Created',
          desc: <span>created the board <strong className="text-white">"{act.metadata?.boardName}"</strong></span>,
        };
      case 'MEMBER_ADDED':
        return {
          icon: <UserCheck className="w-4 h-4 text-teal-400" />,
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          title: 'Member Added',
          desc: (
            <span>
              added <strong className="text-white">{act.metadata?.memberName}</strong> as{' '}
              <span className="font-semibold text-indigo-300">{act.metadata?.role}</span>
            </span>
          ),
        };
      default:
        return {
          icon: <History className="w-4 h-4 text-white/50" />,
          bg: 'bg-white/10 text-white/70 border-white/10',
          title: act.action,
          desc: <span>performed action {act.action}</span>,
        };
    }
  };

  return (
    <div id="activity-log-view" className="space-y-6 max-w-4xl mx-auto py-2 text-white">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Workspace Activity Log</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-medium border border-white/10">
              {activities.length} recorded events
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Real-time audit trail of board creations, task movements, comments, and member assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={loadActivities}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition"
          title="Refresh activities"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/60 text-sm">
          <Clock className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
          Loading activity feed...
        </div>
      ) : activities.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 p-12 text-center rounded-3xl border border-white/10 shadow-lg">
          <History className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No activity yet</h3>
          <p className="text-xs text-white/50 mt-1">
            Move tasks or leave comments on the board to generate activity history.
          </p>
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg overflow-hidden divide-y divide-white/10">
          {activities.map((act) => {
            const badge = getActionBadge(act);
            return (
              <div key={act.id} className="p-4 flex items-start gap-3 hover:bg-white/5 transition">
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 shrink-0 mt-0.5 shadow-xs">
                  {badge.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-white">
                      <span>{act.user.name}</span>
                      <span className="text-white/40 font-normal ml-1.5">({act.user.email})</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono shrink-0">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs text-white/70 mt-1.5 leading-relaxed">
                    {badge.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
