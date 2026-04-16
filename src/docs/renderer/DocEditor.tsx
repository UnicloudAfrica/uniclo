import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import MarkdownDocPage from "./MarkdownDocPage";
import { loadAdminDoc, adminDocSections } from "../config/adminDocs";
import { loadTenantDoc, tenantDocSections } from "../config/tenantDocs";
import { loadClientDoc, clientDocSections } from "../config/clientDocs";
import type { DocSection } from "../config/adminDocs";
import {
  Save, Eye, Edit3, RotateCcw, FileText, Upload, ImagePlus, Copy, Check,
} from "lucide-react";

type DocScope = "admin" | "tenant" | "client";

const scopeLoaders: Record<DocScope, (slug: string) => Promise<string>> = {
  admin: loadAdminDoc,
  tenant: loadTenantDoc,
  client: loadClientDoc,
};

const scopeSections: Record<DocScope, DocSection[]> = {
  admin: adminDocSections,
  tenant: tenantDocSections,
  client: clientDocSections,
};

const scopeLabels: Record<DocScope, string> = {
  admin: "Admin Documentation",
  tenant: "Tenant Documentation",
  client: "Client Documentation",
};

const STORAGE_PREFIX = "doc-override:";
const IMAGE_STORAGE_PREFIX = "doc-image:";

/** Save edited doc content to localStorage */
function saveDocOverride(scope: DocScope, slug: string, content: string) {
  localStorage.setItem(`${STORAGE_PREFIX}${scope}:${slug}`, content);
}

