import { toast } from "sonner";

const ToastUtils = {
  success(msg, options = {}) {
    toast.success(msg, {
      description: options.description,
      ...options,
    });
  },
  error(msg, options = {}) {
    toast.error(msg, {
      description: options.description,
      ...options,
    });
  },
  info(msg, options = {}) {
    toast.info(msg, {
      description: options.description,
      ...options,
    });
  },
  warning(msg, options = {}) {
    toast.warning(msg, {
      // Changed from generic toast to toast.warning
      description: options.description,
      ...options,
    });
  },
  // Generic toast method with more flexibility
  toast(msg, options = {}) {
    toast(msg, options);
  },
};

export default ToastUtils;
