/**
 * Author: Maifee Ul Asad <maifeeulasad@gmail.com>
 * Co-Author: Claude Sonnet 4.6 <noreply@anthropic.com>
 */

import { ClusterIssuer, type ClusterIssuerStore } from "../../common/api";
import { ResourceEditYamlMenuItem } from "./resource-edit-yaml-menu-item";

import type { Common, Renderer } from "@freelensapp/extensions";

type Props = Common.Types.KubeObjectMenuItemProps<ClusterIssuer>;

export function ClusterIssuerEditMenuItem({ object, toolbar }: Props) {
  const api = (ClusterIssuer.getStore() as ClusterIssuerStore)
    .api as unknown as Renderer.K8sApi.KubeApi<Renderer.K8sApi.KubeObject>;
  return <ResourceEditYamlMenuItem object={object} api={api} toolbar={toolbar} />;
}
