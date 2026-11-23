// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CertHealthSummary } from "./cert-health-summary";

import type { CertificateStore } from "../../common/api";

const readyCertificate = { status: { conditions: [{ type: "Ready", status: "True" }] } };
const failingCertificate = { status: { conditions: [{ type: "Ready", status: "False" }] } };

describe("CertHealthSummary", () => {
  let container: HTMLDivElement;
  let root: Root;

  function renderWith(store: { items: unknown[]; contextItems: unknown[] }) {
    act(() => root.render(<CertHealthSummary store={store as unknown as CertificateStore} />));

    return container.firstElementChild as HTMLElement | null;
  }

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("keeps its row, hidden and with its tiles, when it has nothing to count", () => {
    const row = renderWith({ items: [], contextItems: [] });

    expect(row).not.toBeNull();
    expect(row?.style.visibility).toBe("hidden");
    expect(row?.textContent).toContain("Total");
    expect(row?.textContent).toContain("Ready");
  });

  it("shows the counts of a list with a certificate", () => {
    const row = renderWith({ items: [failingCertificate], contextItems: [failingCertificate] });

    expect(row?.style.visibility).not.toBe("hidden");
    expect(row?.textContent).toContain("1Total");
    expect(row?.textContent).toContain("0Ready");
    expect(row?.textContent).toContain("1Not Ready");
  });

  it("counts only the certificates of the namespaces in the filter", () => {
    const row = renderWith({
      items: [readyCertificate, failingCertificate],
      contextItems: [readyCertificate],
    });

    expect(row?.textContent).toContain("1Total");
    expect(row?.textContent).toContain("1Ready");
    expect(row?.textContent).not.toContain("Not Ready");
  });

  it("hides the counts when the namespaces in the filter have no certificate", () => {
    const row = renderWith({ items: [readyCertificate], contextItems: [] });

    expect(row?.style.visibility).toBe("hidden");
  });
});
