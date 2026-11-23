/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// One session with the CRDs of the six kinds of one cert-manager release,
// TEST_CERT_MANAGER_VERSION or the one the types follow, and a test object of
// each kind, without the controller. The session disconnects the kind cluster,
// sets up the CRDs, connects the cluster again, so that the app reads the CRDs
// anew, and leaves the cluster disconnected; it does not depend on another test
// file having run.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  appReady,
  certManagerVersion,
  clickMenuItem,
  confirmDialog,
  connectApp,
  detailsItemValue,
  disconnectKindCluster,
  expectDetailsApiVersion,
  installExtension,
  openDetails,
  openKindCluster,
  openListPage,
  openRowMenu,
  setUpCluster,
  tearDownCluster,
  waitForCondition,
  waitForMenuItem,
} from "./extension-helpers";

import type { Frame } from "playwright";

import type { AppSession } from "./extension-helpers";

interface KindView {
  kind: string;
  /** The `id` of the kind's `clusterPages` registration. */
  pageId: string;
  apiVersion: string;
  /** An item that only the extension's details panel shows, not a printer column of the CRD. */
  detailsItem: string;
  /** Its value for the test object. */
  detailsValue: string;
  /** The extension's items in the row menu of the test object. */
  menuItems: string[];
}

const kindViews: KindView[] = [
  {
    kind: "Certificate",
    pageId: "cert-manager-certificates",
    apiVersion: "cert-manager.io/v1",
    detailsItem: "Secret Name",
    detailsValue: "test-tls",
    menuItems: ["Force Renew", "Delete (cascade)", "Edit YAML"],
  },
  {
    kind: "CertificateRequest",
    pageId: "cert-manager-certificate-requests",
    apiVersion: "cert-manager.io/v1",
    detailsItem: "Is CA",
    detailsValue: "No",
    menuItems: ["Approve", "Deny", "Edit YAML"],
  },
  {
    kind: "Issuer",
    pageId: "cert-manager-issuers",
    apiVersion: "cert-manager.io/v1",
    detailsItem: "Type",
    detailsValue: "SelfSigned",
    menuItems: ["Edit YAML"],
  },
  {
    kind: "ClusterIssuer",
    pageId: "cert-manager-cluster-issuers",
    apiVersion: "cert-manager.io/v1",
    detailsItem: "Type",
    detailsValue: "SelfSigned",
    menuItems: ["Edit YAML"],
  },
  {
    kind: "Order",
    pageId: "cert-manager-orders",
    apiVersion: "acme.cert-manager.io/v1",
    detailsItem: "DNS Names",
    detailsValue: "test.example.com",
    menuItems: ["Delete (stuck)", "Edit YAML"],
  },
  {
    kind: "Challenge",
    pageId: "cert-manager-challenges",
    apiVersion: "acme.cert-manager.io/v1",
    detailsItem: "Type",
    detailsValue: "HTTP-01",
    menuItems: ["Delete (stuck)", "Edit YAML"],
  },
];

describe.skipIf(!(await appReady({ cluster: true })))(
  `cert-manager views with cert-manager ${certManagerVersion}`,
  () => {
    let session: AppSession | undefined;
    let frame: Frame;

    beforeAll(
      async () => {
        session = await connectApp();
        await disconnectKindCluster(session);
        setUpCluster();
        await installExtension(session);
        frame = await openKindCluster(session);
      },
      10 * 60 * 1000,
    );

    afterAll(
      async () => {
        let errors: string[] = [];

        try {
          // The errors first: the app refreshes the cluster while it disconnects,
          // and logs errors of its own when the refresh loses the race.
          errors = (await session?.stopCollecting()) ?? [];

          // The cluster then: the app watches the CRDs, and would log errors for
          // CRDs deleted under it.
          if (session) {
            await disconnectKindCluster(session);
          }

          await session?.close();
        } finally {
          tearDownCluster();
        }

        expect(errors).toEqual([]);
      },
      10 * 60 * 1000,
    );

    it.each(kindViews)("lists the $kind test object", async ({ pageId }) => {
      await openListPage(frame, pageId);
    });

    it.each(kindViews)(
      "shows the details of the $kind test object",
      async ({ pageId, apiVersion, detailsItem, detailsValue }) => {
        const row = await openListPage(frame, pageId);

        await openDetails(frame, row, detailsItem);
        await expectDetailsApiVersion(frame, apiVersion);

        expect(await detailsItemValue(frame, detailsItem).textContent()).toBe(detailsValue);
      },
    );

    it.each(kindViews)("shows the extension's menu items for the $kind test object", async ({ pageId, menuItems }) => {
      const row = await openListPage(frame, pageId);
      const menu = await openRowMenu(frame, row);

      for (const title of menuItems) {
        await waitForMenuItem(menu, title);
      }

      await frame.locator("body").press("Escape");
    });

    it("asks for a new issuance of the Certificate, after asking", async () => {
      const row = await openListPage(frame, "cert-manager-certificates");
      const menu = await openRowMenu(frame, row);

      await clickMenuItem(frame, menu, "Force Renew");
      await confirmDialog(frame, "Force Renew");
      await waitForCondition("certificate", "test", "Issuing");
    });

    it("approves the CertificateRequest, after asking", async () => {
      const row = await openListPage(frame, "cert-manager-certificate-requests");
      const menu = await openRowMenu(frame, row);

      await clickMenuItem(frame, menu, "Approve");
      await confirmDialog(frame, "Approve");
      await waitForCondition("certificaterequest", "test", "Approved");
    });

    it("denies the other CertificateRequest, after asking", async () => {
      const row = await openListPage(frame, "cert-manager-certificate-requests", "test-deny");
      const menu = await openRowMenu(frame, row);

      await clickMenuItem(frame, menu, "Deny");
      await confirmDialog(frame, "Deny");
      await waitForCondition("certificaterequest", "test-deny", "Denied");
    });
  },
);
