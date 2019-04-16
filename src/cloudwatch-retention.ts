import { IAwsHandlerFunction, IDictionary } from "common-types";
import { logger } from "aws-log";
// export async function logGroupName {
//   let params = {
//     logGroupName    : logGroupName,
//     retentionInDays : retentionDays
//   };

//   await cloudWatchLogs.putRetentionPolicyAsync(params);
// };

// export async function (event, context: IAWSLambaContext, callback: AWS) {
//   console.log(JSON.stringify(event));

//   let logGroupName = event.detail.requestParameters.logGroupName;
//   console.log(`log group: ${logGroupName}`);

//   await setExpiry(logGroupName);
//   console.log(`updated [${logGroupName}]'s retention policy to ${retentionDays} days`);

//   callback(null, 'ok');
// });

export const handler: IAwsHandlerFunction<IDictionary> = async function handler(
  event,
  context,
  cb
) {
  const log = logger().lambda(event, context);
  log.info("The cloudwatch retention policy is NOT implemented yet", {
    event,
    context
  });
  cb(null, { statusCode: 200 });
};
