// @vitest-environment jsdom

import { observable, runInAction } from "mobx";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Certificate, CertificateRequest, Challenge, ClusterIssuer, Issuer, Order } from "../../common/api";
import { CertificateRequestsPage } from "./certificate-requests-page";
import { CertificatesPage } from "./certificates-page";
import { ChallengesPage } from "./challenges-page";
import { ClusterIssuersPage } from "./cluster-issuers-page";
import { IssuersPage } from "./issuers-page";
import { OrdersPage } from "./orders-page";

import type { FunctionComponent } from "react";

const pages: { kind: string; model: object; Page: FunctionComponent }[] = [
  { kind: "Certificate", model: Certificate, Page: CertificatesPage },
  { kind: "CertificateRequest", model: CertificateRequest, Page: CertificateRequestsPage },
  { kind: "Issuer", model: Issuer, Page: IssuersPage },
  { kind: "ClusterIssuer", model: ClusterIssuer, Page: ClusterIssuersPage },
  { kind: "Order", model: Order, Page: OrdersPage },
  { kind: "Challenge", model: Challenge, Page: ChallengesPage },
];

describe.each(pages)("the list page of $kind", ({ model, Page }) => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  // The host registers the API of a CRD after the cluster frame has loaded the CRDs, in an observable registry.
  it("leaves the notice by itself when the host registers its kind", () => {
    const registered = observable.box(false);

    vi.spyOn(model as { getStore: () => unknown }, "getStore").mockImplementation(() => {
      if (!registered.get()) {
        throw new Error("Not registered");
      }

      return { items: [], isLoaded: true };
    });

    act(() => root.render(<Page />));
    expect(container.textContent).toContain("is not installed");

    act(() => runInAction(() => registered.set(true)));
    expect(container.textContent).not.toContain("is not installed");
  });
});
