import { IAwsHandlerFunction, IDictionary } from "common-types";
import { logger } from "aws-log";

export const handler: IAwsHandlerFunction<IDictionary> = async function handler(
  event,
  context,
  cb
) {
  const log = logger().lambda(event, context);
  log.info("The cloudwatch subscription policy is NOT implemented yet", {
    event,
    context
  });
  cb(null, { statusCode: 200 });
};
