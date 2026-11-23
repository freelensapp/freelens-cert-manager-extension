// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CertHealthSummary } from "./cert-health-summary";

import type { CertificateStore } from "../../common/api";

describe("CertHealthSummary", () => {
  let container: HTMLDivElement;
  let root: Root;

  function renderWith(store: { items: unknown[]; isLoaded: boolean }) {
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

  it("holds its place, without counts to read, until the list has loaded", () => {
    const row = renderWith({ items: [], isLoaded: false });

    expect(row).not.toBeNull();
    expect(row?.style.visibility).toBe("hidden");
  });

  it("shows zero for a list that has loaded with nothing in it", () => {
    const row = renderWith({ items: [], isLoaded: true });

    expect(row?.style.visibility).toBe("visible");
    expect(row?.textContent).toContain("0Total");
    expect(row?.textContent).toContain("0Ready");
  });
});
