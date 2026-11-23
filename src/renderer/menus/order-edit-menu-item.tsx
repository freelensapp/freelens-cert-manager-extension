/**
 * Author: Maifee Ul Asad <maifeeulasad@gmail.com>
 * Co-Author: Claude Sonnet 4.6 <noreply@anthropic.com>
 */

import { Order, type OrderStore } from "../../common/api";
import { ResourceEditYamlMenuItem } from "./resource-edit-yaml-menu-item";

import type { Common, Renderer } from "@freelensapp/extensions";

type Props = Common.Types.KubeObjectMenuItemProps<Order>;

export function OrderEditMenuItem({ object, toolbar }: Props) {
  const api = (Order.getStore() as OrderStore).api as unknown as Renderer.K8sApi.KubeApi<Renderer.K8sApi.KubeObject>;
  return <ResourceEditYamlMenuItem object={object} api={api} toolbar={toolbar} />;
}
