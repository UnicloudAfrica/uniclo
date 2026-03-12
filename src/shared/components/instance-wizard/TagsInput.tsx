import React, { useMemo, useState } from "react";

export interface TagsInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  dataFocusKey?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({
  value,
  onChange,
  placeholder = "Add tags and press comma",
  dataFocusKey,
}) => {
  const [draft, setDraft] = useState("");
  const tags = useMemo(
    () =>
      (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [value]
  );

  const commitTags = (incoming: string[]) => {
    const cleaned = incoming.map((item) => item.trim()).filter(Boolean);
    if (!cleaned.length) return;
    const next = [...tags, ...cleaned];
    const seen = new Set<string>();
    const deduped: string[] = [];
    next.forEach((tag) => {
      const key = tag.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(tag);
      }
    });
    onChange(deduped.join(", "));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue.includes(",")) {
      const parts = nextValue.split(",");
      const trailing = parts.pop() ?? "";
      commitTags(parts);
      setDraft(trailing);
      return;
    }
    setDraft(nextValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "," || event.key === "Enter") {
      event.preventDefault();
      if (draft.trim()) {
        commitTags([draft]);
        setDraft("");
      }
      return;
    }
    if (event.key === "Backspace" && !draft.trim() && tags.length > 0) {
      const next = tags.slice(0, -1);
      onChange(next.join(", "));
    }
  };

  const handleBlur = () => {
    if (draft.trim()) {
      commitTags([draft]);
      setDraft("");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
          >
            {tag}
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => onChange(tags.filter((t) => t !== tag).join(", "))}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          data-focus-key={dataFocusKey}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm focus:outline-none"
          value={draft}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
        />
      </div>
    </div>
  );
};

export default TagsInput;
