# @freelensapp/cert-manager-extension

<!-- markdownlint-disable MD013 -->

[![Home](https://img.shields.io/badge/%F0%9F%8F%A0-freelens.app-02a7a0)](https://freelens.app)
[![GitHub](https://img.shields.io/github/stars/freelensapp/freelens-cert-manager-extension?style=flat&label=GitHub%20%E2%AD%90)](https://github.com/freelensapp/freelens-cert-manager-extension)
[![Release](https://img.shields.io/github/v/release/freelensapp/freelens-cert-manager-extension?display_name=tag&sort=semver)](https://github.com/freelensapp/freelens-cert-manager-extension/releases)
[![Integration tests](https://github.com/freelensapp/freelens-cert-manager-extension/actions/workflows/integration-tests.yaml/badge.svg?branch=main)](https://github.com/freelensapp/freelens-cert-manager-extension/actions/workflows/integration-tests.yaml)
[![npm](https://img.shields.io/npm/v/@freelensapp/cert-manager-extension.svg)](https://www.npmjs.com/package/@freelensapp/cert-manager-extension)

<!-- markdownlint-enable MD013 -->

## Overview

[Freelens](https://freelens.app) extension for
[cert-manager](https://cert-manager.io), the controller that issues and renews
TLS certificates in a Kubernetes cluster.

The extension lives in the cluster sidebar under **Cert Manager**:
**Certificates**, **Issuers**, **ClusterIssuers**, **CertificateRequests**,
**Orders** and **Challenges**. The Certificates page sums up the health of the
certificates and shows how much of its validity each one has left. The details
read the issued certificate from its Secret and link the objects of an issuance
to each other, and the menus ask for a new issuance, approve or deny a request,
delete what is stuck, and edit an object as YAML.

## Authors

- [Maifee Ul Asad](https://github.com/maifeeulasad) created this extension and
  maintains it.
- [Roberto Bandini](https://github.com/robertobandini) reviewed it and brought
  it into the organization, with its integration tests.

## Requirements

- Freelens 2.0.0 or a later 2.x (extension API v2).
- cert-manager 1.x, which serves `cert-manager.io/v1` and
  `acme.cert-manager.io/v1`. The extension is tested with cert-manager 1.21.

## Supported APIs

| Group                  | API Version | Kind                 | Shown in            |
| ---------------------- | ----------- | -------------------- | ------------------- |
| `cert-manager.io`      | v1          | `Certificate`        | Certificates        |
| `cert-manager.io`      | v1          | `CertificateRequest` | CertificateRequests |
| `cert-manager.io`      | v1          | `Issuer`             | Issuers             |
| `cert-manager.io`      | v1          | `ClusterIssuer`      | ClusterIssuers      |
| `acme.cert-manager.io` | v1          | `Order`              | Orders              |
| `acme.cert-manager.io` | v1          | `Challenge`          | Challenges          |

When the cluster does not serve a kind, its page says so. While the extension
is enabled, the six kinds are left out of the Custom Resources tree of the
cluster sidebar, so each of them is listed once, under Cert Manager.

## Permissions

The pages list and watch the six kinds. The details of a Certificate also read
the Secret it names, for the X.509 data, and list the Ingresses of its
namespace. Without those permissions the two sections stay empty, and the rest
of the panel works.

The actions below write to the cluster, and each needs its own permission:

| Action           | Permission                                                                             |
| ---------------- | -------------------------------------------------------------------------------------- |
| Create (+)       | `create` on the kind                                                                   |
| Edit YAML        | `update` on the kind                                                                   |
| Force Renew      | `update` on `certificates/status`                                                      |
| Approve, Deny    | `update` on `certificaterequests/status`, and `approve` on the `signers` of the issuer |
| Delete (cascade) | `delete` on `certificates` and `secrets`                                               |
| Delete (stuck)   | `delete` on `orders` or `challenges`                                                   |

## Install

Open Freelens and go to Extensions (`ctrl`+`shift`+`E` or
`cmd`+`shift`+`E`). The field at the top takes a package name, the URL of a
tarball, or the path to a tarball or a directory.

### From the registry

Enter `@freelensapp/cert-manager-extension` and press Install.

Alternatively, open the following URL in the browser to install directly:

[freelens://app/extensions/install/%40freelensapp%2Fcert-manager-extension](freelens://app/extensions/install/%40freelensapp%2Fcert-manager-extension)

### From a release tarball

Each
[release](https://github.com/freelensapp/freelens-cert-manager-extension/releases)
has the extension as `freelensapp-cert-manager-extension-<version>.tgz`, with
its checksum in `freelensapp-cert-manager-extension-<version>.tgz.sha256`. Use
a release whose major version matches your Freelens version.

- Enter the URL of the `.tgz` asset and press Install. Freelens downloads the
  `.tgz.sha256` next to it and checks the tarball against it.
- Or download both files into one directory and enter the path to the `.tgz`,
  or drop the `.tgz` on the Freelens window. Freelens checks it against the
  `.tgz.sha256` next to it.

### From a directory

Build the extension (see below), then enter the path to your checkout, the
directory with `package.json`, and press Install. Freelens runs the extension
from that directory, from the files in `dist/`, and lists it as unverified.
This is how you work on the extension: see
[Development loop](#development-loop).

## Getting started

The objects in `examples/cert-manager/` show the views on a cluster with
cert-manager installed:

```sh
kubectl apply -f examples/cert-manager/issuers.yaml
kubectl apply -f examples/cert-manager/certificates.yaml
kubectl apply -f examples/cert-manager/ingress.yaml
```

| File                | Objects                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `issuers.yaml`      | the ClusterIssuer `example-selfsigned`, the CA Certificate `example-ca` it signs, and the Issuer `example-ca`, which signs with that CA |
| `certificates.yaml` | `example-app`, valid for 90 days, and `example-expiring`, valid for 20 days, which the Certificates page counts as expiring             |
| `ingress.yaml`      | the Ingress `example-app`, which serves the Secret of `example-app` and routes nothing                                                  |

Open the cluster in Freelens and go to **Cert Manager**. The tiles above the
Certificates list count the three certificates, and the validity bar of
`example-expiring` is amber. The details of `example-app` show the X.509 data
of its Secret and the Ingress that uses it. Then open its menu and choose
**Force Renew**: cert-manager issues a new certificate, and a new request
appears under **CertificateRequests**.

These objects leave two things out. cert-manager creates Orders and Challenges
only for an ACME issuer, and it approves every CertificateRequest by itself
unless it was installed with `disableAutoApproval`, so Approve and Deny do not
show on these requests.

## Features

### Lists

- **Certificates**: Name, Namespace, Ready, Secret and Validity, a bar of the
  time left with the days in words. It is green from 30 days left, amber below
  that and red below 7. The tiles above the list count the certificates in
  total and those Ready, Not Ready, Expiring, with less than 30 days left, and
  Expired.
- **CertificateRequests**: Name, Namespace, Ready, Approved or Denied, and
  Issuer.
- **Issuers**: Name, Namespace, Ready and Type, one of ACME, CA, SelfSigned,
  Vault or Venafi.
- **ClusterIssuers**: Name, Ready and Type.
- **Orders**: Name, Namespace, State, Issuer and DNS Names.
- **Challenges**: Name, Namespace, State, Domain, Type and Issuer.

### Details

Each kind has a details panel in the drawer, next to what Freelens shows for
any custom resource: the printer columns of its CRD, its conditions and its
events.

- **Certificate**: Secret Name, Common Name, DNS Names, Issuer, Duration, Renew
  Before, a larger validity bar, Not Before, Not After, Renewal Time and the
  message of its Ready condition. **X.509 Details** reads `tls.crt` from the
  Secret and shows the Subject, Issuer DN, SANs, Serial Number, Key Algorithm
  and SHA-256 fingerprint. **Certificate Requests** links the requests it owns,
  and **Used by Ingresses** names the Ingresses of its namespace that serve its
  Secret.
- **CertificateRequest**: Issuer, Duration, Is CA, Usages, when it failed, the
  message of its Ready condition, and links to its Certificate and its Orders.
- **Issuer** and **ClusterIssuer**: Type and the message of the Ready condition.
- **Order**: State, Issuer, DNS Names, IP Addresses, Common Name, Duration, ACME
  URL, Reason, when it failed, Authorizations, and links to its
  CertificateRequest and its Challenges.
- **Challenge**: State, Domain, marked when it is a wildcard, Type, Issuer,
  Presented, Processing, Token, Authorization URL and Reason.

### Write actions

Every action on an existing object, except Edit YAML, asks first:

- **Force Renew**, on a Certificate, sets the `Issuing` condition of its status
  to `True` with the reason `ManuallyTriggered`, as `cmctl renew` does, and
  cert-manager issues a new certificate.
- **Approve** and **Deny**, on a CertificateRequest that is not decided yet, set
  the `Approved` or `Denied` condition of its status.
- **Delete (cascade)**, on a Certificate, deletes it and then the Secret it
  names.
- **Delete (stuck)**, on an Order that is not `valid` or `ready` or a Challenge
  that is not `valid`, deletes it, so that cert-manager tries again.
- **Edit YAML**, on all six kinds, opens the metadata and the spec of the object
  in an editor and saves them with an update.
- **Create**, the + button of a list: Certificates opens a wizard of two steps,
  the fields and then the YAML they make, which can still be edited.
  CertificateRequests, Issuers and ClusterIssuers open an editor with a
  template.

## Limits

- **The preference has no effect yet.** Preferences > Extensions > Cert Manager
  saves **Show expired certificates**, but the Certificates page does not read
  it, and always lists expired certificates.
- **Edit YAML needs a page of the extension.** Its editor lives on the six list
  pages. Chosen in a drawer opened from another page of Freelens, the item shows
  nothing, and the editor opens when you next reach one of those pages.
- **Related objects come from what is loaded.** The details of a Certificate, a
  CertificateRequest or an Order list the objects they own once the page of
  that kind has been opened in the session.
- **A page opened before the CRDs keeps its notice.** A list page that was open
  while cert-manager was being installed says that it is not installed until
  you leave the page and come back.

## Build from the source

### Prerequisites

Use [NVM](https://github.com/nvm-sh/nvm),
[mise-en-place](https://mise.jdx.dev/), or
[windows-nvm](https://github.com/coreybutler/nvm-windows) to install the
Node.js version in `.nvmrc`.

From the root of this repository:

```sh
nvm install
# or
mise install
# or
winget install CoreyButler.NVMforWindows
nvm install "$(cat .nvmrc)"
nvm use "$(cat .nvmrc)"
```

Install pnpm:

```sh
corepack install
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -
# or
winget install pnpm.pnpm
```

### Build extension

```sh
pnpm install
pnpm build
```

The extension is built into `dist/`. To pack it into a tarball:

```sh
pnpm pack
```

One script to bump the prerelease version, build and pack the extension for
testing:

```sh
pnpm pack:dev
```

The tarball is placed in the current directory. Install it as described in
[From a release tarball](#from-a-release-tarball).

### Development loop

Install the extension from your checkout once, as described in
[From a directory](#from-a-directory), then run:

```sh
pnpm dev
```

It rebuilds the extension whenever a source file changes, and Freelens
reloads the extension after each rebuild, without a restart and without
packing. Stop it with `ctrl`+`C`.

Neither `pnpm build` nor `pnpm dev` type-checks; run `pnpm type:check` for
that. A change to `main` or `renderer` in `package.json` needs Freelens
restarted once.

To check the extension in Freelens with an AI agent, see "Checking the
Extension in Freelens Dev" in [AGENTS.md](AGENTS.md).

### Check the code

```sh
pnpm type:check
pnpm test:unit
pnpm lint:check
pnpm knip:check
```

and, for the formats that Biome does not cover:

```sh
pnpm trunk:check
```

### Integration tests

The integration tests drive Freelens dev, started from a
[freelensapp/freelens](https://github.com/freelensapp/freelens) checkout,
against a [kind](https://kind.sigs.k8s.io/) cluster. In the Freelens checkout:

```sh
pnpm dev
```

Freelens dev lists no cluster until a kubeconfig is added in Preferences >
Kubernetes > Kubeconfig Syncs. Add one with the kind cluster, for example:

```sh
kubectl config view --minify --flatten --context kind-kind > ~/kind-kind.kubeconfig
```

Then, with the kind cluster running, in the extension repository:

```sh
pnpm build
pnpm test:integration
```

The tests install the checkout in place, replacing any other installation of
the extension in Freelens dev. They apply the CRDs of the six kinds from a
cert-manager release, without the controller, and delete them at the end, and
with them every cert-manager object on the cluster, so use a kind cluster with
nothing worth keeping. Without Freelens dev or the cluster the tests are
skipped.

Optional variables:

- `TEST_KIND_CLUSTER_NAME`: the kind cluster, `kind` by default, used
  through the context `kind-<name>`.
- `TEST_CERT_MANAGER_VERSION`: the cert-manager release of the CRDs, `v1.21.3`
  by default.
- `FREELENS_CDP_URL`: the CDP endpoint of Freelens dev,
  `http://127.0.0.1:9223` by default.
- `FREELENS_MAIN_LOG`: a log of the main process to check for errors, such
  as its `lens.log`. Without it only the renderer's errors are checked.

## Documentation

- [`docs/understanding-cert-manager.md`](docs/understanding-cert-manager.md):
  the `kubectl` and `cmctl` commands for cert-manager.
- [`docs/extension-development-guide.md`](docs/extension-development-guide.md):
  the Freelens v2 extension API, as this extension uses it.

## License

Copyright (c) 2026 Maifee Ul Asad.

[MIT License](LICENSE)
