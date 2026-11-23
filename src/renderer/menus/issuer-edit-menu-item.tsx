/**
 * Author: Maifee Ul Asad <maifeeulasad@gmail.com>
 * Co-Author: Claude Sonnet 4.6 <noreply@anthropic.com>
 */

import { Issuer, type IssuerStore } from "../../common/api";
import { ResourceEditYamlMenuItem } from "./resource-edit-yaml-menu-item";

import type { Common, Renderer } from "@freelensapp/extensions";

type Props = Common.Types.KubeObjectMenuItemProps<Issuer>;

export function IssuerEditMenuItem({ object, toolbar }: Props) {
  const api = (Issuer.getStore() as IssuerStore).api as unknown as Renderer.K8sApi.KubeApi<Renderer.K8sApi.KubeObject>;
  return <ResourceEditYamlMenuItem object={object} api={api} toolbar={toolbar} />;
}
