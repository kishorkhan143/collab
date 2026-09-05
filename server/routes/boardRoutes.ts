import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../auth';
import { checkWorkspaceAccess } from './workspaceRoutes';

export const boardRouter = Router();

boardRouter.use(authMiddleware);

// GET /api/workspaces/:workspaceId/boards
boardRouter.get('/workspace/:workspaceId', (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.userId;

  const access = checkWorkspaceAccess(workspaceId, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied to workspace' });
    return;
  }

  const boards = db.boards
    .filter(b => b.workspace_id === workspaceId)
    .map(b => {
      const columns = db.columns
        .filter(c => c.board_id === b.id)
        .sort((a, b) => a.position - b.position);
      return {
        ...b,
        workspaceId: b.workspace_id,
        createdAt: b.created_at,
        columns,
      };
    });

  res.json(boards);
});

// POST /api/workspaces/:workspaceId/boards - create board with default columns
boardRouter.post('/workspace/:workspaceId', (req: AuthenticatedRequest, res: Response) => {
  const { workspaceId } = req.params;
  const { name } = req.body;
  const userId = req.user!.userId;

  const access = checkWorkspaceAccess(workspaceId, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied to workspace' });
    return;
  }

  if (!name || !name.trim()) {
    res.status(400).json({ message: 'Board name is required' });
    return;
  }

  const now = new Date().toISOString();
  const boardId = `b-${Date.now()}`;

  const newBoard = {
    id: boardId,
    workspace_id: workspaceId,
    name: name.trim(),
    created_at: now,
  };

  db.boards.push(newBoard);

  // Default columns: TODO, IN PROGRESS, DONE
  const defaultColumns = [
    { id: `col-${Date.now()}-1`, board_id: boardId, name: 'TODO', position: 1 },
    { id: `col-${Date.now()}-2`, board_id: boardId, name: 'IN PROGRESS', position: 2 },
    { id: `col-${Date.now()}-3`, board_id: boardId, name: 'DONE', position: 3 },
  ];

  db.columns.push(...defaultColumns);

  // Log activity
  db.activities.push({
    id: `act-${Date.now()}`,
    workspace_id: workspaceId,
    user_id: userId,
    action: 'BOARD_CREATED',
    metadata: { boardName: newBoard.name },
    created_at: now,
  });

  db.commit();

  res.status(201).json({
    ...newBoard,
    workspaceId: newBoard.workspace_id,
    createdAt: newBoard.created_at,
    columns: defaultColumns,
  });
});

// GET /api/boards/:id - get board with columns
boardRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const boardId = req.params.id;
  const userId = req.user!.userId;

  const board = db.boards.find(b => b.id === boardId);
  if (!board) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  const access = checkWorkspaceAccess(board.workspace_id, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied to this board' });
    return;
  }

  const columns = db.columns
    .filter(c => c.board_id === board.id)
    .sort((a, b) => a.position - b.position);

  res.json({
    id: board.id,
    workspaceId: board.workspace_id,
    name: board.name,
    createdAt: board.created_at,
    columns,
  });
});

// PATCH /api/boards/:id - rename board
boardRouter.patch('/:id', (req: AuthenticatedRequest, res: Response) => {
  const boardId = req.params.id;
  const { name } = req.body;
  const userId = req.user!.userId;

  const board = db.boards.find(b => b.id === boardId);
  if (!board) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  const access = checkWorkspaceAccess(board.workspace_id, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied to this board' });
    return;
  }

  if (name && name.trim()) {
    board.name = name.trim();
    db.commit();
  }

  res.json({
    id: board.id,
    workspaceId: board.workspace_id,
    name: board.name,
    createdAt: board.created_at,
  });
});

// DELETE /api/boards/:id - delete board (ADMIN only)
boardRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const boardId = req.params.id;
  const userId = req.user!.userId;

  const board = db.boards.find(b => b.id === boardId);
  if (!board) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  const access = checkWorkspaceAccess(board.workspace_id, userId);
  if (!access.isMember || access.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only workspace ADMINs can delete boards' });
    return;
  }

  const boardIndex = db.boards.findIndex(b => b.id === boardId);
  db.boards.splice(boardIndex, 1);

  // remove associated columns
  const remainingCols = db.columns.filter(c => c.board_id !== boardId);
  db.columns.length = 0;
  db.columns.push(...remainingCols);

  // remove associated tasks
  const remainingTasks = db.tasks.filter(t => t.board_id !== boardId);
  db.tasks.length = 0;
  db.tasks.push(...remainingTasks);

  db.commit();
  res.json({ message: 'Board deleted successfully' });
});

// POST /api/boards/:id/columns - add custom column
boardRouter.post('/:id/columns', (req: AuthenticatedRequest, res: Response) => {
  const boardId = req.params.id;
  const { name } = req.body;
  const userId = req.user!.userId;

  const board = db.boards.find(b => b.id === boardId);
  if (!board) {
    res.status(404).json({ message: 'Board not found' });
    return;
  }

  const access = checkWorkspaceAccess(board.workspace_id, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  if (!name || !name.trim()) {
    res.status(400).json({ message: 'Column name is required' });
    return;
  }

  const existingCols = db.columns.filter(c => c.board_id === boardId);
  const newCol = {
    id: `col-${Date.now()}`,
    board_id: boardId,
    name: name.trim().toUpperCase(),
    position: existingCols.length + 1,
  };

  db.columns.push(newCol);
  db.commit();

  res.status(201).json(newCol);
});

// PATCH /api/columns/:id - rename column
boardRouter.patch('/columns/:id', (req: AuthenticatedRequest, res: Response) => {
  const columnId = req.params.id;
  const { name } = req.body;
  const userId = req.user!.userId;

  const col = db.columns.find(c => c.id === columnId);
  if (!col) {
    res.status(404).json({ message: 'Column not found' });
    return;
  }

  const board = db.boards.find(b => b.id === col.board_id);
  if (board) {
    const access = checkWorkspaceAccess(board.workspace_id, userId);
    if (!access.isMember) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
  }

  if (name && name.trim()) {
    col.name = name.trim().toUpperCase();
    db.commit();
  }

  res.json(col);
});

// DELETE /api/columns/:id - delete column
boardRouter.delete('/columns/:id', (req: AuthenticatedRequest, res: Response) => {
  const columnId = req.params.id;
  const userId = req.user!.userId;

  const colIndex = db.columns.findIndex(c => c.id === columnId);
  if (colIndex === -1) {
    res.status(404).json({ message: 'Column not found' });
    return;
  }

  const col = db.columns[colIndex];
  const board = db.boards.find(b => b.id === col.board_id);
  if (board) {
    const access = checkWorkspaceAccess(board.workspace_id, userId);
    if (!access.isMember || access.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden: Only workspace ADMINs can delete columns' });
      return;
    }
  }

  // Remove column and tasks in it
  db.columns.splice(colIndex, 1);
  const remainingTasks = db.tasks.filter(t => t.column_id !== columnId);
  db.tasks.length = 0;
  db.tasks.push(...remainingTasks);

  db.commit();
  res.json({ message: 'Column deleted successfully' });
});
