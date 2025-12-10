import { useEffect, useState } from 'react';
import { Plus, Sparkles, LogOut, Loader2, CheckCircle, Circle, Filter, Search, Menu, X, Check } from 'lucide-react';
import type { User, Task } from '../types';
import { fetchTasks, createTask, updateTask as apiUpdate, deleteTask as apiDelete, generateTaskAI } from '../api';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import AIAssistModal from '../components/AIAssistModal';

type Props = {
  token: string;
  user: User;
  onLogout: () => void;
};

type ViewMode = 'all' | 'active' | 'completed';

export default function Dashboard({ token, user, onLogout }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const t = await fetchTasks(token);
      setTasks(t);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load tasks');
    }
    setLoading(false);
  }

  useEffect(()=>{ load(); }, []);

  async function addTask(task: Partial<Task>) {
    try {
      const created = await createTask(task, token);
      setTasks(prev => [created, ...prev]);
    } catch (e) { alert('Failed to create'); }
  }

  async function updateTask(id: string, body: Partial<Task>) {
    try {
      const updated = await apiUpdate(id, body, token);
      setTasks(prev => prev.map(t => t._id === id ? updated : t));
    } catch (e) { alert('Failed to update'); }
  }

  async function deleteTask(id: string) {
    
    try {
      await apiDelete(id, token);
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch (e) { alert('Failed to delete'); }
  }

  async function onGenerateAI(prompt: string) {
    try {
      const res = await generateTaskAI(prompt, token);
      const ai = res.ai;
      // transform ai to Task shape
      const task: Partial<Task> = {
        title: ai.title || prompt,
        description: ai.description || '',
        priority: ai.priority || 'medium',
        subtasks: (ai.subtasks || []).map((s: string) => ({ title: s })),
        aiGenerated: true
      };
      await addTask(task);
    } catch (e: any) {
      alert(e?.message || 'AI generation failed');
    }
  }

  // Filter tasks based on view mode and search query
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (viewMode === 'active') {
      return matchesSearch && task.status !== 'done';
    } else if (viewMode === 'completed') {
      return matchesSearch && task.status === 'done';
    }
    return matchesSearch;
  });

  const activeTasksCount = tasks.filter(t => t.status !== 'done').length;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Sparkles className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">FocusFlow</span>
              </div>
              <div className="hidden md:block ml-10">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`${viewMode === 'all' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    All Tasks
                  </button>
                  <button
                    onClick={() => setViewMode('active')}
                    className={`${viewMode === 'active' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setViewMode('completed')}
                    className={`${viewMode === 'completed' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Completed
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAI(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">AI Assist</span>
                    </button>
                    <button
                      onClick={() => setShowAdd(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">New Task</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5 text-gray-600 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <div className="px-3 py-2">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex space-x-2 px-3 py-2">
                <button
                  onClick={() => { setViewMode('all'); setMobileMenuOpen(false); }}
                  className={`${viewMode === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'} block px-3 py-2 rounded-md text-base font-medium`}
                >
                  All Tasks
                </button>
                <button
                  onClick={() => { setViewMode('active'); setMobileMenuOpen(false); }}
                  className={`${viewMode === 'active' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'} block px-3 py-2 rounded-md text-base font-medium`}
                >
                  Active
                </button>
                <button
                  onClick={() => { setViewMode('completed'); setMobileMenuOpen(false); }}
                  className={`${viewMode === 'completed' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'} block px-3 py-2 rounded-md text-base font-medium`}
                >
                  Completed
                </button>
              </div>
              <div className="px-3 py-2 space-y-1">
                <button
                  onClick={() => { setShowAdd(true); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </button>
                <button
                  onClick={() => { setShowAI(true); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Assist
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{tasks.length}</div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <Circle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{activeTasksCount}</div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-400 rounded-md p-3">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{completedTasksCount}</div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Task list */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {viewMode === 'all' ? 'All Tasks' : viewMode === 'active' ? 'Active Tasks' : 'Completed Tasks'}
                </h3>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading tasks...</span>
              </div>
            ) : err ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{err}</p>
                  </div>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? 'No tasks match your search. Try a different query.'
                    : viewMode === 'all'
                    ? 'Get started by creating a new task.'
                    : viewMode === 'active'
                    ? 'No active tasks. All caught up!'
                    : 'No completed tasks yet.'}
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    New Task
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <li key={task._id}>
                    <TaskCard task={task} onUpdate={updateTask} onDelete={deleteTask} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSave={addTask} />}
      {showAI && <AIAssistModal token={token} onClose={() => setShowAI(false)} onGenerate={onGenerateAI} />}
    </div>
  );
}
