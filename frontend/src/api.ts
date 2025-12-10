import type { Task } from './types';
import type { User } from './types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ApiError = { message?: string; [k:string]: any };

async function request<T>(path: string, method = 'GET', body?: any, token?: string): Promise<T> {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!res.ok) {
    throw (data as ApiError);
  }
  return data as T;
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: User }>('/auth/login', 'POST', { email, password });
}
export async function signup(name: string, email: string, password: string) {
  return request<{ token: string; user: User }>('/auth/signup', 'POST', { name, email, password });
}

export async function fetchTasks(token: string) {
  return request<Task[]>('/tasks', 'GET', undefined, token);
}
export async function createTask(task: Partial<Task>, token: string) {
  return request<Task>('/tasks', 'POST', task, token);
}
export async function updateTask(id: string, body: Partial<Task>, token: string) {
  return request<Task>(`/tasks/${id}`, 'PUT', body, token);
}
export async function deleteTask(id: string, token: string) {
  return request<{ message: string }>(`/tasks/${id}`, 'DELETE', undefined, token);
}

export async function generateTaskAI(prompt: string, token: string) {
  return request<{ ai: any }>('/ai/generate-task', 'POST', { prompt }, token);
}
