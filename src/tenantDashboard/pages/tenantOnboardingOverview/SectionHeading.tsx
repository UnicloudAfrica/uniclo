const SectionHeading = ({ title, count }: { title: string; count: number }) => (
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{count}</span>
  </div>
);

export default SectionHeading;
