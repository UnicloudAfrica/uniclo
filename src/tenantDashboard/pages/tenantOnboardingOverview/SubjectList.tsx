import { StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS, STATUS_TONES } from "@/shared/constants/onboarding";
import type { OnboardingSubject } from "./types";
import SectionHeading from "./SectionHeading";

interface SubjectListProps {
  label: string;
  items: OnboardingSubject[];
  selectedKey: string | null;
  onSelect: (subject: OnboardingSubject) => void;
}

const SubjectList = ({ label, items, selectedKey, onSelect }: SubjectListProps) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4">
    <SectionHeading title={label} count={items.length} />
    {items.length === 0 ? (
      <p className="mt-3 text-sm text-gray-500">No records yet.</p>
    ) : (
      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const isActive = selectedKey === item.subjectKey;
          const currentStep =
            item.steps.find((step) => step.id === item.current_step) ?? item.steps[0];

          return (
            <button
              key={item.subjectKey}
              onClick={() => onSelect(item)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentStep ? currentStep.label : "No steps yet"}
                  </p>
                </div>
                <StatusPill
                  label={STATUS_LABELS[item.status] ?? item.status.replace(/_/g, " ")}
                  tone={STATUS_TONES[item.status] ?? "neutral"}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${item.progress.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{item.progress.percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export default SubjectList;
