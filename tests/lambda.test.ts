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
      name: "nvidia-runners",
      visibility: "selected",
      allows_public_repositories: true,
    });
    expect(result).toStrictEqual({
      body: "New installation detected. 'nvidia-runners' group created.",
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

  test("unprocessed event", async () => {
    let event = makeInstallationEvent({
      action: "created",
    });
    event.headers["X-GitHub-Event"] = "issue_comment";
    const result = await handler(event);

    expect(mockRequest).toHaveBeenCalledTimes(0);
    expect(result).toStrictEqual({
      body: "No further processing necessary for this webhook type.",
      statusCode: 200,
    });
  });
});
