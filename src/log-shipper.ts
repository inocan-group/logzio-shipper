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
const ENDPOINT: string = `https://${HOST}:${PORT}?token=${TOKEN}`;

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
    const request = getBodyFromPossibleLambdaProxyRequest(event);
    const payload = new Buffer(request.awslogs.data, "base64");
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
    callback(e);
  }
};

async function processAll(event: ICloudWatchEvent) {
  let lambdaVersion = parse.lambdaVersion(event.logStream);
  let functionName = parse.functionName(event.logGroup);

  console.log(`Shipper PORT: ${PORT}, HOST: ${HOST}`);
  const logEntries: string[] = [];
  console.log(`There are ${event.logEvents.length} events to ship`);

  event.logEvents.map(logEvent => {
    try {
      let log: any = parse.logMessage(logEvent);

      if (log) {
        log.logStream = event.logStream;
        log.logGroup = event.logGroup;
        log.lambdaFunction = functionName;
        log.lambdaVersion = lambdaVersion;
        log.fields = log.fields || {};
        log["@x-correlation-id"] = log.fields["x-correlation-id"];
        log["@fn"] = log.fields["fn"];
        log["@region"] = log.fields.awsRegion;
        log["@stage"] = log.fields.stage;
        log.fnMemory = Number(log.fields["functionMemorySize"]);
        log.fnVersion = log.fields["functionVersion"];
        log.requestId = log.fields["requestId"];
        log.kind = log.fields["kind"] || log.kind;
        log.type = "JSON";
        log.token = TOKEN;

        // remove duplication for root itmes
        delete log.fields.stage;
        delete log.fields["x-correlation-id"];
        delete log.fields["functionMemorySize"];
        delete log.fields["functionVersion"];
        delete log.fields["region"];
        delete log.fields["requestId"];
        delete log.fields["kind"];
        delete log.fields["fn"];
        delete log.fields["awsRegion"];
        delete log.fields["functionName"];

        logEntries.push(JSON.stringify(log).replace(/\n/g, ""));
      }
    } catch (err) {
      console.error(err.message);
      throw err;
    }
  });
  console.log(`Log Payload [ ${ENDPOINT} ]:`, logEntries.join(""));
  const results = await axios.post(ENDPOINT, logEntries.join("\n"));
  console.log("SHIPPING RESULT", results);
}
