export type Role = 'ADMIN' | 'MEMBER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  role?: Role; // current user's role in this workspace
  boardCount?: number;
  taskCount?: number;
  memberCount?: number;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  priority: Priority;
  assigneeId?: string | null;
  createdBy: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string;
  };
  commentsCount?: number;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Activity {
  id: string;
  workspaceId: string;
  userId: string;
  taskId?: string | null;
  action: string;
  metadata?: {
    from?: string;
    to?: string;
    taskTitle?: string;
    boardName?: string;
    memberName?: string;
    role?: string;
    [key: string]: any;
  };
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  columns?: Column[];
}
