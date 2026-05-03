import { useEffect } from "react";
import useShellPreferencesStore from "@/stores/shellPreferencesStore";

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
};

/**
 * Listens for `⌘,` (Cmd+Comma on macOS) or `Ctrl+,` (Linux/Windows) and
 * toggles the shell settings drawer. Mounted once at the top of the app
 * so it works regardless of which dashboard the user is on.
 *
 * Suppressed while focus is in an editable element, so a user typing a
 * comma into a search field doesn't accidentally open the drawer.
 */
export const useSettingsHotkey = (): void => {
  const toggleSettings = useShellPreferencesStore((state) => state.toggleSettings);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isComma = event.key === "," || event.code === "Comma";
      if (!isComma) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      toggleSettings();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSettings]);
};

export default useSettingsHotkey;
