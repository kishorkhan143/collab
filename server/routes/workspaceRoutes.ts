import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../auth';

export const workspaceRouter = Router();

workspaceRouter.use(authMiddleware);

// Middleware helper to check membership in workspace
export function checkWorkspaceAccess(workspaceId: string, userId: string): { isMember: boolean; role?: 'ADMIN' | 'MEMBER' } {
  const member = db.workspace_members.find(
    wm => wm.workspace_id === workspaceId && wm.user_id === userId
  );
  if (!member) return { isMember: false };
  return { isMember: true, role: member.role };
}

// GET /api/workspaces - return workspaces where user is a member
workspaceRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const userMemberships = db.workspace_members.filter(wm => wm.user_id === userId);
  const workspaceIds = userMemberships.map(wm => wm.workspace_id);

  const workspaces = db.workspaces
    .filter(w => workspaceIds.includes(w.id))
    .map(w => {
      const membership = userMemberships.find(wm => wm.workspace_id === w.id);
      const boards = db.boards.filter(b => b.workspace_id === w.id);
      const boardIds = boards.map(b => b.id);
      const taskCount = db.tasks.filter(t => boardIds.includes(t.board_id)).length;
      const memberCount = db.workspace_members.filter(wm => wm.workspace_id === w.id).length;

      return {
        id: w.id,
        name: w.name,
        description: w.description,
        createdBy: w.created_by,
        createdAt: w.created_at,
        role: membership?.role || 'MEMBER',
        boardCount: boards.length,
        taskCount,
        memberCount,
      };
    });

  res.json(workspaces);
});

// POST /api/workspaces - create a new workspace
workspaceRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body;
  const userId = req.user!.userId;

  if (!name || !name.trim()) {
    res.status(400).json({ message: 'Workspace name is required' });
    return;
  }

  const workspaceId = `w-${Date.now()}`;
  const now = new Date().toISOString();

  const newWorkspace = {
    id: workspaceId,
    name: name.trim(),
    description: description?.trim() || '',
    created_by: userId,
    created_at: now,
  };

  db.workspaces.push(newWorkspace);

  // Creator automatically becomes ADMIN
  db.workspace_members.push({
    id: `wm-${Date.now()}`,
    workspace_id: workspaceId,
    user_id: userId,
    role: 'ADMIN',
    created_at: now,
  });

  // Automatically create a default Board and Columns
  const boardId = `b-${Date.now()}`;
  db.boards.push({
    id: boardId,
    workspace_id: workspaceId,
    name: 'General Board',
    created_at: now,
  });

  db.columns.push(
    { id: `col-${Date.now()}-1`, board_id: boardId, name: 'TODO', position: 1 },
    { id: `col-${Date.now()}-2`, board_id: boardId, name: 'IN PROGRESS', position: 2 },
    { id: `col-${Date.now()}-3`, board_id: boardId, name: 'DONE', position: 3 }
  );

  // Record activity
  db.activities.push({
    id: `act-${Date.now()}`,
    workspace_id: workspaceId,
    user_id: userId,
    action: 'WORKSPACE_CREATED',
    metadata: { workspaceName: newWorkspace.name },
    created_at: now,
  });

  db.commit();

  res.status(201).json({
    id: newWorkspace.id,
    name: newWorkspace.name,
    description: newWorkspace.description,
    createdBy: newWorkspace.created_by,
    createdAt: newWorkspace.created_at,
    role: 'ADMIN',
    boardCount: 1,
    taskCount: 0,
    memberCount: 1,
  });
});

// GET /api/workspaces/:id - get single workspace
workspaceRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.params.id;
  const userId = req.user!.userId;

  const access = checkWorkspaceAccess(workspaceId, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: You are not a member of this workspace' });
    return;
  }

  const workspace = db.workspaces.find(w => w.id === workspaceId);
  if (!workspace) {
    res.status(404).json({ message: 'Workspace not found' });
    return;
  }

  const boards = db.boards.filter(b => b.workspace_id === workspace.id);
  const boardIds = boards.map(b => b.id);
  const taskCount = db.tasks.filter(t => boardIds.includes(t.board_id)).length;
  const memberCount = db.workspace_members.filter(wm => wm.workspace_id === workspace.id).length;

  res.json({
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    createdBy: workspace.created_by,
    createdAt: workspace.created_at,
    role: access.role,
    boardCount: boards.length,
    taskCount,
    memberCount,
  });
});

