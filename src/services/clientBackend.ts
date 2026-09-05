import { 
  Workspace, 
  WorkspaceMember, 
  Board, 
  Column, 
  Task, 
  Comment, 
  Activity, 
  User, 
  Role, 
  Priority 
} from '../types';

interface StoredData {
  users: User[];
  workspaces: Array<{
    id: string;
    name: string;
    description: string;
    createdBy: string;
    createdAt: string;
  }>;
  workspaceMembers: Array<{
    id: string;
    workspaceId: string;
    userId: string;
    role: Role;
    createdAt: string;
  }>;
  boards: Array<{
    id: string;
    workspaceId: string;
    name: string;
    createdAt: string;
  }>;
  columns: Array<{
    id: string;
    boardId: string;
    name: string;
    position: number;
  }>;
  tasks: Array<{
    id: string;
    boardId: string;
    columnId: string;
    title: string;
    description: string;
    priority: Priority;
    assigneeId: string | null;
    createdBy: string;
    dueDate: string;
    createdAt: string;
    updatedAt: string;
  }>;
  comments: Array<{
    id: string;
    taskId: string;
    userId: string;
    comment: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    workspaceId: string;
    userId: string;
    taskId?: string | null;
    action: string;
    metadata?: Record<string, any>;
    createdAt: string;
  }>;
}

const STORAGE_KEY = 'collabboard_client_db';
const CURRENT_USER_KEY = 'collabboard_client_current_user_id';

