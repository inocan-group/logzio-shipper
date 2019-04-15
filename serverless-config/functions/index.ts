// tslint:disable:no-invalid-template-strings
import { IServerlessFunction, IDictionary } from "common-types";

export const logShipper: IServerlessFunction = {
  handler: "log-shipper.handler",
  description: "Lambda function to attach to Cloudwatch log streams; will ship logs to Logzio ELK stack.",
  memorySize: 256
}

export const cloudwatchRegistration: IServerlessFunction = {
  handler: "cloudwatch-subscribe.handler",
  description: "Subscribes each new lambda functions log stream to the log-shipper.",
  memorySize: 256
}

export const logRetention: IServerlessFunction = {
  handler: "log-retention.handler",
  description: "Changes the cloudwatch log retention policy to discrete timeframe to save on costs.",
  memorySize: 256
}

const functions: IDictionary<IServerlessFunction> = {
  logShipper,
  cloudwatchRegistration,
  logRetention
};

export default functions;