// PATCH /api/workspaces/:id - update workspace (ADMIN only)
workspaceRouter.patch('/:id', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.params.id;
  const userId = req.user!.userId;
  const { name, description } = req.body;

  const access = checkWorkspaceAccess(workspaceId, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: You are not a member of this workspace' });
    return;
  }

  if (access.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only workspace ADMINs can edit workspace details' });
    return;
  }

  const workspace = db.workspaces.find(w => w.id === workspaceId);
  if (!workspace) {
    res.status(404).json({ message: 'Workspace not found' });
    return;
  }

  if (name !== undefined) workspace.name = name.trim();
  if (description !== undefined) workspace.description = description.trim();

  db.commit();
  res.json(workspace);
});

// DELETE /api/workspaces/:id - delete workspace (ADMIN only)
workspaceRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.params.id;
  const userId = req.user!.userId;

  const access = checkWorkspaceAccess(workspaceId, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: You are not a member of this workspace' });
    return;
  }

  if (access.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only workspace ADMINs can delete workspaces' });
    return;
  }

  const wsIndex = db.workspaces.findIndex(w => w.id === workspaceId);
  if (wsIndex === -1) {
    res.status(404).json({ message: 'Workspace not found' });
    return;
  }

  // Remove workspace and cascading dependencies
  db.workspaces.splice(wsIndex, 1);
  const boardsToRemove = db.boards.filter(b => b.workspace_id === workspaceId).map(b => b.id);

  // remove tasks
  const remainingTasks = db.tasks.filter(t => !boardsToRemove.includes(t.board_id));
  db.tasks.length = 0;
  db.tasks.push(...remainingTasks);

  // remove columns
  const remainingCols = db.columns.filter(c => !boardsToRemove.includes(c.board_id));
  db.columns.length = 0;
  db.columns.push(...remainingCols);

  // remove boards
  const remainingBoards = db.boards.filter(b => b.workspace_id !== workspaceId);
  db.boards.length = 0;
  db.boards.push(...remainingBoards);

  // remove members
  const remainingMembers = db.workspace_members.filter(wm => wm.workspace_id !== workspaceId);
  db.workspace_members.length = 0;
  db.workspace_members.push(...remainingMembers);

  // remove activities
  const remainingActs = db.activities.filter(a => a.workspace_id !== workspaceId);
  db.activities.length = 0;
  db.activities.push(...remainingActs);

  db.commit();
  res.json({ message: 'Workspace deleted successfully' });
});

// GET /api/workspaces/:id/members
workspaceRouter.get('/:id/members', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.params.id;
  const userId = req.user!.userId;

  const access = checkWorkspaceAccess(workspaceId, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied' });
    return;
  }

  const members = db.workspace_members
    .filter(wm => wm.workspace_id === workspaceId)
    .map(wm => {
      const u = db.users.find(user => user.id === wm.user_id);
      return {
        id: wm.id,
        workspaceId: wm.workspace_id,
        userId: wm.user_id,
        role: wm.role,
        createdAt: wm.created_at,
        user: {
          id: u?.id || wm.user_id,
          name: u?.name || 'Unknown User',
          email: u?.email || '',
        },
      };
    });

  res.json(members);
});

