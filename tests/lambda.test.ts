// manually hoist "mock*" vars due to ts-jest bug
const mockRequest = jest.fn().mockName("request");
const mockAuthorizer = jest
  .fn(async () => ({
    httpCode: 200,
    msg: "Success",
    isAuthorized: true,
  }))
  .mockName("authorizer");

import { handler } from "../src/lambda";
import { makeResponse } from "./responses/get_runner_groups";
import { makeInstallationEvent } from "./webhooks/installation";

jest.mock("@octokit/rest", () => ({
  Octokit: {
    plugin: () => () => ({
      request: mockRequest,
    }),
  },
}));

jest.mock("webhook-authorizer", () => {
  return {
    authorizer: mockAuthorizer,
  };
});

describe("default", () => {
  const env = process.env;

  beforeEach(() => {
    mockRequest.mockClear();
    mockAuthorizer.mockClear();
    jest.resetModules();
    process.env = { ...env, PRIVATE_KEY: "1234" };
  });

  afterEach(() => {
    process.env = env;
  });

  test("missing PRIVATE_KEY", async () => {
    delete process.env.PRIVATE_KEY;
    const fnThrow = async () =>
      await handler(makeInstallationEvent({ action: "created" }));

    expect(fnThrow).rejects.toThrow("No private key found in environment");
    expect(mockRequest).not.toHaveBeenCalled();
  });

  test("installation created | success", async () => {
    mockRequest.mockResolvedValueOnce("created successfully");
    const result = await handler(
      makeInstallationEvent({
        action: "created",
      })
    );

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest.mock.calls[0][1]).toStrictEqual({
      org: "rapidsai",
      name: "rapids-runners",
      visibility: "selected",
      allows_public_repositories: true,
    });
    expect(result).toStrictEqual({
      body: "New installation detected. 'rapids-runners' group created.",
      statusCode: 200,
    });
  });

  test("installation created | disallowed org", async () => {
    mockAuthorizer.mockResolvedValueOnce({
      httpCode: 200,
      msg: "Organization is not authorized to use this application. Installation deleted.",
      isAuthorized: false,
    });

    const result = await handler(
      makeInstallationEvent({
        action: "created",
        orgName: "randomorg",
      })
    );

    expect(mockRequest).toHaveBeenCalledTimes(0);
    expect(result).toStrictEqual({
      body: "Organization is not authorized to use this application. Installation deleted.",
      statusCode: 200,
    });
  });

  test("installation deleted | runner group not found", async () => {
    mockRequest.mockResolvedValueOnce(makeResponse("random-group"));
    const result = await handler(
      makeInstallationEvent({
        action: "deleted",
      })
    );

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({
      body: "App was deleted but no runner group named 'rapids-runners' was found to delete.",
      statusCode: 200,
    });
  });

  test("installation deleted | runner group found", async () => {
    mockRequest.mockResolvedValueOnce(makeResponse("rapids-runners"));
    const result = await handler(
      makeInstallationEvent({
        action: "deleted",
      })
    );

    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(result).toStrictEqual({
      body: "App and 'rapids-runners' runner group were deleted.",
      statusCode: 200,
    });
  });

  test("installation updated (invalid action)", async () => {
    const result = await handler(
      makeInstallationEvent({
        action: "updated",
      })
    );

    expect(mockRequest).toHaveBeenCalledTimes(0);
    expect(result).toStrictEqual({
      body: "Catch-all. No further processing necessary for this webhook type.",
      statusCode: 200,
    });
  });

  test("unprocessed event type", async () => {
    let event = makeInstallationEvent({
      action: "updated",
    });
    event.headers["X-GitHub-Event"] = "issue_comment";
    const result = await handler(event);

    expect(mockRequest).toHaveBeenCalledTimes(0);
    expect(result).toStrictEqual({
      body: "Only installation webhook events are processed",
      statusCode: 200,
    });
  });
});
