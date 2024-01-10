/*
 * Copyright (c) 2023, NVIDIA CORPORATION.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * List of organizations that are allowed to install the `nvidia-runners` GitHub application.
 * The organization names are not case sensitive.
 */

import { authorizer } from "webhook-authorizer";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { retry } from "@octokit/plugin-retry";
import allowedOrgs from "./orgs";

const makeLogger = (obj: any) => (msg: string) => {
  console.log(
    JSON.stringify({ "@msg": msg, "@app": "nvidia-runners", ...obj })
  );
};

const makeOctokit = (payload: any) => {
  const installationId = payload.installation.id;
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("No private key found in environment");
  }

  const MyOctokit = Octokit.plugin(retry);
  return new MyOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId: payload.installation.app_id,
      privateKey: Buffer.from(privateKey, "base64").toString(),
      installationId,
    },
    log: console,
  });
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const payload = JSON.parse(event.body as string);
  const ghEvent = event.headers["X-GitHub-Event"] as string;
  const lambdaEvent = { "@gh_event": ghEvent, ...payload };
  const logger = makeLogger(lambdaEvent);
  const runnerGroupName = "nvidia-runners";
  logger("start");

  if (ghEvent === "installation" && payload.action === "created") {
    const resp = await authorizer({
      allowedOrgs,
      event,
    });

    if (!resp.isAuthorized) {
      return {
        statusCode: resp.httpCode,
        body: resp.msg,
      };
    }

    const octokit = makeOctokit(payload);
    logger("creating runner group");

    await octokit.request("POST /orgs/{org}/actions/runner-groups", {
      org: payload.installation.account.login,
      name: runnerGroupName,
      visibility: "selected",
      allows_public_repositories: true,
    });

    return {
      body: `New installation detected. '${runnerGroupName}' group created.`,
      statusCode: 200,
    };
  }

  return {
    body: "No further processing necessary for this webhook type.",
    statusCode: 200,
  };
};
