/**
 * Author: Maifee Ul Asad <maifeeulasad@gmail.com>
 * Co-Author: Claude Sonnet 4.6 <noreply@anthropic.com>
 *
 * Step-by-step form wizard for creating a cert-manager Certificate.
 * Step 1 — fill in the key fields.
 * Step 2 — review generated YAML, then submit.
 */

import { Renderer } from "@freelensapp/extensions";
import { dump } from "js-yaml";
import { useCallback, useEffect, useState } from "react";

interface Fields {
  name: string;
  namespace: string;
  secretName: string;
  commonName: string;
  dnsNames: string;
  issuerKind: "Issuer" | "ClusterIssuer";
  issuerName: string;
  duration: string;
  renewBefore: string;
}

const DEFAULTS: Fields = {
  name: "",
  namespace: "default",
  secretName: "",
  commonName: "",
  dnsNames: "",
  issuerKind: "Issuer",
  issuerName: "",
  duration: "2160h",
  renewBefore: "360h",
};

function buildObject(f: Fields): object {
  const dnsArray = f.dnsNames
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const obj: Record<string, unknown> = {
    apiVersion: "cert-manager.io/v1",
    kind: "Certificate",
    metadata: { name: f.name, namespace: f.namespace },
    spec: {
      secretName: f.secretName || f.name,
      issuerRef: { name: f.issuerName, kind: f.issuerKind },
      ...(f.commonName ? { commonName: f.commonName } : {}),
      ...(dnsArray.length > 0 ? { dnsNames: dnsArray } : {}),
      ...(f.duration ? { duration: f.duration } : {}),
      ...(f.renewBefore ? { renewBefore: f.renewBefore } : {}),
    },
  };
  return obj;
}

function buildYaml(f: Fields): string {
  return dump(buildObject(f), { noRefs: true });
}

// --- Shared input style ---
// Text in the form takes --textColorPrimary, readable on the dialog in every theme:
// --dialogTextColor is too faint on the default light theme, and the host's <label> color has an alpha in some themes.
const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "5px 8px",
  borderRadius: "4px",
  border: "1px solid var(--inputControlBorder)",
  background: "var(--inputControlBackground)",
  color: "var(--textColorPrimary)",
  fontSize: "0.88rem",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "0.82rem",
  color: "var(--textColorPrimary)",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label style={labelStyle}>
      {label}
      <input style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <span style={{ fontSize: "0.75rem" }}>{hint}</span>}
    </label>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (yaml: string) => Promise<void>;
  defaultNamespace?: string;
}

