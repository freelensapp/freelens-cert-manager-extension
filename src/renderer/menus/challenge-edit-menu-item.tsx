/**
 * Author: Maifee Ul Asad <maifeeulasad@gmail.com>
 * Co-Author: Claude Sonnet 4.6 <noreply@anthropic.com>
 */

import { Challenge, type ChallengeStore } from "../../common/api";
import { ResourceEditYamlMenuItem } from "./resource-edit-yaml-menu-item";

import type { Common, Renderer } from "@freelensapp/extensions";

type Props = Common.Types.KubeObjectMenuItemProps<Challenge>;

export function ChallengeEditMenuItem({ object, toolbar }: Props) {
  const api = (Challenge.getStore() as ChallengeStore)
    .api as unknown as Renderer.K8sApi.KubeApi<Renderer.K8sApi.KubeObject>;
  return <ResourceEditYamlMenuItem object={object} api={api} toolbar={toolbar} />;
}
