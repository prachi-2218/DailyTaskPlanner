export type User = {
  id: string;
  name: string;
  email: string;
};

export type Subtask = {
  title: string;
  done?: boolean;
};

export type Task = {
  _id: string;
  userId?: string;
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string | null;
  subtasks?: Subtask[];
  aiGenerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
