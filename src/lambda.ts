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
  const runnerGroupName = "nvidia-runners";
  logger("start");

  if (ghEvent === "installation" && payload.action === "created") {
    const resp = await authorizer({
      allowedOrgs: [
        "dask-contrib",
        "dask",
        "numba",
        "nv-gha-runners",
        "nv-legate",
        "nv-morpheus",
        "nvidia-merlin",
        "nvidia",
        "rapidsai",
      ],
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
