import { IServerlessAccountInfo } from "./types";
import { IDictionary } from "common-types";

export const custom = (config: IServerlessAccountInfo): IServerlessCustomConfig => ({
  custom: {
    stage: "${opt:stage, self:provider.stage}",
    region: "${opt:region, self:provider.region}",
    accountId: config.accountId,
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: {
        forceExclude: ["aws-sdk", "firemock", "faker"]
      },
      packager: "yarn"
    }
  } as IServerlessCustomConfig
});

export interface IServerlessCustomConfig extends IDictionary {
  stage?: string;
  region?: string;
  accountId?: string;
  webpack?: any;
}
