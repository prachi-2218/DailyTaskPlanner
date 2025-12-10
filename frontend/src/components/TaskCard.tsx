import { useState } from 'react';
import { Check, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import type { Task } from '../types';

type Props = {
  task: Task;
  onUpdate: (id: string, body: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function TaskCard({ task, onUpdate, onDelete }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const toggleDone = async () => {
    await onUpdate(task._id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setShowDeleteModal(false);
    await onDelete(task._id);
    setIsDeleting(false);
  };

  return (
    <div className="relative">
      <div className={`p-5 bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md ${task.status === 'done' ? 'opacity-75' : ''} ${isDeleting ? 'opacity-50' : ''}`}>
        <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={toggleDone}
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'}`}
            aria-label={task.status === 'done' ? 'Mark as not done' : 'Mark as done'}
          >
            {task.status === 'done' && <Check className="w-3 h-3 text-white" />}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-gray-100'}`}>
                {task.priority}
              </span>
            </div>
            
            {task.description && (
              <p className="mt-1 text-sm text-gray-600">
                {task.description}
              </p>
            )}
            
            {task.subtasks && task.subtasks.length > 0 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide subtasks ({task.subtasks.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show subtasks ({task.subtasks.length})
                  </>
                )}
              </button>
            )}
            
            {isExpanded && task.subtasks && task.subtasks.length > 0 && (
              <ul className="mt-2 space-y-2 pl-4 border-l-2 border-gray-100">
                {task.subtasks.map((subtask, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    {subtask.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {task.createdAt && (
            <div className="hidden sm:flex items-center text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <span>{new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        </div>
        
        {task.aiGenerated && (
          <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600">
            <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">AI</span>
            <span>AI Generated</span>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />
    </div>
  );
}
