import { IServerlessConfig } from "common-types";
import { packaging, custom, plugins, provider, service } from "./config-sections";
import { IServerlessAccountInfo } from "./config-sections/types";
import functions from "./functions";
import stateMachines from "./stepFunctions";

export default (accountInfo: IServerlessAccountInfo): IServerlessConfig => {
  return {
    ...service(accountInfo),
    ...packaging(accountInfo),
    ...custom(accountInfo),
    ...plugins(accountInfo),
    ...provider(accountInfo),
    ...{ functions },
    ...{ stateMachines }
  };
};
