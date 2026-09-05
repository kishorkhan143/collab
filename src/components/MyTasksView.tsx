import { useState, useEffect } from 'react';
import { Task, Column, WorkspaceMember } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, 
  Calendar, 
  Flag, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ListTodo
} from 'lucide-react';
import { TaskDetailsModal } from './TaskDetailsModal';

interface MyTasksViewProps {
  workspaceId: string;
  columns: Column[];
  members: WorkspaceMember[];
}

export function MyTasksView({ workspaceId, columns, members }: MyTasksViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadMyTasks();
  }, [workspaceId, user?.id]);

  const loadMyTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getMyTasks(workspaceId);
      setTasks(data);
    } catch (err) {
      console.error('Error loading my tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, targetColumnId: string) => {
    try {
      const updated = await api.updateTask(taskId, { columnId: targetColumnId });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Failed to update task column:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-white/10 text-white/70 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/60 text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
        Loading your assigned tasks...
      </div>
    );
  }

  // Group tasks by column
  const groupedTasks: Record<string, Task[]> = {};
  columns.forEach((col) => {
    groupedTasks[col.id] = tasks.filter((t) => t.columnId === col.id);
  });

  return (
    <div id="my-tasks-view" className="space-y-6 max-w-5xl mx-auto py-2 text-white">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <span>My Tasks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/30">
              {tasks.length} Assigned
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Tasks assigned directly to <span className="font-semibold text-white">{user?.name}</span> ({user?.email})
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 p-12 text-center rounded-3xl border border-white/10 shadow-lg">
          <ListTodo className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No tasks assigned to you yet</h3>
          <p className="text-xs text-white/50 mt-1">
            Switch to the "Boards" tab to create a task and assign it to yourself, or use the Role Switcher to switch to Kishor or Arun.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => {
            const colTasks = groupedTasks[col.id] || [];

            return (
              <div
                key={col.id}
                className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg overflow-hidden flex flex-col"
              >
                {/* Column header */}
                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        col.name === 'TODO'
                          ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                          : col.name === 'IN PROGRESS'
                          ? 'bg-sky-400 shadow-sm shadow-sky-400/50'
                          : col.name === 'DONE'
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                          : 'bg-indigo-400 shadow-sm shadow-indigo-400/50'
                      }`}
                    />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      {col.name}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-white/70 px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks list */}
                <div className="p-3 space-y-3 flex-1 min-h-[220px]">
                  {colTasks.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-white/40 text-xs italic">
                      No tasks in {col.name}
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="p-3.5 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/[0.08] hover:bg-white/[0.13] hover:shadow-lg hover:shadow-indigo-500/10 hover:border-white/20 cursor-pointer transition space-y-2 text-white"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>

                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={task.columnId}
                              onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                              className="text-[10px] bg-slate-900/90 border border-white/15 rounded-md px-1.5 py-0.5 text-white/80 font-medium"
                            >
                              {columns.map((c) => (
                                <option key={c.id} value={c.id}>
                                  → {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-white leading-snug">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-white/60 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
                          {task.dueDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              Due: {task.dueDate}
                            </span>
                          ) : (
                            <span>No due date</span>
                          )}

                          {(task.commentsCount || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-indigo-400" />
                              {task.commentsCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          columns={columns}
          members={members}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTask(updated);
          }}
          onTaskDeleted={(deletedId) => {
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