/** Load any saved override from localStorage */
function getDocOverride(scope: DocScope, slug: string): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}${scope}:${slug}`);
}

/** Remove a saved override */
function clearDocOverride(scope: DocScope, slug: string) {
  localStorage.removeItem(`${STORAGE_PREFIX}${scope}:${slug}`);
}

/** Save an uploaded image as base64 data URL in localStorage */
function saveDocImage(name: string, dataUrl: string) {
  localStorage.setItem(`${IMAGE_STORAGE_PREFIX}${name}`, dataUrl);
}

/** Get all saved doc images */
function getDocImages(): { name: string; dataUrl: string }[] {
  const images: { name: string; dataUrl: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(IMAGE_STORAGE_PREFIX)) {
      const name = key.slice(IMAGE_STORAGE_PREFIX.length);
      const dataUrl = localStorage.getItem(key) || "";
      images.push({ name, dataUrl });
    }
  }
  return images;
}

/** Remove a saved doc image */
function removeDocImage(name: string) {
  localStorage.removeItem(`${IMAGE_STORAGE_PREFIX}${name}`);
}

/** Get all page slugs for a scope (flattened from sections) */
function getSlugsForScope(scope: DocScope): { slug: string; label: string }[] {
  const sections = scopeSections[scope];
  const slugs: { slug: string; label: string }[] = [];
  for (const section of sections) {
    for (const link of section.links) {
      slugs.push({ slug: link.slug || "home", label: link.label });
    }
  }
  return slugs;
}

const DocEditor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = (searchParams.get("scope") || "admin") as DocScope;
  const docSlug = searchParams.get("page") || "home";

  const [original, setOriginal] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isPreview, setIsPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasOverride, setHasOverride] = useState(false);

  // Image upload state
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
  const [copiedImage, setCopiedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pages = getSlugsForScope(scope);

  // Load doc content when scope or slug changes
  useEffect(() => {
    setSaved(false);
    const loader = scopeLoaders[scope];
    if (!loader) return;

    loader(docSlug === "home" ? "" : docSlug)
      .then((staticContent) => {
        setOriginal(staticContent);
        const override = getDocOverride(scope, docSlug);
        if (override) {
          setContent(override);
          setHasOverride(true);
        } else {
          setContent(staticContent);
          setHasOverride(false);
        }
      })
      .catch(() => {
        const fallback = `---\ntitle: ${docSlug}\n---\n\nThis documentation page does not exist yet. Start writing!`;
        setOriginal(fallback);
        setContent(fallback);
      });
  }, [scope, docSlug]);

  // Refresh image list when panel opens
  useEffect(() => {
    if (showImagePanel) {
      setImages(getDocImages());
    }
  }, [showImagePanel]);

  const handleSave = useCallback(() => {
    saveDocOverride(scope, docSlug, content);
    setSaved(true);
    setHasOverride(true);
    setTimeout(() => setSaved(false), 2000);
  }, [scope, docSlug, content]);

  const handleReset = useCallback(() => {
    clearDocOverride(scope, docSlug);
    setContent(original);
    setHasOverride(false);
  }, [scope, docSlug, original]);

  const handleScopeChange = (newScope: string) => {
    setSearchParams({ scope: newScope, page: "home" });
  };

  const handlePageChange = (newPage: string) => {
    setSearchParams({ scope, page: newPage });
  };

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const name = `${Date.now()}-${file.name}`;
        saveDocImage(name, dataUrl);
        setImages(getDocImages());
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Insert screenshot syntax into editor at cursor position
  const insertScreenshotSyntax = useCallback((imageName: string, dataUrl: string) => {
    const syntax = `\n:::screenshot{caption="${imageName}" src="${dataUrl}"}\n:::\n`;

    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + syntax + content.slice(end);
      setContent(newContent);

      // Move cursor after inserted text
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + syntax.length;
        textarea.focus();
      });
    } else {
      setContent(content + syntax);
    }

    setCopiedImage(imageName);
    setTimeout(() => setCopiedImage(null), 2000);
  }, [content]);

  const handleDeleteImage = useCallback((name: string) => {
    removeDocImage(name);
    setImages(getDocImages());
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border"
        style={{
          borderColor: "var(--theme-border-color, #e5e7eb)",
          backgroundColor: "var(--theme-card-bg, #fff)",
        }}
      >
        <div className="flex items-center gap-3">
          <FileText size={18} style={{ color: "var(--theme-color, #288DD1)" }} />
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scope selector */}
            <select
              value={scope}
              onChange={(e) => handleScopeChange(e.target.value)}
              className="text-sm border rounded-md px-2 py-1.5"
              style={{
                borderColor: "var(--theme-border-color, #e5e7eb)",
                color: "var(--theme-text-color, #374151)",
              }}
            >
              <option value="admin">Admin Docs</option>
              <option value="tenant">Tenant Docs</option>
              <option value="client">Client Docs</option>
            </select>

            {/* Page selector */}
            <select
              value={docSlug}
              onChange={(e) => handlePageChange(e.target.value)}
              className="text-sm border rounded-md px-2 py-1.5"
              style={{
                borderColor: "var(--theme-border-color, #e5e7eb)",
                color: "var(--theme-text-color, #374151)",
              }}
            >
              {pages.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>

            {hasOverride && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                Modified
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImagePanel(!showImagePanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--theme-border-color, #e5e7eb)",
              color: showImagePanel ? "var(--theme-color, #288DD1)" : "var(--theme-text-color, #374151)",
              backgroundColor: showImagePanel ? "color-mix(in srgb, var(--theme-color, #288DD1) 10%, transparent)" : "transparent",
            }}
          >
            <ImagePlus size={14} /> Images
          </button>

          <button
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--theme-border-color, #e5e7eb)",
              color: isPreview ? "var(--theme-color, #288DD1)" : "var(--theme-text-color, #374151)",
              backgroundColor: isPreview ? "color-mix(in srgb, var(--theme-color, #288DD1) 10%, transparent)" : "transparent",
            }}
          >
            {isPreview ? <><Edit3 size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
          </button>

          {hasOverride && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors hover:opacity-80"
              style={{
                borderColor: "var(--theme-border-color, #e5e7eb)",
                color: "var(--theme-text-color, #374151)",
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--theme-color, #288DD1)" }}
          >
            <Save size={14} /> {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Image Upload Panel */}
      {showImagePanel && (
        <div
          className="rounded-lg border p-4 space-y-4"
          style={{
            borderColor: "var(--theme-border-color, #e5e7eb)",
            backgroundColor: "var(--theme-card-bg, #fff)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
              Screenshot Library
            </h3>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="doc-image-upload"
              />
              <label
                htmlFor="doc-image-upload"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white cursor-pointer transition-colors hover:opacity-90"
                style={{ backgroundColor: "var(--theme-color, #288DD1)" }}
              >
                <Upload size={14} /> Upload Image
              </label>
            </div>
          </div>

          {images.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
              No images uploaded yet. Upload screenshots to use in your documentation.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.name}
                  className="rounded-lg border overflow-hidden group relative"
                  style={{ borderColor: "var(--theme-border-color, #e5e7eb)" }}
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 space-y-1">
                    <p className="text-xs truncate" style={{ color: "var(--theme-muted-color, #6b7280)" }}>
                      {img.name.replace(/^\d+-/, "")}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => insertScreenshotSyntax(img.name.replace(/^\d+-/, ""), img.dataUrl)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--theme-color, #288DD1) 10%, transparent)",
                          color: "var(--theme-color, #288DD1)",
                        }}
                      >
                        {copiedImage === img.name ? <><Check size={12} /> Inserted</> : <><Copy size={12} /> Insert</>}
                      </button>
                      <button
                        onClick={() => handleDeleteImage(img.name)}
                        className="px-2 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="rounded-md p-3 text-xs space-y-1"
            style={{ backgroundColor: "var(--theme-surface-alt, #f3f4f6)", color: "var(--theme-muted-color, #6b7280)" }}
          >
            <p className="font-semibold" style={{ color: "var(--theme-text-color, #374151)" }}>How to use images:</p>
            <p>1. Upload a screenshot using the button above</p>
            <p>2. Click "Insert" to add it at your cursor position in the editor</p>
            <p>3. Or manually write: <code className="px-1 py-0.5 rounded bg-white">{":::screenshot{caption=\"Your caption\" src=\"image-url\"}"}</code></p>
            <p>4. Click "Preview" to see how it looks</p>
          </div>
        </div>
      )}

      {/* Editor or Preview */}
      {isPreview ? (
        <div
          className="rounded-lg border p-6"
          style={{
            borderColor: "var(--theme-border-color, #e5e7eb)",
            backgroundColor: "var(--theme-card-bg, #fff)",
          }}
        >
          <MarkdownDocPage content={content} />
        </div>
      ) : (
        <div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full font-mono text-sm rounded-lg border p-4 min-h-[70vh] resize-y"
            style={{
              borderColor: "var(--theme-border-color, #e5e7eb)",
              backgroundColor: "var(--theme-card-bg, #fff)",
              color: "var(--theme-text-color, #374151)",
            }}
            spellCheck={false}
          />
          <div
            className="mt-3 rounded-md p-3 text-xs space-y-1"
            style={{ backgroundColor: "var(--theme-surface-alt, #f3f4f6)", color: "var(--theme-muted-color, #6b7280)" }}
          >
            <p className="font-semibold" style={{ color: "var(--theme-text-color, #374151)" }}>Syntax reference:</p>
            <p><code className="px-1 py-0.5 rounded bg-white">{":::step{number=1 icon=LogIn title=\"Title\" navigation=\"Sidebar > Section\"}"}</code> ... <code className="px-1 py-0.5 rounded bg-white">{":::"}</code></p>
            <p><code className="px-1 py-0.5 rounded bg-white">{":::callout{type=tip title=\"Tip title\"}"}</code> ... <code className="px-1 py-0.5 rounded bg-white">{":::"}</code> &nbsp; (types: tip, warning, info)</p>
            <p><code className="px-1 py-0.5 rounded bg-white">{":::screenshot{caption=\"Caption\" src=\"url\"}"}</code> <code className="px-1 py-0.5 rounded bg-white">{":::"}</code></p>
            <p><code className="px-1 py-0.5 rounded bg-white">{":::mermaid{caption=\"Diagram title\"}"}</code> ... mermaid code ... <code className="px-1 py-0.5 rounded bg-white">{":::"}</code></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocEditor;
