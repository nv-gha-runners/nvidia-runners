import { authorizer } from "webhook-authorizer";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { retry } from "@octokit/plugin-retry";

const makeLogger = (obj: any) => (msg: string) => {
  console.log(
    JSON.stringify({ "@msg": msg, "@app": "rapids-runners", ...obj })
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
  const runnerGroupName = "rapids-runners";
  logger("start");

  if (ghEvent !== "installation") {
    return {
      body: "Only installation webhook events are processed",
      statusCode: 200,
    };
  }

  const octokit = makeOctokit(payload);

  if (payload.action === "created") {
    const resp = await authorizer({
      allowedOrgs: ["rapidsai", "nv-morpheus", "nvidia", "nv-legate"],
      event,
    });

    if (!resp.isAuthorized) {
      return {
        statusCode: resp.httpCode,
        body: resp.msg,
      };
    }
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

  if (payload.action === "deleted") {
    logger("deleting runner group");

    const { data: response } = await octokit.request(
      "GET /orgs/{org}/actions/runner-groups",
      {
        org: payload.installation.account.login,
        per_page: 100,
      }
    );

    const runnerGroups = response.runner_groups;

    const rapidsRunnerGroup = runnerGroups.find(
      (grp) => grp.name === runnerGroupName
    );

    if (!rapidsRunnerGroup) {
      return {
        body: `App was deleted but no runner group named '${runnerGroupName}' was found to delete.`,
        statusCode: 200,
      };
    }

    await octokit.request(
      "DELETE /orgs/{org}/actions/runner-groups/{group_id}",
      {
        org: payload.installation.account.login,
        group_id: rapidsRunnerGroup.id,
      }
    );

    return {
      body: `App and '${runnerGroupName}' runner group were deleted.`,
      statusCode: 200,
    };
  }

  return {
    body: "Catch-all. No further processing necessary for this webhook type.",
    statusCode: 200,
  };
};
