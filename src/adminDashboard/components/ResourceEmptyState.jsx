const ResourceEmptyState = ({ title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 gap-3">
      {title && <p className="text-base font-medium text-gray-800">{title}</p>}
      {message && <p className="text-sm text-gray-500 max-w-md">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default ResourceEmptyState;

