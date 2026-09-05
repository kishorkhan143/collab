import { useState, type FormEvent } from 'react';
import { api } from '../services/api';
import { Board } from '../types';
import { X, Kanban, AlertCircle } from 'lucide-react';

interface CreateBoardModalProps {
  workspaceId: string;
  onClose: () => void;
  onBoardCreated: (b: Board) => void;
}

export function CreateBoardModal({ workspaceId, onClose, onBoardCreated }: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await api.createBoard(workspaceId, {
        name: name.trim(),
      });
      onBoardCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div 
        id="create-board-modal"
        className="backdrop-blur-2xl bg-slate-900/85 rounded-3xl shadow-2xl border border-white/15 max-w-md w-full p-6 text-white animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-indigo-400">
            <Kanban className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">Create Board</h2>
          </div>
          <button
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
              Board Name *
            </label>
            <input
              id="new-board-name"
              type="text"
              required
              placeholder="e.g. Development Board, Testing Board"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-white/70">
            Default columns will automatically be created:
            <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-indigo-300 font-semibold">
              <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">TODO</span>
              <span className="text-white/40">→</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">IN PROGRESS</span>
              <span className="text-white/40">→</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">DONE</span>
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
              id="btn-submit-create-board"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition disabled:opacity-50 shadow-lg shadow-indigo-500/30"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
