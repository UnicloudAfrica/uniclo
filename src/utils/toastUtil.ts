import { toast, ExternalToast } from "sonner";

interface ToastOptions extends ExternalToast {
  description?: string;
}

const ToastUtils = {
  success(msg: string, options: ToastOptions = {}) {
    toast.success(msg, {
      description: options.description,
      ...options,
    });
  },
  error(msg: string, options: ToastOptions = {}) {
    toast.error(msg, {
      description: options.description,
      ...options,
    });
  },
  info(msg: string, options: ToastOptions = {}) {
    toast.info(msg, {
      description: options.description,
      ...options,
    });
  },
  warning(msg: string, options: ToastOptions = {}) {
    toast.warning(msg, {
      description: options.description,
      ...options,
    });
  },
  // Generic toast method with more flexibility
  toast(msg: string, options: ToastOptions = {}) {
    toast(msg, options);
  },
};

export default ToastUtils;
