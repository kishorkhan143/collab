import { useState, useEffect, type FormEvent } from 'react';
import { Task, Column, WorkspaceMember, Comment, Activity, Priority } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  Columns, 
  MessageSquare, 
  Send, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  History,
  AlertCircle
} from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task;
  columns: Column[];
  members: WorkspaceMember[];
  onClose: () => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function TaskDetailsModal({
  task,
  columns,
  members,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailsModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [columnId, setColumnId] = useState(task.columnId);
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await api.getComments(task.id);
      setComments(data);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSaveChanges = async (overrides?: Partial<Task>) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await api.updateTask(task.id, {
        title,
        description,
        priority,
        columnId,
        assigneeId: assigneeId || null,
        dueDate,
        ...overrides,
      });
      onTaskUpdated(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const posted = await api.addComment(task.id, newComment.trim());
      setComments((prev) => [...prev, posted]);
      setNewComment('');
      // notify parent that comment count updated
      onTaskUpdated({
        ...task,
        commentsCount: (task.commentsCount || 0) + 1,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.deleteTask(task.id);
        onTaskDeleted(task.id);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to delete task');
      }
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div 
        id="task-details-modal"
        className="backdrop-blur-2xl bg-slate-900/85 rounded-3xl shadow-2xl border border-white/15 max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${getPriorityColor(priority)}`}>
              {priority}
            </span>
            <span className="text-xs text-white/40 font-mono">ID: {task.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-delete-task"
              type="button"
              onClick={handleDeleteTask}
              className="p-1.5 text-white/40 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              id="btn-close-task-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                Task Title
              </label>
              <input
                id="task-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveChanges()}
                className="w-full text-base font-semibold text-white bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
                Description
              </label>
              <textarea
                id="task-description-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveChanges()}
                placeholder="Add a detailed description..."
                className="w-full text-xs text-white bg-white/10 border border-white/15 rounded-xl p-3.5 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Task Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            {/* Column / Status */}
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-indigo-400" />
                Status / Column
              </label>
              <select
                id="task-column-select"
                value={columnId}
                onChange={(e) => {
                  const newCol = e.target.value;
                  setColumnId(newCol);
                  handleSaveChanges({ columnId: newCol });
                }}
                className="w-full text-xs font-medium bg-slate-900/95 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-400"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-indigo-400" />
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => {
                  const newP = e.target.value as Priority;
                  setPriority(newP);
                  handleSaveChanges({ priority: newP });
                }}
                className="w-full text-xs font-medium bg-slate-900/95 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-400"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Assigned To
              </label>
              <select
                id="task-assignee-select"
                value={assigneeId}
                onChange={(e) => {
                  const newAssignee = e.target.value;
                  setAssigneeId(newAssignee);
                  handleSaveChanges({ assigneeId: newAssignee || null });
                }}
                className="w-full text-xs font-medium bg-slate-900/95 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Due Date
              </label>
              <input
                id="task-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDueDate(newDate);
                  handleSaveChanges({ dueDate: newDate });
                }}
                className="w-full text-xs font-medium bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Comments ({comments.length})
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
              {loadingComments ? (
                <div className="text-xs text-white/40 py-2">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-white/40 py-2 italic">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{c.user.name}</span>
                      <span className="text-[10px] text-white/40">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                id="task-new-comment-input"
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-xs bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                id="btn-post-comment"
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-500/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-white/50">
          <div>
            Created by <span className="font-medium text-white/80">{task.creator?.name || 'User'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white/90 font-medium rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
