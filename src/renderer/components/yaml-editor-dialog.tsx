/**
 * Author: Maifee Ul Asad <maifeeulasad@gmail.com>
 * Co-Author: Claude Sonnet 4.6 <noreply@anthropic.com>
 */

import { Renderer } from "@freelensapp/extensions";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  title: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: (yaml: string) => Promise<void>;
}

export function YamlEditorDialog({ isOpen, title, value, onChange, onClose, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Renderer.Component.Dialog isOpen={isOpen} onClose={onClose} modal pinned>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "700px",
          maxWidth: "90vw",
          gap: "12px",
          padding: "16px",
          background: "var(--dialogBackground)",
          // The controls below take --textColorPrimary: --dialogTextColor is too faint on the default light theme.
          color: "var(--dialogTextColor)",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "var(--textColorPrimary)",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            height: "450px",
            border: "1px solid var(--halfGray)",
            borderRadius: "4px",
          }}
        >
          <Renderer.Component.MonacoEditor
            language="yaml"
            value={value}
            onChange={(v) => onChange(v)}
            style={{ height: "100%", width: "100%" }}
          />
        </div>

        {error && (
          <div
            style={{
              // No error token is readable as text on the dialog in every theme, so the border marks the error.
              color: "var(--textColorPrimary)",
              borderLeft: "3px solid var(--colorError)",
              fontSize: "0.85rem",
              padding: "4px 8px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 14px",
              cursor: "pointer",
              borderRadius: "4px",
              border: "1px solid var(--halfGray)",
              background: "transparent",
              color: "var(--textColorPrimary)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "6px 14px",
              cursor: saving ? "not-allowed" : "pointer",
              borderRadius: "4px",
              border: "none",
              // A disabled button keeps its fixed colors: no theme variable is readable on
              // --buttonDisabledBackground in every theme.
              background: saving ? "#555" : "var(--buttonPrimaryBackground)",
              color: saving ? "#fff" : "var(--textColorOnPrimary)",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Renderer.Component.Dialog>
  );
}
