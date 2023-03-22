import { APIGatewayProxyEvent } from "aws-lambda";

export const makeLambdaEvent = (event: string, payload: any) => {
  return {
    headers: {
      "X-GitHub-Event": event,
    },
    body: JSON.stringify(payload),
  } as unknown as APIGatewayProxyEvent;
};
