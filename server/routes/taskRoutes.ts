import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../auth';
import { checkWorkspaceAccess } from './workspaceRoutes';

export const taskRouter = Router();

taskRouter.use(authMiddleware);

// Helper to populate user info for task
function formatTask(task: any) {
  const assignee = task.assignee_id ? db.users.find(u => u.id === task.assignee_id) : null;
  const creator = db.users.find(u => u.id === task.created_by);
  const commentsCount = db.comments.filter(c => c.task_id === task.id).length;

  return {
    id: task.id,
    boardId: task.board_id,
    columnId: task.column_id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    assigneeId: task.assignee_id,
    createdBy: task.created_by,
    dueDate: task.due_date,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
    creator: creator ? { id: creator.id, name: creator.name } : undefined,
    commentsCount,
  };
}

// GET /api/boards/:boardId/tasks - list tasks for a board
taskRouter.get('/board/:boardId', (req: AuthenticatedRequest, res: Response) => {
  const { boardId } = req.params;
  const { search, priority, assignee, status } = req.query;
  const userId = req.user!.userId;

  const board = db.boards.find(b => b.id === boardId);
  if (!board) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  const access = checkWorkspaceAccess(board.workspace_id, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied to workspace' });
    return;
  }

  let tasks = db.tasks.filter(t => t.board_id === boardId);

  // Search filter
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }

  // Priority filter
  if (priority && typeof priority === 'string' && priority !== 'ALL') {
    tasks = tasks.filter(t => t.priority.toUpperCase() === priority.toUpperCase());
  }

  // Assignee filter
  if (assignee && typeof assignee === 'string' && assignee !== 'ALL') {
    tasks = tasks.filter(t => t.assignee_id === assignee);
  }

  // Status/Column filter
  if (status && typeof status === 'string' && status !== 'ALL') {
    tasks = tasks.filter(t => t.column_id === status);
  }

  res.json(tasks.map(formatTask));
});

// GET /api/tasks/my - get tasks assigned to current user
taskRouter.get('/my', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { workspaceId } = req.query;

  // Filter accessible workspaces
  const userMemberships = db.workspace_members.filter(wm => wm.user_id === userId);
  const accessibleWorkspaceIds = userMemberships.map(wm => wm.workspace_id);

  let targetBoards = db.boards.filter(b => accessibleWorkspaceIds.includes(b.workspace_id));
  if (workspaceId && typeof workspaceId === 'string') {
    targetBoards = targetBoards.filter(b => b.workspace_id === workspaceId);
  }

  const boardIds = targetBoards.map(b => b.id);
  const myTasks = db.tasks
    .filter(t => boardIds.includes(t.board_id) && t.assignee_id === userId)
    .map(formatTask);

  res.json(myTasks);
});

// POST /api/boards/:boardId/tasks - create new task
taskRouter.post('/board/:boardId', (req: AuthenticatedRequest, res: Response) => {
  const { boardId } = req.params;
  const { title, description, priority, assigneeId, dueDate, columnId } = req.body;
  const userId = req.user!.userId;

  const board = db.boards.find(b => b.id === boardId);
  if (!board) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  const access = checkWorkspaceAccess(board.workspace_id, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied to workspace' });
    return;
  }

  if (!title || !title.trim()) {
    res.status(400).json({ message: 'Task title is required' });
    return;
  }

  // Find column
  let targetColId = columnId;
  if (!targetColId) {
    const defaultCol = db.columns.find(c => c.board_id === boardId);
    targetColId = defaultCol ? defaultCol.id : '';
  }

  const now = new Date().toISOString();
  const taskId = `t-${Date.now()}`;

  const newTask = {
    id: taskId,
    board_id: boardId,
    column_id: targetColId,
    title: title.trim(),
    description: description?.trim() || '',
    priority: (priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    assignee_id: assigneeId || null,
    created_by: userId,
    due_date: dueDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    created_at: now,
    updated_at: now,
  };

  db.tasks.push(newTask);

  // Log activity
  db.activities.push({
    id: `act-${Date.now()}`,
    workspace_id: board.workspace_id,
    user_id: userId,
    task_id: taskId,
    action: 'TASK_CREATED',
    metadata: { taskTitle: newTask.title, priority: newTask.priority },
    created_at: now,
  });

  if (newTask.assignee_id) {
    const assignee = db.users.find(u => u.id === newTask.assignee_id);
    if (assignee) {
      db.activities.push({
        id: `act-${Date.now() + 1}`,
        workspace_id: board.workspace_id,
        user_id: userId,
        task_id: taskId,
        action: 'TASK_ASSIGNED',
        metadata: { taskTitle: newTask.title, assigneeName: assignee.name },
        created_at: now,
      });
    }
  }

  db.commit();

  res.status(201).json(formatTask(newTask));
});

// GET /api/tasks/:id - get single task
taskRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const taskId = req.params.id;
  const userId = req.user!.userId;

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const board = db.boards.find(b => b.id === task.board_id);
  if (board) {
    const access = checkWorkspaceAccess(board.workspace_id, userId);
    if (!access.isMember) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  res.json(formatTask(task));
});

