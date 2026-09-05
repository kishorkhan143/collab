import { useState, useEffect, type DragEvent } from 'react';
import { Board, Column, Task, WorkspaceMember, Priority } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  MessageSquare, 
  Kanban, 
  ChevronRight, 
  MoreHorizontal,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { TaskDetailsModal } from './TaskDetailsModal';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateBoardModal } from './CreateBoardModal';

interface KanbanBoardProps {
  workspaceId: string;
  members: WorkspaceMember[];
}

export function KanbanBoard({ workspaceId, members }: KanbanBoardProps) {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');

  // Drag & drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [workspaceId]);

  useEffect(() => {
    if (activeBoard) {
      loadTasks(activeBoard.id);
    }
  }, [activeBoard?.id]);

  const loadBoards = async () => {
    setLoading(true);
    try {
      const data = await api.getBoards(workspaceId);
      setBoards(data);
      if (data.length > 0) {
        // Keep active board if present, else pick first
        const currentStillExists = data.find(b => b.id === activeBoard?.id);
        setActiveBoard(currentStillExists || data[0]);
      } else {
        setActiveBoard(null);
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (boardId: string) => {
    try {
      const data = await api.getTasks(boardId);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = async (e: DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.columnId === targetColumnId) return;

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, columnId: targetColumnId } : t))
    );

    try {
      await api.updateTask(taskId, { columnId: targetColumnId });
    } catch (err) {
      console.error('Failed to move task:', err);
      // Revert on error
      if (activeBoard) loadTasks(activeBoard.id);
    }
  };

  const handleQuickMove = async (taskId: string, targetColumnId: string) => {
    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, columnId: targetColumnId } : t))
    );

    try {
      await api.updateTask(taskId, { columnId: targetColumnId });
    } catch (err) {
      console.error('Failed to move task:', err);
      if (activeBoard) loadTasks(activeBoard.id);
    }
  };

  // Filtering tasks
  const filteredTasks = tasks.filter(task => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
      return false;
    }

    if (selectedAssignee !== 'ALL') {
      if (selectedAssignee === 'UNASSIGNED') {
        if (task.assigneeId) return false;
      } else if (task.assigneeId !== selectedAssignee) {
        return false;
      }
    }

    return true;
  });

  const getPriorityBadge = (p: Priority) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-white/60 text-sm">
        <Kanban className="w-5 h-5 animate-pulse mr-2 text-indigo-400" />
        Loading Kanban board...
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400 shadow-lg shadow-indigo-500/20">
          <Kanban className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white">No Boards Yet</h3>
        <p className="text-sm text-white/60 mt-1.5 mb-6">
          Create your first board (e.g. Development Board) with TODO, IN PROGRESS, and DONE columns.
        </p>
        <button
          id="btn-create-first-board"
          type="button"
          onClick={() => setShowCreateBoardModal(true)}
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition shadow-lg shadow-indigo-500/30"
        >
          <Plus className="w-4 h-4" />
          Create Board
        </button>

        {showCreateBoardModal && (
          <CreateBoardModal
            workspaceId={workspaceId}
            onClose={() => setShowCreateBoardModal(false)}
            onBoardCreated={(b) => {
              setBoards([b]);
              setActiveBoard(b);
            }}
          />
        )}
      </div>
    );
  }

  const columns = activeBoard?.columns || [];

  return (
    <div id="kanban-view" className="space-y-4">
      {/* Board Selector Tabs & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {boards.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveBoard(b)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeBoard?.id === b.id
                  ? 'bg-white/15 border border-white/20 text-white shadow-xs'
                  : 'backdrop-blur-md bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-indigo-400" />
              {b.name}
            </button>
          ))}

          <button
            id="btn-add-board"
            type="button"
            onClick={() => setShowCreateBoardModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-300 hover:text-white backdrop-blur-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 flex items-center gap-1.5 whitespace-nowrap transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Board
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-create-task-top"
            type="button"
            onClick={() => {
              setCreateTaskColumnId(columns[0]?.id || null);
              setShowCreateTaskModal(true);
            }}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Task
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 backdrop-blur-xl bg-white/5 p-3 rounded-2xl border border-white/10 shadow-lg">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-2.5" />
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Filters:</span>
          </div>

          <select
            id="filter-priority-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-900/90 border border-white/15 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-indigo-400"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            id="filter-assignee-select"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="text-xs bg-slate-900/90 border border-white/15 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-indigo-400"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
          </select>

          {(searchQuery || selectedPriority !== 'ALL' || selectedAssignee !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedPriority('ALL');
                setSelectedAssignee('ALL');
              }}
              className="text-[11px] text-indigo-300 hover:text-white font-medium underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Columns Grid */}
      <div 
        id="kanban-columns-container" 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start overflow-x-auto pb-4"
      >
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((t) => t.columnId === column.id);
          const isDragTarget = dragOverColumnId === column.id;

          return (
            <div
              key={column.id}
              id={`column-${column.name.toLowerCase().replace(/\s+/g, '-')}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col rounded-3xl border backdrop-blur-xl transition-colors duration-150 ${
                isDragTarget
                  ? 'bg-indigo-500/15 border-indigo-400 ring-2 ring-indigo-400/40'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      column.name === 'TODO'
                        ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                        : column.name === 'IN PROGRESS'
                        ? 'bg-sky-400 shadow-sm shadow-sky-400/50'
                        : column.name === 'DONE'
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : 'bg-indigo-400 shadow-sm shadow-indigo-400/50'
                    }`}
                  />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {column.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-white/70 px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCreateTaskColumnId(column.id);
                    setShowCreateTaskModal(true);
                  }}
                  className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
                  title={`Add task to ${column.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="p-2.5 space-y-2.5 min-h-[350px]">
                {columnTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/40 text-xs">
                    <span>No tasks in {column.name}</span>
                    <span className="text-[11px] text-white/30">Drag a task here</span>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      id={`task-card-${task.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className={`group backdrop-blur-xl bg-white/[0.08] p-4 rounded-2xl border border-white/10 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:bg-white/[0.13] hover:border-white/20 cursor-pointer transition relative ${
                        draggedTaskId === task.id ? 'opacity-40' : ''
                      }`}
                    >
                      {/* Priority and Task ID */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        {/* Quick Move Dropdown (Mobile/Touch friendly alternative to Drag-and-Drop) */}
                        <div
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={task.columnId}
                            onChange={(e) => handleQuickMove(task.id, e.target.value)}
                            className="text-[10px] bg-slate-900/90 border border-white/15 rounded-md px-1.5 py-0.5 text-white/80"
                            title="Move to another column"
                          >
                            {columns.map((c) => (
                              <option key={c.id} value={c.id}>
                                Move: {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-300 transition">
                        {task.title}
                      </h4>

                      {/* Description preview */}
                      {task.description && (
                        <p className="text-xs text-white/60 mt-1.5 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Footer: Due date + Comments + Assignee */}
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                        <div className="flex items-center gap-2.5">
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-[11px] text-white/40">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              {task.dueDate.split('-').slice(1).join('/')}
                            </span>
                          )}

                          {(task.commentsCount || 0) > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-white/40">
                              <MessageSquare className="w-3 h-3 text-indigo-400" />
                              {task.commentsCount}
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatar */}
                        {task.assignee ? (
                          <div
                            className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-200 font-bold text-[10px] flex items-center justify-center border border-indigo-400/30 shadow-xs"
                            title={`Assigned to: ${task.assignee.name} (${task.assignee.email})`}
                          >
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/30 italic">unassigned</span>
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

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <CreateTaskModal
          boardId={activeBoard.id}
          columns={columns}
          members={members}
          initialColumnId={createTaskColumnId || undefined}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev]);
          }}
        />
      )}

      {/* Create Board Modal */}
      {showCreateBoardModal && (
        <CreateBoardModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateBoardModal(false)}
          onBoardCreated={(newBoard) => {
            setBoards((prev) => [...prev, newBoard]);
            setActiveBoard(newBoard);
          }}
        />
      )}
    </div>
  );
}
