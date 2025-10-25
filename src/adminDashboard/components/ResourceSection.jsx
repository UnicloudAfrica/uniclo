import { Loader2 } from "lucide-react";

const ResourceSection = ({
  title,
  description,
  actions,
  isLoading = false,
  children,
}) => {
  return (
    <section className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 font-Outfit">
      <header className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-3 w-full md:w-auto">{actions}</div>
        )}
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </section>
  );
};

export default ResourceSection;

