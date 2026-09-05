import { Workspace, WorkspaceMember, Board, Column, Task, Comment, Activity, User, Role, Priority } from '../types';
import { clientBackend } from './clientBackend';

const TOKEN_KEY = 'collabboard_jwt_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

// Tracks whether the backend API server is online or if we should run in client-side storage mode
let isServerOnline: boolean | null = null;

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If we already know the server is not reachable (e.g. deployed statically on Vercel/Netlify), use client storage
  if (isServerOnline === false) {
    return clientBackend.handle<T>(endpoint, options);
  }

  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    // If Vercel or a static host returns 404/405 or fallback index.html instead of JSON API response
    if (response.status === 404 || response.status === 405 || (contentType.includes('text/html') && !response.ok)) {
      console.info('Backend API unavailable (404/405). Falling back seamlessly to browser client database.');
      isServerOnline = false;
      return clientBackend.handle<T>(endpoint, options);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    isServerOnline = true;
    return data as T;
  } catch (err: any) {
    // If network error (e.g. fetch failed or connection refused), fallback to client backend
    if (isServerOnline === null || isServerOnline === false) {
      console.info('Backend network connection failed. Switching to browser client database.');
      isServerOnline = false;
      return clientBackend.handle<T>(endpoint, options);
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string; confirmPassword?: string }) =>
    apiFetch<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiFetch<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  demoSwitch: (email: string) =>
    apiFetch<{ message: string; token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getMe: () => apiFetch<User>('/api/auth/me'),

  getUsers: () => apiFetch<{ id: string; name: string; email: string }[]>('/api/auth/users'),

  resetDemo: () =>
    apiFetch<{ message: string }>('/api/reset-demo', {
      method: 'POST',
    }),

  // Workspaces
  getWorkspaces: () => apiFetch<Workspace[]>('/api/workspaces'),

  getWorkspace: (id: string) => apiFetch<Workspace>(`/api/workspaces/${id}`),

  createWorkspace: (payload: { name: string; description?: string }) =>
    apiFetch<Workspace>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateWorkspace: (id: string, payload: { name?: string; description?: string }) =>
    apiFetch<Workspace>(`/api/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteWorkspace: (id: string) =>
    apiFetch<{ message: string }>(`/api/workspaces/${id}`, {
      method: 'DELETE',
    }),

  // Members
  getMembers: (workspaceId: string) =>
    apiFetch<WorkspaceMember[]>(`/api/workspaces/${workspaceId}/members`),

  addMember: (workspaceId: string, payload: { email: string; role: Role }) =>
    apiFetch<WorkspaceMember>(`/api/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMemberRole: (workspaceId: string, userId: string, role: Role) =>
    apiFetch<{ message: string; role: Role }>(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  removeMember: (workspaceId: string, userId: string) =>
    apiFetch<{ message: string }>(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    }),

  getActivities: (workspaceId: string) =>
    apiFetch<Activity[]>(`/api/workspaces/${workspaceId}/activities`),

  // Boards
  getBoards: (workspaceId: string) =>
    apiFetch<Board[]>(`/api/boards/workspace/${workspaceId}`),

  getBoard: (boardId: string) =>
    apiFetch<Board>(`/api/boards/${boardId}`),

  createBoard: (workspaceId: string, payload: { name: string }) =>
    apiFetch<Board>(`/api/boards/workspace/${workspaceId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateBoard: (boardId: string, payload: { name: string }) =>
    apiFetch<Board>(`/api/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteBoard: (boardId: string) =>
    apiFetch<{ message: string }>(`/api/boards/${boardId}`, {
      method: 'DELETE',
    }),

  // Columns
  addColumn: (boardId: string, name: string) =>
    apiFetch<Column>(`/api/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateColumn: (columnId: string, name: string) =>
    apiFetch<Column>(`/api/boards/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  deleteColumn: (columnId: string) =>
    apiFetch<{ message: string }>(`/api/boards/columns/${columnId}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: (boardId: string, params?: { search?: string; priority?: string; assignee?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.assignee) searchParams.set('assignee', params.assignee);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return apiFetch<Task[]>(`/api/tasks/board/${boardId}${query ? `?${query}` : ''}`);
  },

  getMyTasks: (workspaceId?: string) => {
    const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
    return apiFetch<Task[]>(`/api/tasks/my${query}`);
  },

  getTask: (taskId: string) => apiFetch<Task>(`/api/tasks/${taskId}`),

  createTask: (boardId: string, payload: {
    title: string;
    description?: string;
    priority?: Priority;
    assigneeId?: string | null;
    dueDate?: string;
    columnId?: string;
  }) =>
    apiFetch<Task>(`/api/tasks/board/${boardId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTask: (taskId: string, payload: Partial<{
    title: string;
    description: string;
    priority: Priority;
    assigneeId: string | null;
    dueDate: string;
    columnId: string;
  }>) =>
    apiFetch<Task>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteTask: (taskId: string) =>
    apiFetch<{ message: string }>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  // Comments
  getComments: (taskId: string) =>
    apiFetch<Comment[]>(`/api/tasks/${taskId}/comments`),

  addComment: (taskId: string, comment: string) =>
    apiFetch<Comment>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  deleteComment: (commentId: string) =>
    apiFetch<{ message: string }>(`/api/tasks/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
