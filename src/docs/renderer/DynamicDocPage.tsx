import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MarkdownDocPage from "./MarkdownDocPage";
import { Loader2 } from "lucide-react";

const STORAGE_PREFIX = "doc-override:";

interface DynamicDocPageProps {
  loadDoc: (slug: string) => Promise<string>;
  /** Scope key used to look up localStorage overrides (e.g. "admin", "tenant", "client") */
  scope?: string;
}

const DynamicDocPage: React.FC<DynamicDocPageProps> = ({ loadDoc, scope }) => {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docSlug = slug || "home";

  useEffect(() => {
    setContent(null);
    setError(null);

    // Check for admin-saved override first
    if (scope) {
      const override = localStorage.getItem(`${STORAGE_PREFIX}${scope}:${docSlug}`);
      if (override) {
        setContent(override);
        return;
      }
    }

    loadDoc(docSlug)
      .then(setContent)
      .catch(() => setError("Documentation page not found."));
  }, [docSlug, loadDoc, scope]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--theme-color, #0A5E3E)" }} />
      </div>
    );
  }

  return <MarkdownDocPage content={content} />;
};

export default DynamicDocPage;
