import { IServerlessPackage } from "common-types";
import { IServerlessAccountInfo } from "./types";

export const packaging: (
  config: IServerlessAccountInfo
) => { package: IServerlessPackage } = config => ({
  package: {
    individually: true,
    excludeDevDependencies: false,
    browser: false
  }
});
