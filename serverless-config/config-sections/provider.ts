import { IServerlessIAMRole, IServerlessProvider } from "common-types";
import { IServerlessAccountInfo } from "./types";

export const provider = (
  config: IServerlessAccountInfo
): { provider: IServerlessProvider } => ({
  provider: {
    name: "aws",
    runtime: "nodejs8.10",
    profile: config.profile,
    stage: "prod",
    region: config.region,
    environment: "${file(serverless-config/env.yml):${self:custom.stage}}",
    ...iamRoleStatements(config)
  }
});

function iamRoleStatements(
  config: IServerlessAccountInfo
): { iamRoleStatements: IServerlessIAMRole[] } {
  const iam = [
    ssmPermissions(config),
    xRayPermissions(config),
    stepFunctions(config)
  ].filter(i => i !== false);

  return { iamRoleStatements: iam as IServerlessIAMRole[] };
}

function ssmPermissions(config: IServerlessAccountInfo): IServerlessIAMRole | false {
  return {
    Effect: "Allow",
    Action: ["ssm:GetParameter", "ssm:GetParametersByPath"],
    Resource: [`arn:aws:ssm:${config.region}*`]
  };
}

function xRayPermissions(config: IServerlessAccountInfo): IServerlessIAMRole | false {
  return {
    Effect: "Allow",
    Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
    Resource: ["*"]
  };
}

function stepFunctions(config: IServerlessAccountInfo): IServerlessIAMRole | false {
  return {
    Effect: "Allow",
    Action: [
      "states:ListStateMachines",
      "states:CreateActivity",
      "states:StartExecution",
      "states:ListExecutions",
      "states:DescribeExecution",
      "states:DescribeStateMachineForExecution",
      "states:GetExecutionHistory"
    ],
    Resource: [
      `arn:aws:states:${config.region}:${config.accountId}:stateMachine:*`,
      `arn:aws:states:${config.region}:${config.accountId}:execution:*:*`
    ]
  };
}
