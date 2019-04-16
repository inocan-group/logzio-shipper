import {
  IDictionary,
  ICloudWatchEvent,
  IAwsHandlerFunction,
  getBodyFromPossibleLambdaProxyRequest
} from "common-types";
import { promisify } from "util";
import { gunzip } from "zlib";
import axios from "axios";
import * as parse from "./log-shipper/parser";
const gunzipAsync = promisify<Buffer, Buffer>(gunzip);

enum LOGZIO_PORTS {
  BULK_HTTP = 8070,
  BULK_HTTPS = 8071,
  TCP = 5050, // this would have been slightly more efficient but swallowed error msgs (probably my fault)
  TCP_CERT = 5052
}

const PORT: number = LOGZIO_PORTS.BULK_HTTPS;
const HOST: string = process.env.LOG_HOST || "https://listener.logz.io";
const TOKEN: string = process.env.LOG_TOKEN;
const ENDPOINT: string = `${HOST}:${PORT}?token=${TOKEN}`;

if (!TOKEN) {
  throw new Error(
    `No TOKEN for Logz.io was found as ENV variable "LOG_TOKEN"; please set and retry.`
  );
}

/**
 * handler
 *
 * The serverless function's handler (aka, starting point of execution)
 *
 * @param event the cloudwatch event fired contains 1:M events that need to be processed
 * @param context AWS Lambda context object
 * @param callback AWS Lambda callback object
 */
export const handler: IAwsHandlerFunction<IDictionary> = async function handler(
  event,
  context,
  callback
) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    // const request = getBodyFromPossibleLambdaProxyRequest(event);
    // console.log(request);

    const payload = new Buffer((event as IDictionary).awslogs.data, "base64");
    const json = (await gunzipAsync(payload)).toString("utf-8");
    const logEvents: ICloudWatchEvent = JSON.parse(json);
    await processAll(logEvents);

    const message: string = `Successfully processed ${
      logEvents.logEvents.length
    } log events.`;
    console.log(message);
    callback(null, {
      message
    });
  } catch (e) {
    console.log("ERROR:", e.message);
    callback(e);
  }
};

function determineStageFromLogGroup(logGroup: string) {
  let lookIn = logGroup.replace("/aws/lambda/", "").split("-");
  return lookIn.slice(-2)[0];
}

function remapProperty(hash: IDictionary, current: string, to: string) {
  const output: IDictionary = { ...{}, ...hash };
  output[to] = hash[current];
  delete output[current];
  return output;
}

async function processAll(event: ICloudWatchEvent) {
  let lambdaVersion = parse.lambdaVersion(event.logStream);
  let functionName = parse.functionName(event.logGroup);

  console.log(
    `Shipping ${event.logEvents.length} events from "${functionName}" to ${HOST}:${PORT}`
  );
  const logEntries: string[] = [];

  event.logEvents.map(logEvent => {
    try {
      let log: any = parse.logMessage(logEvent);

      if (log) {
        log.logStream = event.logStream;
        log.logGroup = event.logGroup;
        log.lambdaFunction = functionName;
        log.lambdaVersion = lambdaVersion;
        if (log["@message"] && !log.message) {
          log = remapProperty(log, "@message", "message");
        }
        if (log.context && log.context.memoryLimitInMB) {
          log.memSize = Number(log.context.memoryLimitInMB);
          delete log.context.memoryLimitInMB;
        }
        log.type = "JSON";
        if (!log["@stage"]) {
          log["@stage"] = determineStageFromLogGroup(event.logGroup);
        }

        logEntries.push(JSON.stringify(log).replace(/\n/g, ""));
      } else {
        console.log("returned nothing");
      }
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  });
  console.log(logEntries.join("\n"));

  const results = await axios.post(ENDPOINT, logEntries.join("\n"));
  console.log(`SHIPPING RESULT: ${results.statusText}/${results.status}`);
}