// PATCH /api/tasks/:id - update task (drag-and-drop or details update)
taskRouter.patch('/:id', (req: AuthenticatedRequest, res: Response) => {
  const taskId = req.params.id;
  const userId = req.user!.userId;
  const { title, description, priority, assigneeId, dueDate, columnId } = req.body;

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const board = db.boards.find(b => b.id === task.board_id);
  if (board) {
    const access = checkWorkspaceAccess(board.workspace_id, userId);
    if (!access.isMember) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  const now = new Date().toISOString();
  let columnChanged = false;
  let oldColumnName = '';
  let newColumnName = '';

  if (columnId !== undefined && columnId !== task.column_id) {
    const oldCol = db.columns.find(c => c.id === task.column_id);
    const newCol = db.columns.find(c => c.id === columnId);
    oldColumnName = oldCol?.name || 'Previous Column';
    newColumnName = newCol?.name || 'New Column';
    task.column_id = columnId;
    columnChanged = true;
  }

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description.trim();
  if (priority !== undefined) task.priority = priority;
  if (assigneeId !== undefined) {
    const oldAssigneeId = task.assignee_id;
    task.assignee_id = assigneeId || null;
    if (assigneeId && assigneeId !== oldAssigneeId && board) {
      const assigneeUser = db.users.find(u => u.id === assigneeId);
      db.activities.push({
        id: `act-${Date.now()}-assign`,
        workspace_id: board.workspace_id,
        user_id: userId,
        task_id: task.id,
        action: 'TASK_ASSIGNED',
        metadata: { taskTitle: task.title, assigneeName: assigneeUser?.name || 'Unknown' },
        created_at: now,
      });
    }
  }
  if (dueDate !== undefined) task.due_date = dueDate;
  task.updated_at = now;

  if (columnChanged && board) {
    db.activities.push({
      id: `act-${Date.now()}-move`,
      workspace_id: board.workspace_id,
      user_id: userId,
      task_id: task.id,
      action: 'TASK_MOVED',
      metadata: {
        taskTitle: task.title,
        from: oldColumnName,
        to: newColumnName,
      },
      created_at: now,
    });
  }

  db.commit();

  res.json(formatTask(task));
});

// DELETE /api/tasks/:id - delete task
taskRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const taskId = req.params.id;
  const userId = req.user!.userId;

  const taskIndex = db.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const task = db.tasks[taskIndex];
  const board = db.boards.find(b => b.id === task.board_id);
  if (board) {
    const access = checkWorkspaceAccess(board.workspace_id, userId);
    if (!access.isMember) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  db.tasks.splice(taskIndex, 1);
  // remove task comments
  const remainingComments = db.comments.filter(c => c.task_id !== taskId);
  db.comments.length = 0;
  db.comments.push(...remainingComments);

  db.commit();
  res.json({ message: 'Task deleted successfully' });
});

// GET /api/tasks/:taskId/comments
taskRouter.get('/:taskId/comments', (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const board = db.boards.find(b => b.id === task.board_id);
  if (board) {
    const access = checkWorkspaceAccess(board.workspace_id, userId);
    if (!access.isMember) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  const comments = db.comments
    .filter(c => c.task_id === taskId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(c => {
      const u = db.users.find(user => user.id === c.user_id);
      return {
        id: c.id,
        taskId: c.task_id,
        userId: c.user_id,
        comment: c.comment,
        createdAt: c.created_at,
        user: {
          id: u?.id || c.user_id,
          name: u?.name || 'User',
          email: u?.email || '',
        },
      };
    });

  res.json(comments);
});

// POST /api/tasks/:taskId/comments - post a comment
taskRouter.post('/:taskId/comments', (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  const { comment } = req.body;
  const userId = req.user!.userId;

  if (!comment || !comment.trim()) {
    res.status(400).json({ message: 'Comment text is required' });
    return;
  }

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  const board = db.boards.find(b => b.id === task.board_id);
  if (board) {
    const access = checkWorkspaceAccess(board.workspace_id, userId);
    if (!access.isMember) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  const now = new Date().toISOString();
  const newComment = {
    id: `c-${Date.now()}`,
    task_id: taskId,
    user_id: userId,
    comment: comment.trim(),
    created_at: now,
  };

  db.comments.push(newComment);

  // Log activity
  if (board) {
    db.activities.push({
      id: `act-${Date.now()}`,
      workspace_id: board.workspace_id,
      user_id: userId,
      task_id: taskId,
      action: 'COMMENT_ADDED',
      metadata: { taskTitle: task.title },
      created_at: now,
    });
  }

  db.commit();

  const author = db.users.find(u => u.id === userId);

  res.status(201).json({
    id: newComment.id,
    taskId: newComment.task_id,
    userId: newComment.user_id,
    comment: newComment.comment,
    createdAt: newComment.created_at,
    user: {
      id: author?.id || userId,
      name: author?.name || req.user!.name,
      email: author?.email || req.user!.email,
    },
  });
});

// DELETE /api/tasks/comments/:id
taskRouter.delete('/comments/:id', (req: AuthenticatedRequest, res: Response) => {
  const commentId = req.params.id;
  const userId = req.user!.userId;

  const commentIndex = db.comments.findIndex(c => c.id === commentId);
  if (commentIndex === -1) {
    res.status(404).json({ message: 'Comment not found' });
    return;
  }

  const comment = db.comments[commentIndex];
  if (comment.user_id !== userId) {
    res.status(403).json({ message: 'Forbidden: You can only delete your own comments' });
    return;
  }

  db.comments.splice(commentIndex, 1);
  db.commit();

  res.json({ message: 'Comment deleted successfully' });
});
