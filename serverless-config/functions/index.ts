// tslint:disable:no-invalid-template-strings
import { IServerlessFunction, IDictionary } from "common-types";

export const logzioShipper: IServerlessFunction = {
  handler: "src/logzio-shipper.handler",
  description:
    "Lambda function to attach to Cloudwatch log streams; will ship logs to Logzio ELK stack.",
  memorySize: 256
};

const functions: IDictionary<IServerlessFunction> = {
  logzioShipper
};

export default functions;