export function CertificateWizardDialog({ isOpen, onClose, onSubmit, defaultNamespace }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fields, setFields] = useState<Fields>({
    ...DEFAULTS,
    namespace: defaultNamespace ?? "default",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yamlOverride, setYamlOverride] = useState<string | null>(null);

  function set<K extends keyof Fields>(key: K, val: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: val }));
  }

  function handleNext() {
    setYamlOverride(null);
    setError(null);
    setStep(2);
  }

  async function handleCreate() {
    const yaml = yamlOverride ?? buildYaml(fields);
    setSaving(true);
    setError(null);
    try {
      await onSubmit(yaml);
      setStep(1);
      setFields({ ...DEFAULTS, namespace: defaultNamespace ?? "default" });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const handleClose = useCallback(() => {
    setStep(1);
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const generatedYaml = buildYaml(fields);
  const isValid = Boolean(fields.name && fields.namespace && fields.issuerName);

  return (
    <Renderer.Component.Dialog isOpen={isOpen} onClose={handleClose} modal>
      {/* Explicit backdrop — Freelens Dialog doesn't add one inside extensions */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: -1,
        }}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: step === 2 ? "700px" : "520px",
          maxWidth: "92vw",
          gap: "14px",
          padding: "18px",
          transition: "width 0.15s",
          background: "var(--dialogBackground)",
          color: "var(--dialogTextColor)",
          borderRadius: "4px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
              {step === 1 ? "Create Certificate — Details" : "Create Certificate — Review YAML"}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--textColorPrimary)", marginTop: "2px" }}>
              Step {step} of 2
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "var(--textColorPrimary)",
            }}
          >
            ✕
          </button>
        </div>

        {/* Step 1 — form */}
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Field label="Name *" value={fields.name} onChange={(v) => set("name", v)} placeholder="my-certificate" />
            <Field label="Namespace *" value={fields.namespace} onChange={(v) => set("namespace", v)} />
            <Field
              label="Secret Name"
              value={fields.secretName}
              onChange={(v) => set("secretName", v)}
              placeholder="(defaults to Name)"
            />
            <Field
              label="Common Name"
              value={fields.commonName}
              onChange={(v) => set("commonName", v)}
              placeholder="example.com"
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field
                label="DNS Names"
                value={fields.dnsNames}
                onChange={(v) => set("dnsNames", v)}
                placeholder="example.com, *.example.com"
                hint="Comma or space separated"
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "0.82rem",
                color: "var(--textColorPrimary)",
              }}
            >
              <span>Issuer Kind *</span>
              <select
                value={fields.issuerKind}
                onChange={(e) => set("issuerKind", e.target.value as "Issuer" | "ClusterIssuer")}
                style={{ ...inputStyle }}
              >
                <option value="Issuer">Issuer</option>
                <option value="ClusterIssuer">ClusterIssuer</option>
              </select>
            </div>
            <Field
              label="Issuer Name *"
              value={fields.issuerName}
              onChange={(v) => set("issuerName", v)}
              placeholder="selfsigned-issuer"
            />
            <Field
              label="Duration"
              value={fields.duration}
              onChange={(v) => set("duration", v)}
              placeholder="2160h"
              hint="e.g. 2160h = 90 days"
            />
            <Field
              label="Renew Before"
              value={fields.renewBefore}
              onChange={(v) => set("renewBefore", v)}
              placeholder="360h"
              hint="e.g. 360h = 15 days"
            />
          </div>
        )}

        {/* Step 2 — YAML preview / edit */}
        {step === 2 && (
          <div
            style={{
              height: "380px",
              border: "1px solid var(--halfGray)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <Renderer.Component.MonacoEditor
              language="yaml"
              value={yamlOverride ?? generatedYaml}
              onChange={(v) => setYamlOverride(v === generatedYaml ? null : v)}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              // No error token is readable as text on the dialog in every theme, so the border marks the error.
              color: "var(--textColorPrimary)",
              borderLeft: "3px solid var(--colorError)",
              fontSize: "0.84rem",
              padding: "2px 4px 2px 8px",
            }}
          >
            {error}
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              style={{
                padding: "6px 14px",
                cursor: "pointer",
                borderRadius: "4px",
                border: "1px solid var(--halfGray)",
                background: "transparent",
                color: "var(--textColorPrimary)",
              }}
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
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
          {step === 1 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isValid}
              style={{
                padding: "6px 14px",
                cursor: isValid ? "pointer" : "not-allowed",
                borderRadius: "4px",
                border: "none",
                // A disabled button keeps its fixed colors: no theme variable is readable on
                // --buttonDisabledBackground in every theme.
                background: isValid ? "var(--buttonPrimaryBackground)" : "#555",
                color: isValid ? "var(--textColorOnPrimary)" : "#fff",
              }}
            >
              Review YAML →
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              style={{
                padding: "6px 14px",
                cursor: saving ? "not-allowed" : "pointer",
                borderRadius: "4px",
                border: "none",
                background: saving ? "#555" : "var(--buttonPrimaryBackground)",
                color: saving ? "#fff" : "var(--textColorOnPrimary)",
              }}
            >
              {saving ? "Creating…" : "Create Certificate"}
            </button>
          )}
        </div>
      </div>
    </Renderer.Component.Dialog>
  );
}
