import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  created_at: string;
}

export interface BoardRecord {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface ColumnRecord {
  id: string;
  board_id: string;
  name: string;
  position: number;
}

export interface TaskRecord {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee_id: string | null;
  created_by: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface CommentRecord {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  task_id?: string | null;
  action: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DatabaseState {
  users: UserRecord[];
  workspaces: WorkspaceRecord[];
  workspace_members: WorkspaceMemberRecord[];
  boards: BoardRecord[];
  columns: ColumnRecord[];
  tasks: TaskRecord[];
  comments: CommentRecord[];
  activities: ActivityRecord[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data_collabboard.json');

function createSeedData(): DatabaseState {
  const commonPasswordHash = hashPassword('password123');
  const now = new Date().toISOString();

  const users: UserRecord[] = [
    { id: '1', name: 'Arun', email: 'arun@gmail.com', password_hash: commonPasswordHash, created_at: now },
    { id: '2', name: 'Kishor', email: 'kishor@gmail.com', password_hash: commonPasswordHash, created_at: now },
    { id: '3', name: 'Rahul', email: 'rahul@gmail.com', password_hash: commonPasswordHash, created_at: now },
    { id: '4', name: 'Priya', email: 'priya@gmail.com', password_hash: commonPasswordHash, created_at: now },
    { id: '5', name: 'Vijay', email: 'vijay@gmail.com', password_hash: commonPasswordHash, created_at: now },
    { id: '6', name: 'Kumar', email: 'kumar@gmail.com', password_hash: commonPasswordHash, created_at: now },
  ];

  const workspaces: WorkspaceRecord[] = [
    { id: '1', name: 'College Project', description: 'Final year multi-tenant task management system', created_by: '1', created_at: now },
    { id: '2', name: 'Startup Project', description: 'SaaS product launch initiative', created_by: '4', created_at: now },
  ];

  const workspace_members: WorkspaceMemberRecord[] = [
    // College Project members
    { id: 'wm-1', workspace_id: '1', user_id: '1', role: 'ADMIN', created_at: now },
    { id: 'wm-2', workspace_id: '1', user_id: '2', role: 'MEMBER', created_at: now },
    { id: 'wm-3', workspace_id: '1', user_id: '3', role: 'MEMBER', created_at: now },
    { id: 'wm-4', workspace_id: '1', user_id: '4', role: 'MEMBER', created_at: now },
    { id: 'wm-5', workspace_id: '1', user_id: '5', role: 'MEMBER', created_at: now },
    { id: 'wm-6', workspace_id: '1', user_id: '6', role: 'MEMBER', created_at: now },
    // Startup Project members (Priya is Admin, Kumar is Member - Arun is NOT in this workspace)
    { id: 'wm-7', workspace_id: '2', user_id: '4', role: 'ADMIN', created_at: now },
    { id: 'wm-8', workspace_id: '2', user_id: '6', role: 'MEMBER', created_at: now },
  ];

  const boards: BoardRecord[] = [
    { id: 'b-1', workspace_id: '1', name: 'Development Board', created_at: now },
    { id: 'b-2', workspace_id: '1', name: 'Testing Board', created_at: now },
    { id: 'b-3', workspace_id: '2', name: 'MVP Launch Board', created_at: now },
  ];

  const columns: ColumnRecord[] = [
    // Development Board columns
    { id: 'col-1', board_id: 'b-1', name: 'TODO', position: 1 },
    { id: 'col-2', board_id: 'b-1', name: 'IN PROGRESS', position: 2 },
    { id: 'col-3', board_id: 'b-1', name: 'DONE', position: 3 },
    // Testing Board columns
    { id: 'col-4', board_id: 'b-2', name: 'TODO', position: 1 },
    { id: 'col-5', board_id: 'b-2', name: 'IN PROGRESS', position: 2 },
    { id: 'col-6', board_id: 'b-2', name: 'DONE', position: 3 },
    // Startup MVP columns
    { id: 'col-7', board_id: 'b-3', name: 'TODO', position: 1 },
    { id: 'col-8', board_id: 'b-3', name: 'IN PROGRESS', position: 2 },
    { id: 'col-9', board_id: 'b-3', name: 'DONE', position: 3 },
  ];

  const tasks: TaskRecord[] = [
    {
      id: 't-1',
      board_id: 'b-1',
      column_id: 'col-1',
      title: 'Create Login Page',
      description: 'Build responsive login page with JWT integration and form validation',
      priority: 'HIGH',
      assignee_id: '2', // Kishor
      created_by: '1', // Arun
      due_date: '2026-09-15',
      created_at: now,
      updated_at: now,
    },
    {
      id: 't-2',
      board_id: 'b-1',
      column_id: 'col-2',
      title: 'API Development',
      description: 'Implement Express REST APIs for boards, columns, and task management',
      priority: 'HIGH',
      assignee_id: '1', // Arun
      created_by: '1',
      due_date: '2026-09-12',
      created_at: now,
      updated_at: now,
    },
    {
      id: 't-3',
      board_id: 'b-1',
      column_id: 'col-2',
      title: 'Authentication Middleware',
      description: 'Verify JWT tokens, check workspace membership and enforce RBAC',
      priority: 'MEDIUM',
      assignee_id: '3', // Rahul
      created_by: '1',
      due_date: '2026-09-14',
      created_at: now,
      updated_at: now,
    },
    {
      id: 't-4',
      board_id: 'b-1',
      column_id: 'col-3',
      title: 'Database Schema Design',
      description: 'Construct PostgreSQL relational schema for users, workspaces, and tasks',
      priority: 'HIGH',
      assignee_id: '5', // Vijay
      created_by: '1',
      due_date: '2026-09-08',
      created_at: now,
      updated_at: now,
    },
    {
      id: 't-5',
      board_id: 'b-1',
      column_id: 'col-3',
      title: 'Navbar Component',
      description: 'Build navigation bar with brand icon, workspace selector, and profile menu',
      priority: 'LOW',
      assignee_id: '6', // Kumar
      created_by: '1',
      due_date: '2026-09-07',
      created_at: now,
      updated_at: now,
    },
    {
      id: 't-6',
      board_id: 'b-1',
      column_id: 'col-1',
      title: 'Testing & QA Workflow',
      description: 'Write unit and integration tests for auth and workspace endpoints',
      priority: 'MEDIUM',
      assignee_id: '4', // Priya
      created_by: '1',
      due_date: '2026-09-18',
      created_at: now,
      updated_at: now,
    },
  ];

  const comments: CommentRecord[] = [
    {
      id: 'c-1',
      task_id: 't-1',
      user_id: '1', // Arun
      comment: 'Please make sure it is responsive on both mobile and desktop screens.',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'c-2',
      task_id: 't-1',
      user_id: '2', // Kishor
      comment: "Okay, I'll complete it today.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  const activities: ActivityRecord[] = [
    {
      id: 'act-1',
      workspace_id: '1',
      user_id: '1',
      action: 'WORKSPACE_CREATED',
      metadata: { workspaceName: 'College Project' },
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'act-2',
      workspace_id: '1',
      user_id: '1',
      action: 'BOARD_CREATED',
      metadata: { boardName: 'Development Board' },
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'act-3',
      workspace_id: '1',
      user_id: '1',
      task_id: 't-1',
      action: 'TASK_CREATED',
      metadata: { taskTitle: 'Create Login Page', priority: 'HIGH' },
      created_at: new Date(Date.now() - 72000000).toISOString(),
    },
    {
      id: 'act-4',
      workspace_id: '1',
      user_id: '1',
      task_id: 't-1',
      action: 'TASK_ASSIGNED',
      metadata: { taskTitle: 'Create Login Page', assigneeName: 'Kishor' },
      created_at: new Date(Date.now() - 60000000).toISOString(),
    },
  ];

  return {
    users,
    workspaces,
    workspace_members,
    boards,
    columns,
    tasks,
    comments,
    activities,
  };
}

class Database {
  private data: DatabaseState;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('Failed to read db file, initializing seed data:', err);
    }
    const seed = createSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave?: DatabaseState) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database state:', err);
    }
  }

  public get users() { return this.data.users; }
  public get workspaces() { return this.data.workspaces; }
  public get workspace_members() { return this.data.workspace_members; }
  public get boards() { return this.data.boards; }
  public get columns() { return this.data.columns; }
  public get tasks() { return this.data.tasks; }
  public get comments() { return this.data.comments; }
  public get activities() { return this.data.activities; }

  public commit() {
    this.saveData();
  }

  public resetToDefaults() {
    this.data = createSeedData();
    this.commit();
    return this.data;
  }
}

export const db = new Database();
