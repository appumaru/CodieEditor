import { reactive, toRefs } from 'vue';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  count: number;
}

// Create a reactive store for toasts
const state = reactive<ToastState>({
  toasts: [],
  count: 0
});

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export function useToast() {
  const show = (toast: Omit<Toast, 'id'>) => {
    const id = ++state.count;
    const newToast = {
      id,
      title: toast.title,
      description: toast.description,
      type: toast.type,
      duration: toast.duration || 3000
    };
    
    state.toasts.push(newToast);
    
    // Auto-dismiss toast after specified duration, but only in browser
    if (isBrowser && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }
    
    return id;
  };
  
  const dismiss = (id: number) => {
    const index = state.toasts.findIndex(toast => toast.id === id);
    if (index !== -1) {
      state.toasts.splice(index, 1);
    }
  };
  
  const clear = () => {
    state.toasts = [];
  };
  
  return {
    ...toRefs(state),
    show,
    dismiss,
    clear
  };
} 