// POST /api/workspaces/:id/members - add member (ADMIN only)
workspaceRouter.post('/:id/members', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.params.id;
  const currentUserId = req.user!.userId;
  const { email, role } = req.body;

  const access = checkWorkspaceAccess(workspaceId, currentUserId);
  if (!access.isMember || access.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only workspace ADMINs can add team members' });
    return;
  }

  if (!email) {
    res.status(400).json({ message: 'Member email is required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const targetUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!targetUser) {
    res.status(404).json({ message: `No user found with email: ${email}. Please ensure they are registered.` });
    return;
  }

  const existingMember = db.workspace_members.find(
    wm => wm.workspace_id === workspaceId && wm.user_id === targetUser.id
  );

  if (existingMember) {
    res.status(400).json({ message: 'This user is already a member of this workspace' });
    return;
  }

  const memberRole: 'ADMIN' | 'MEMBER' = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
  const newMemberRecord = {
    id: `wm-${Date.now()}`,
    workspace_id: workspaceId,
    user_id: targetUser.id,
    role: memberRole,
    created_at: new Date().toISOString(),
  };

  db.workspace_members.push(newMemberRecord);

  // Log activity
  db.activities.push({
    id: `act-${Date.now()}`,
    workspace_id: workspaceId,
    user_id: currentUserId,
    action: 'MEMBER_ADDED',
    metadata: {
      memberName: targetUser.name,
      role: memberRole,
    },
    created_at: new Date().toISOString(),
  });

  db.commit();

  res.status(201).json({
    id: newMemberRecord.id,
    workspaceId: newMemberRecord.workspace_id,
    userId: newMemberRecord.user_id,
    role: newMemberRecord.role,
    createdAt: newMemberRecord.created_at,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
    },
  });
});

// PATCH /api/workspaces/:id/members/:userId - change member role (ADMIN only)
workspaceRouter.patch('/:id/members/:userId', (req: AuthenticatedRequest, res: Response) => {
  const { id: workspaceId, userId: targetUserId } = req.params;
  const currentUserId = req.user!.userId;
  const { role } = req.body;

  const access = checkWorkspaceAccess(workspaceId, currentUserId);
  if (!access.isMember || access.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only workspace ADMINs can change member roles' });
    return;
  }

  if (role !== 'ADMIN' && role !== 'MEMBER') {
    res.status(400).json({ message: 'Role must be ADMIN or MEMBER' });
    return;
  }

  const member = db.workspace_members.find(
    wm => wm.workspace_id === workspaceId && wm.user_id === targetUserId
  );

  if (!member) {
    res.status(404).json({ message: 'Member not found in this workspace' });
    return;
  }

  member.role = role;
  db.commit();

  res.json({ message: 'Member role updated successfully', role });
});

// DELETE /api/workspaces/:id/members/:userId - remove member (ADMIN only)
workspaceRouter.delete('/:id/members/:userId', (req: AuthenticatedRequest, res: Response) => {
  const { id: workspaceId, userId: targetUserId } = req.params;
  const currentUserId = req.user!.userId;

  const access = checkWorkspaceAccess(workspaceId, currentUserId);
  if (!access.isMember || access.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Only workspace ADMINs can remove members' });
    return;
  }

  const index = db.workspace_members.findIndex(
    wm => wm.workspace_id === workspaceId && wm.user_id === targetUserId
  );

  if (index === -1) {
    res.status(404).json({ message: 'Member not found in this workspace' });
    return;
  }

  // Prevent removing last admin
  const admins = db.workspace_members.filter(wm => wm.workspace_id === workspaceId && wm.role === 'ADMIN');
  if (admins.length <= 1 && db.workspace_members[index].role === 'ADMIN') {
    res.status(400).json({ message: 'Cannot remove the only workspace admin' });
    return;
  }

  db.workspace_members.splice(index, 1);
  db.commit();

  res.json({ message: 'Member removed successfully' });
});

// GET /api/workspaces/:id/activities - return activity logs
workspaceRouter.get('/:id/activities', (req: AuthenticatedRequest, res: Response) => {
  const workspaceId = req.params.id;
  const userId = req.user!.userId;

  const access = checkWorkspaceAccess(workspaceId, userId);
  if (!access.isMember) {
    res.status(403).json({ message: 'Forbidden: Access denied' });
    return;
  }

  const activities = db.activities
    .filter(a => a.workspace_id === workspaceId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(a => {
      const u = db.users.find(user => user.id === a.user_id);
      return {
        id: a.id,
        workspaceId: a.workspace_id,
        userId: a.user_id,
        taskId: a.task_id,
        action: a.action,
        metadata: a.metadata,
        createdAt: a.created_at,
        user: {
          id: u?.id || a.user_id,
          name: u?.name || 'User',
          email: u?.email || '',
        },
      };
    });

  res.json(activities);
});
