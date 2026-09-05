import { useState, type FormEvent } from 'react';
import { Column, WorkspaceMember, Priority, Task } from '../types';
import { api } from '../services/api';
import { X, Flag, User, Calendar, PlusCircle, AlertCircle } from 'lucide-react';

interface CreateTaskModalProps {
  boardId: string;
  columns: Column[];
  members: WorkspaceMember[];
  initialColumnId?: string;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

export function CreateTaskModal({
  boardId,
  columns,
  members,
  initialColumnId,
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [columnId, setColumnId] = useState(initialColumnId || columns[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await api.createTask(boardId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        columnId,
        assigneeId: assigneeId || null,
        dueDate,
      });
      onTaskCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div 
        id="create-task-modal"
        className="backdrop-blur-2xl bg-slate-900/85 rounded-3xl shadow-2xl border border-white/15 max-w-lg w-full p-6 text-white animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-indigo-400">
            <PlusCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Create New Task</h2>
          </div>
          <button
            id="btn-close-create-task-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
              Task Title *
            </label>
            <input
              id="new-task-title"
              type="text"
              required
              placeholder="e.g. Create Login Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
              Description
            </label>
            <textarea
              id="new-task-description"
              rows={3}
              placeholder="Describe requirements, acceptance criteria, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-indigo-400" />
                Priority
              </label>
              <select
                id="new-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full text-xs bg-slate-900/95 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-400"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">
                Column
              </label>
              <select
                id="new-task-column"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full text-xs bg-slate-900/95 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-400"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Assignee
              </label>
              <select
                id="new-task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full text-xs bg-slate-900/95 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Due Date
              </label>
              <input
                id="new-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-task"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition disabled:opacity-50 shadow-lg shadow-indigo-500/30"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