function getSeedData(): StoredData {
  const now = new Date().toISOString();

  const users: User[] = [
    { id: '1', name: 'Arun', email: 'arun@gmail.com', createdAt: now },
    { id: '2', name: 'Kishor', email: 'kishor@gmail.com', createdAt: now },
    { id: '3', name: 'Rahul', email: 'rahul@gmail.com', createdAt: now },
    { id: '4', name: 'Priya', email: 'priya@gmail.com', createdAt: now },
    { id: '5', name: 'Vijay', email: 'vijay@gmail.com', createdAt: now },
    { id: '6', name: 'Kumar', email: 'kumar@gmail.com', createdAt: now },
  ];

  const workspaces = [
    { id: '1', name: 'College Project', description: 'Final year multi-tenant task management system', createdBy: '1', createdAt: now },
    { id: '2', name: 'Startup Project', description: 'SaaS product launch initiative', createdBy: '4', createdAt: now },
  ];

  const workspaceMembers = [
    { id: 'wm-1', workspaceId: '1', userId: '1', role: 'ADMIN' as Role, createdAt: now },
    { id: 'wm-2', workspaceId: '1', userId: '2', role: 'MEMBER' as Role, createdAt: now },
    { id: 'wm-3', workspaceId: '1', userId: '3', role: 'MEMBER' as Role, createdAt: now },
    { id: 'wm-4', workspaceId: '1', userId: '4', role: 'MEMBER' as Role, createdAt: now },
    { id: 'wm-5', workspaceId: '1', userId: '5', role: 'MEMBER' as Role, createdAt: now },
    { id: 'wm-6', workspaceId: '1', userId: '6', role: 'MEMBER' as Role, createdAt: now },
    { id: 'wm-7', workspaceId: '2', userId: '4', role: 'ADMIN' as Role, createdAt: now },
    { id: 'wm-8', workspaceId: '2', userId: '6', role: 'MEMBER' as Role, createdAt: now },
  ];

  const boards = [
    { id: 'b-1', workspaceId: '1', name: 'Development Board', createdAt: now },
    { id: 'b-2', workspaceId: '1', name: 'Testing Board', createdAt: now },
    { id: 'b-3', workspaceId: '2', name: 'MVP Launch Board', createdAt: now },
  ];

  const columns = [
    { id: 'col-1', boardId: 'b-1', name: 'TODO', position: 1 },
    { id: 'col-2', boardId: 'b-1', name: 'IN PROGRESS', position: 2 },
    { id: 'col-3', boardId: 'b-1', name: 'DONE', position: 3 },
    { id: 'col-4', boardId: 'b-2', name: 'TODO', position: 1 },
    { id: 'col-5', boardId: 'b-2', name: 'IN PROGRESS', position: 2 },
    { id: 'col-6', boardId: 'b-2', name: 'DONE', position: 3 },
    { id: 'col-7', boardId: 'b-3', name: 'TODO', position: 1 },
    { id: 'col-8', boardId: 'b-3', name: 'IN PROGRESS', position: 2 },
    { id: 'col-9', boardId: 'b-3', name: 'DONE', position: 3 },
  ];

  const tasks = [
    {
      id: 't-1',
      boardId: 'b-1',
      columnId: 'col-1',
      title: 'Create Login Page',
      description: 'Build responsive login page with JWT integration and form validation',
      priority: 'HIGH' as Priority,
      assigneeId: '2',
      createdBy: '1',
      dueDate: '2026-09-15',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't-2',
      boardId: 'b-1',
      columnId: 'col-2',
      title: 'API Development',
      description: 'Implement REST APIs for boards, columns, and task management',
      priority: 'HIGH' as Priority,
      assigneeId: '1',
      createdBy: '1',
      dueDate: '2026-09-12',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't-3',
      boardId: 'b-1',
      columnId: 'col-2',
      title: 'Authentication Middleware',
      description: 'Verify JWT tokens, check workspace membership and enforce RBAC',
      priority: 'MEDIUM' as Priority,
      assigneeId: '3',
      createdBy: '1',
      dueDate: '2026-09-14',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't-4',
      boardId: 'b-1',
      columnId: 'col-3',
      title: 'Database Schema Design',
      description: 'Construct relational schema for users, workspaces, and tasks',
      priority: 'HIGH' as Priority,
      assigneeId: '5',
      createdBy: '1',
      dueDate: '2026-09-08',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't-5',
      boardId: 'b-1',
      columnId: 'col-3',
      title: 'Navbar Component',
      description: 'Build navigation bar with brand icon, workspace selector, and profile menu',
      priority: 'LOW' as Priority,
      assigneeId: '6',
      createdBy: '1',
      dueDate: '2026-09-07',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't-6',
      boardId: 'b-1',
      columnId: 'col-1',
      title: 'Testing & QA Workflow',
      description: 'Write unit and integration tests for auth and workspace endpoints',
      priority: 'MEDIUM' as Priority,
      assigneeId: '4',
      createdBy: '1',
      dueDate: '2026-09-18',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const comments = [
    {
      id: 'c-1',
      taskId: 't-1',
      userId: '1',
      comment: 'Please make sure it is responsive on both mobile and desktop screens.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'c-2',
      taskId: 't-1',
      userId: '2',
      comment: "Okay, I'll complete it today.",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  const activities = [
    {
      id: 'act-1',
      workspaceId: '1',
      userId: '1',
      action: 'WORKSPACE_CREATED',
      metadata: { workspaceName: 'College Project' },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'act-2',
      workspaceId: '1',
      userId: '1',
      action: 'BOARD_CREATED',
      metadata: { boardName: 'Development Board' },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'act-3',
      workspaceId: '1',
      userId: '1',
      taskId: 't-1',
      action: 'TASK_CREATED',
      metadata: { taskTitle: 'Create Login Page', priority: 'HIGH' },
      createdAt: new Date(Date.now() - 72000000).toISOString(),
    },
    {
      id: 'act-4',
      workspaceId: '1',
      userId: '1',
      taskId: 't-1',
      action: 'TASK_ASSIGNED',
      metadata: { taskTitle: 'Create Login Page', assigneeName: 'Kishor' },
      createdAt: new Date(Date.now() - 50000000).toISOString(),
    },
    {
      id: 'act-5',
      workspaceId: '1',
      userId: '2',
      taskId: 't-1',
      action: 'COMMENT_ADDED',
      metadata: { taskTitle: 'Create Login Page' },
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'act-6',
      workspaceId: '1',
      userId: '1',
      taskId: 't-2',
      action: 'TASK_MOVED',
      metadata: { taskTitle: 'API Development', from: 'TODO', to: 'IN PROGRESS' },
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];

  return {
    users,
    workspaces,
    workspaceMembers,
    boards,
    columns,
    tasks,
    comments,
    activities,
  };
}

class ClientBackend {
  private loadData(): StoredData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    const seed = getSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: StoredData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  public getCurrentUserId(): string {
    return localStorage.getItem(CURRENT_USER_KEY) || '1';
  }

  public setCurrentUserId(userId: string) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  }

  public resetToDefaults(): void {
    const seed = getSeedData();
    this.saveData(seed);
    this.setCurrentUserId('1');
  }

  public handle<T>(endpoint: string, options: RequestInit = {}): T {
    const data = this.loadData();
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};
    const url = new URL(endpoint, 'http://localhost');
    const path = url.pathname;
    const currentUserId = this.getCurrentUserId();
    const currentUser = data.users.find(u => u.id === currentUserId) || data.users[0];

    // 1. Auth routes
    if (path === '/api/auth/demo-switch' && method === 'POST') {
      const email = body.email;
      let targetUser = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!targetUser) {
        targetUser = {
          id: String(Date.now()),
          name: email.split('@')[0],
          email,
          createdAt: new Date().toISOString(),
        };
        data.users.push(targetUser);
        this.saveData(data);
      }
      this.setCurrentUserId(targetUser.id);
      return {
        message: 'Switched user successfully',
        token: `client_token_${targetUser.id}`,
        user: targetUser,
      } as T;
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const email = body.email;
      let targetUser = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!targetUser) {
        targetUser = {
          id: String(Date.now()),
          name: email.split('@')[0],
          email,
          createdAt: new Date().toISOString(),
        };
        data.users.push(targetUser);
        this.saveData(data);
      }
      this.setCurrentUserId(targetUser.id);
      return {
        message: 'Logged in successfully',
        token: `client_token_${targetUser.id}`,
        user: targetUser,
      } as T;
    }

    if (path === '/api/auth/register' && method === 'POST') {
      const { name, email } = body;
      const newUser: User = {
        id: String(Date.now()),
        name: name || email.split('@')[0],
        email,
        createdAt: new Date().toISOString(),
      };
      data.users.push(newUser);
      // add to default workspace 1 as MEMBER
      data.workspaceMembers.push({
        id: `wm-${Date.now()}`,
        workspaceId: '1',
        userId: newUser.id,
        role: 'MEMBER',
        createdAt: new Date().toISOString(),
      });
      this.saveData(data);
      this.setCurrentUserId(newUser.id);
      return {
        message: 'Registered successfully',
        token: `client_token_${newUser.id}`,
        user: newUser,
      } as T;
    }

    if (path === '/api/auth/me' && method === 'GET') {
      return currentUser as T;
    }

    if (path === '/api/auth/users' && method === 'GET') {
      return data.users.map(u => ({ id: u.id, name: u.name, email: u.email })) as T;
    }

    if (path === '/api/reset-demo' && method === 'POST') {
      this.resetToDefaults();
      return { message: 'Database reset to default seed data successfully' } as T;
    }

    // 2. Workspaces
    if (path === '/api/workspaces' && method === 'GET') {
      const userMemberships = data.workspaceMembers.filter(wm => wm.userId === currentUserId);
      const userWorkspaces: Workspace[] = userMemberships.map(wm => {
        const ws = data.workspaces.find(w => w.id === wm.workspaceId);
        if (!ws) return null;
        const boardsInWs = data.boards.filter(b => b.workspaceId === ws.id);
        const boardIds = boardsInWs.map(b => b.id);
        const tasksInWs = data.tasks.filter(t => boardIds.includes(t.boardId));
        const membersInWs = data.workspaceMembers.filter(m => m.workspaceId === ws.id);

        return {
          id: ws.id,
          name: ws.name,
          description: ws.description,
          createdBy: ws.createdBy,
          createdAt: ws.createdAt,
          role: wm.role,
          boardCount: boardsInWs.length,
          taskCount: tasksInWs.length,
          memberCount: membersInWs.length,
        };
      }).filter(Boolean) as Workspace[];

      return userWorkspaces as T;
    }

    if (path === '/api/workspaces' && method === 'POST') {
      const newWsId = String(Date.now());
      const now = new Date().toISOString();
      const newWs = {
        id: newWsId,
        name: body.name || 'Untitled Workspace',
        description: body.description || '',
        createdBy: currentUserId,
        createdAt: now,
      };
      data.workspaces.push(newWs);
      data.workspaceMembers.push({
        id: `wm-${Date.now()}`,
        workspaceId: newWsId,
        userId: currentUserId,
        role: 'ADMIN',
        createdAt: now,
      });

      // add default board
      const newBoardId = `b-${Date.now()}`;
      data.boards.push({
        id: newBoardId,
        workspaceId: newWsId,
        name: 'General Board',
        createdAt: now,
      });
      data.columns.push(
        { id: `col-${Date.now()}-1`, boardId: newBoardId, name: 'TODO', position: 1 },
        { id: `col-${Date.now()}-2`, boardId: newBoardId, name: 'IN PROGRESS', position: 2 },
        { id: `col-${Date.now()}-3`, boardId: newBoardId, name: 'DONE', position: 3 }
      );

      data.activities.push({
        id: `act-${Date.now()}`,
        workspaceId: newWsId,
        userId: currentUserId,
        action: 'WORKSPACE_CREATED',
        metadata: { workspaceName: newWs.name },
        createdAt: now,
      });

      this.saveData(data);

      return {
        ...newWs,
        role: 'ADMIN' as Role,
        boardCount: 1,
        taskCount: 0,
        memberCount: 1,
      } as T;
    }

    const wsMatch = path.match(/^\/api\/workspaces\/([^/]+)$/);
    if (wsMatch) {
      const wsId = wsMatch[1];
      const ws = data.workspaces.find(w => w.id === wsId);
      if (!ws) throw new Error('Workspace not found');

      if (method === 'GET') {
        const wm = data.workspaceMembers.find(m => m.workspaceId === wsId && m.userId === currentUserId);
        return {
          ...ws,
          role: wm?.role || 'MEMBER',
        } as T;
      }

      if (method === 'PATCH') {
        if (body.name) ws.name = body.name;
        if (body.description !== undefined) ws.description = body.description;
        this.saveData(data);
        return ws as T;
      }

      if (method === 'DELETE') {
        data.workspaces = data.workspaces.filter(w => w.id !== wsId);
        data.workspaceMembers = data.workspaceMembers.filter(m => m.workspaceId !== wsId);
        this.saveData(data);
        return { message: 'Workspace deleted' } as T;
      }
    }

    // 3. Workspace Members
    const membersMatch = path.match(/^\/api\/workspaces\/([^/]+)\/members$/);
    if (membersMatch) {
      const wsId = membersMatch[1];
      if (method === 'GET') {
        const members = data.workspaceMembers
          .filter(m => m.workspaceId === wsId)
          .map(m => {
            const u = data.users.find(user => user.id === m.userId);
            return {
              id: m.id,
              workspaceId: m.workspaceId,
              userId: m.userId,
              role: m.role,
              createdAt: m.createdAt,
              user: {
                id: m.userId,
                name: u?.name || 'Unknown',
                email: u?.email || '',
              },
            } as WorkspaceMember;
          });
        return members as T;
      }

      if (method === 'POST') {
        const email = body.email;
        const role = (body.role || 'MEMBER') as Role;
        let u = data.users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (!u) {
          u = {
            id: String(Date.now()),
            name: email.split('@')[0],
            email,
            createdAt: new Date().toISOString(),
          };
          data.users.push(u);
        }

        const existing = data.workspaceMembers.find(m => m.workspaceId === wsId && m.userId === u!.id);
        if (existing) {
          throw new Error('User is already a member of this workspace');
        }

        const newMember = {
          id: `wm-${Date.now()}`,
          workspaceId: wsId,
          userId: u.id,
          role,
          createdAt: new Date().toISOString(),
        };
        data.workspaceMembers.push(newMember);

        data.activities.push({
          id: `act-${Date.now()}`,
          workspaceId: wsId,
          userId: currentUserId,
          action: 'MEMBER_ADDED',
          metadata: { memberName: u.name, role },
          createdAt: new Date().toISOString(),
        });

        this.saveData(data);

        return {
          ...newMember,
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
          },
        } as T;
      }
    }

    const memberRoleMatch = path.match(/^\/api\/workspaces\/([^/]+)\/members\/([^/]+)$/);
    if (memberRoleMatch) {
      const wsId = memberRoleMatch[1];
      const memberUserId = memberRoleMatch[2];

      if (method === 'PATCH') {
        const member = data.workspaceMembers.find(m => m.workspaceId === wsId && m.userId === memberUserId);
        if (!member) throw new Error('Member not found');
        member.role = body.role as Role;
        this.saveData(data);
        return { message: 'Role updated successfully', role: member.role } as T;
      }

      if (method === 'DELETE') {
        data.workspaceMembers = data.workspaceMembers.filter(m => !(m.workspaceId === wsId && m.userId === memberUserId));
        this.saveData(data);
        return { message: 'Member removed successfully' } as T;
      }
    }

    // 4. Activities
    const activitiesMatch = path.match(/^\/api\/workspaces\/([^/]+)\/activities$/);
    if (activitiesMatch && method === 'GET') {
      const wsId = activitiesMatch[1];
      const acts = data.activities
        .filter(a => a.workspaceId === wsId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(a => {
          const u = data.users.find(user => user.id === a.userId);
          return {
            id: a.id,
            workspaceId: a.workspaceId,
            userId: a.userId,
            taskId: a.taskId,
            action: a.action,
            metadata: a.metadata,
            createdAt: a.createdAt,
            user: {
              id: a.userId,
              name: u?.name || 'User',
              email: u?.email || '',
            },
          } as Activity;
        });
      return acts as T;
    }

    // 5. Boards
    const wsBoardsMatch = path.match(/^\/api\/boards\/workspace\/([^/]+)$/);
    if (wsBoardsMatch) {
      const wsId = wsBoardsMatch[1];
      if (method === 'GET') {
        const boards = data.boards.filter(b => b.workspaceId === wsId).map(b => {
          const cols = data.columns
            .filter(c => c.boardId === b.id)
            .sort((a, b) => a.position - b.position);
          return {
            ...b,
            columns: cols,
          } as Board;
        });
        return boards as T;
      }

      if (method === 'POST') {
        const now = new Date().toISOString();
        const newBoardId = `b-${Date.now()}`;
        const newBoard: Board = {
          id: newBoardId,
          workspaceId: wsId,
          name: body.name || 'New Board',
          createdAt: now,
          columns: [],
        };
        data.boards.push({
          id: newBoardId,
          workspaceId: wsId,
          name: newBoard.name,
          createdAt: now,
        });

        const newCols = [
          { id: `col-${Date.now()}-1`, boardId: newBoardId, name: 'TODO', position: 1 },
          { id: `col-${Date.now()}-2`, boardId: newBoardId, name: 'IN PROGRESS', position: 2 },
          { id: `col-${Date.now()}-3`, boardId: newBoardId, name: 'DONE', position: 3 },
        ];
        data.columns.push(...newCols);
        newBoard.columns = newCols;

        data.activities.push({
          id: `act-${Date.now()}`,
          workspaceId: wsId,
          userId: currentUserId,
          action: 'BOARD_CREATED',
          metadata: { boardName: newBoard.name },
          createdAt: now,
        });

        this.saveData(data);
        return newBoard as T;
      }
    }

    const boardDetailMatch = path.match(/^\/api\/boards\/([^/]+)$/);
    if (boardDetailMatch) {
      const bId = boardDetailMatch[1];
      const board = data.boards.find(b => b.id === bId);
      if (!board) throw new Error('Board not found');

      if (method === 'GET') {
        const cols = data.columns
          .filter(c => c.boardId === bId)
          .sort((a, b) => a.position - b.position);
        return { ...board, columns: cols } as T;
      }

      if (method === 'PATCH') {
        if (body.name) board.name = body.name;
        this.saveData(data);
        return board as T;
      }

      if (method === 'DELETE') {
        data.boards = data.boards.filter(b => b.id !== bId);
        data.columns = data.columns.filter(c => c.boardId !== bId);
        data.tasks = data.tasks.filter(t => t.boardId !== bId);
        this.saveData(data);
        return { message: 'Board deleted' } as T;
      }
    }

    // 6. Columns
    const addColMatch = path.match(/^\/api\/boards\/([^/]+)\/columns$/);
    if (addColMatch && method === 'POST') {
      const bId = addColMatch[1];
      const existing = data.columns.filter(c => c.boardId === bId);
      const newCol: Column = {
        id: `col-${Date.now()}`,
        boardId: bId,
        name: body.name || 'New Column',
        position: existing.length + 1,
      };
      data.columns.push(newCol);
      this.saveData(data);
      return newCol as T;
    }

    const colMatch = path.match(/^\/api\/boards\/columns\/([^/]+)$/);
    if (colMatch) {
      const cId = colMatch[1];
      const col = data.columns.find(c => c.id === cId);
      if (!col) throw new Error('Column not found');

      if (method === 'PATCH') {
        if (body.name) col.name = body.name;
        this.saveData(data);
        return col as T;
      }

      if (method === 'DELETE') {
        data.columns = data.columns.filter(c => c.id !== cId);
        data.tasks = data.tasks.filter(t => t.columnId !== cId);
        this.saveData(data);
        return { message: 'Column deleted' } as T;
      }
    }

    // 7. Tasks
    const boardTasksMatch = path.match(/^\/api\/tasks\/board\/([^/]+)$/);
    if (boardTasksMatch) {
      const bId = boardTasksMatch[1];
      if (method === 'GET') {
        let tasks = data.tasks.filter(t => t.boardId === bId);

        const search = url.searchParams.get('search');
        if (search) {
          const s = search.toLowerCase();
          tasks = tasks.filter(t => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s));
        }
        const priority = url.searchParams.get('priority');
        if (priority) {
          tasks = tasks.filter(t => t.priority === priority);
        }
        const assignee = url.searchParams.get('assignee');
        if (assignee) {
          if (assignee === 'UNASSIGNED') {
            tasks = tasks.filter(t => !t.assigneeId);
          } else {
            tasks = tasks.filter(t => t.assigneeId === assignee);
          }
        }
        const status = url.searchParams.get('status');
        if (status) {
          tasks = tasks.filter(t => t.columnId === status);
        }

        const enriched = tasks.map(t => this.enrichTask(t, data));
        return enriched as T;
      }

      if (method === 'POST') {
        const now = new Date().toISOString();
        const b = data.boards.find(board => board.id === bId);
        const colId = body.columnId || data.columns.find(c => c.boardId === bId)?.id || '';
        const newTask = {
          id: `t-${Date.now()}`,
          boardId: bId,
          columnId: colId,
          title: body.title || 'Untitled Task',
          description: body.description || '',
          priority: (body.priority || 'MEDIUM') as Priority,
          assigneeId: body.assigneeId || null,
          createdBy: currentUserId,
          dueDate: body.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          createdAt: now,
          updatedAt: now,
        };
        data.tasks.push(newTask);

        if (b) {
          data.activities.push({
            id: `act-${Date.now()}`,
            workspaceId: b.workspaceId,
            userId: currentUserId,
            taskId: newTask.id,
            action: 'TASK_CREATED',
            metadata: { taskTitle: newTask.title, priority: newTask.priority },
            createdAt: now,
          });
        }

        this.saveData(data);
        return this.enrichTask(newTask, data) as T;
      }
    }

    if (path === '/api/tasks/my' && method === 'GET') {
      const wsId = url.searchParams.get('workspaceId');
      let myTasks = data.tasks.filter(t => t.assigneeId === currentUserId);
      if (wsId) {
        const bIds = data.boards.filter(b => b.workspaceId === wsId).map(b => b.id);
        myTasks = myTasks.filter(t => bIds.includes(t.boardId));
      }
      return myTasks.map(t => this.enrichTask(t, data)) as T;
    }

    const taskMatch = path.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch) {
      const tId = taskMatch[1];
      const task = data.tasks.find(t => t.id === tId);
      if (!task) throw new Error('Task not found');

      if (method === 'GET') {
        return this.enrichTask(task, data) as T;
      }

      if (method === 'PATCH') {
        const now = new Date().toISOString();
        const b = data.boards.find(board => board.id === task.boardId);

        if (body.columnId && body.columnId !== task.columnId) {
          const fromCol = data.columns.find(c => c.id === task.columnId)?.name || 'Previous';
          const toCol = data.columns.find(c => c.id === body.columnId)?.name || 'New';
          task.columnId = body.columnId;
          if (b) {
            data.activities.push({
              id: `act-${Date.now()}`,
              workspaceId: b.workspaceId,
              userId: currentUserId,
              taskId: task.id,
              action: 'TASK_MOVED',
              metadata: { taskTitle: task.title, from: fromCol, to: toCol },
              createdAt: now,
            });
          }
        }

        if (body.assigneeId !== undefined && body.assigneeId !== task.assigneeId) {
          task.assigneeId = body.assigneeId;
          if (b && body.assigneeId) {
            const assigneeUser = data.users.find(u => u.id === body.assigneeId);
            data.activities.push({
              id: `act-${Date.now()}`,
              workspaceId: b.workspaceId,
              userId: currentUserId,
              taskId: task.id,
              action: 'TASK_ASSIGNED',
              metadata: { taskTitle: task.title, assigneeName: assigneeUser?.name || 'colleague' },
              createdAt: now,
            });
          }
        }

        if (body.title !== undefined) task.title = body.title;
        if (body.description !== undefined) task.description = body.description;
        if (body.priority !== undefined) task.priority = body.priority as Priority;
        if (body.dueDate !== undefined) task.dueDate = body.dueDate;
        task.updatedAt = now;

        this.saveData(data);
        return this.enrichTask(task, data) as T;
      }

      if (method === 'DELETE') {
        data.tasks = data.tasks.filter(t => t.id !== tId);
        data.comments = data.comments.filter(c => c.taskId !== tId);
        this.saveData(data);
        return { message: 'Task deleted' } as T;
      }
    }

    // 8. Comments
    const commentsMatch = path.match(/^\/api\/tasks\/([^/]+)\/comments$/);
    if (commentsMatch) {
      const tId = commentsMatch[1];
      if (method === 'GET') {
        const comms = data.comments
          .filter(c => c.taskId === tId)
          .map(c => {
            const u = data.users.find(user => user.id === c.userId);
            return {
              id: c.id,
              taskId: c.taskId,
              userId: c.userId,
              comment: c.comment,
              createdAt: c.createdAt,
              user: {
                id: c.userId,
                name: u?.name || 'User',
                email: u?.email || '',
              },
            } as Comment;
          });
        return comms as T;
      }

      if (method === 'POST') {
        const now = new Date().toISOString();
        const newComm = {
          id: `c-${Date.now()}`,
          taskId: tId,
          userId: currentUserId,
          comment: body.comment || '',
          createdAt: now,
        };
        data.comments.push(newComm);

        const task = data.tasks.find(t => t.id === tId);
        if (task) {
          const b = data.boards.find(board => board.id === task.boardId);
          if (b) {
            data.activities.push({
              id: `act-${Date.now()}`,
              workspaceId: b.workspaceId,
              userId: currentUserId,
              taskId: task.id,
              action: 'COMMENT_ADDED',
              metadata: { taskTitle: task.title },
              createdAt: now,
            });
          }
        }

        this.saveData(data);
        return {
          ...newComm,
          user: {
            id: currentUserId,
            name: currentUser.name,
            email: currentUser.email,
          },
        } as T;
      }
    }

    const commentDeleteMatch = path.match(/^\/api\/tasks\/comments\/([^/]+)$/);
    if (commentDeleteMatch && method === 'DELETE') {
      const cId = commentDeleteMatch[1];
      data.comments = data.comments.filter(c => c.id !== cId);
      this.saveData(data);
      return { message: 'Comment deleted' } as T;
    }

    throw new Error(`Endpoint not found: ${method} ${path}`);
  }

  private enrichTask(t: StoredData['tasks'][0], data: StoredData): Task {
    const assignee = t.assigneeId ? data.users.find(u => u.id === t.assigneeId) : null;
    const creator = data.users.find(u => u.id === t.createdBy);
    const commentsCount = data.comments.filter(c => c.taskId === t.id).length;

    return {
      id: t.id,
      boardId: t.boardId,
      columnId: t.columnId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      assigneeId: t.assigneeId,
      createdBy: t.createdBy,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
      creator: creator ? { id: creator.id, name: creator.name } : undefined,
      commentsCount,
    };
  }
}

export const clientBackend = new ClientBackend();
