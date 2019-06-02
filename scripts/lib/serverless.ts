// tslint:disable:no-implicit-dependencies
import {
  IServerlessConfig,
  IDictionary,
  IServerlessFunction,
  IStepFunction
} from "common-types";
import chalk from "chalk";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { SLS_CONFIG_DIRECTORY, STATIC_DEPENDENCIES_FILE } from "..";
import * as inquirer from "inquirer";

export interface IServerlessCliOptions {
  required?: boolean;
  singular?: boolean;
  quiet?: boolean;
}
import serverlessConfig from "../../serverless-config/config";
import { IServerlessAccountInfo } from "../../serverless-config/config-sections/types";

export async function buildServerlessConfig(defaults: IDictionary = { quiet: false }) {
  const accountInfo: IServerlessAccountInfo = await getAccountInfo(defaults);
  const config = serverlessConfig(accountInfo);
  console.log(`- Serverless configuration has been configured`);
  const yamlString = yaml.safeDump(config);
  console.log("yaml:\n", yamlString);

  fs.writeFileSync(`${process.env.PWD}/serverless.yml`, yamlString);
  console.log(`- Serverless config saved to "serverless.yml"`);
}

async function getAccountInfo(defaults: IDictionary): Promise<IServerlessAccountInfo> {
  const pkgJson = JSON.parse(
    fs.readFileSync(`${process.env.PWD}/package.json`, { encoding: "utf-8" })
  );

  const questions = [
    {
      type: "input",
      name: "serviceName",
      message: "what is the service name which your functions will be prefixed with",
      default: pkgJson.name
    },
    {
      type: "input",
      name: "profile",
      message: "choose a profile from your AWS credentials file",
      default: defaults.profile || "your-profile"
    },
    {
      type: "list",
      name: "provider",
      message: "which cloud provider are you using",
      default: defaults.provider || "aws",
      choices: ["aws", "google", "azure"]
    },
    {
      type: "input",
      name: "accountId",
      message: "what is the Amazon Account ID which you are deploying to?",
      default: defaults.accountId
    },
    {
      type: "list",
      name: "region",
      message: "what is the region you will be deploying to?",
      choices: [
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-north-1",
        "eu-central-1",
        "sa-east-1",
        "ca-central-1",
        "ap-south-1",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-northeast-3",
        "ap-southeast-1",
        "ap-southeast-2"
      ],
      default: defaults.region
    }
  ];
  const answers: IDictionary = await inquirer.prompt(questions);
  return {
    name: answers.serviceName,
    accountId: answers.accountId,
    region: answers.region,
    profile: answers.profile
  };
}

export async function serverless(
  where: keyof IServerlessConfig,
  name: string,
  options: IServerlessCliOptions = { required: false, singular: false }
) {
  const existsAsIndex = fs.existsSync(`${SLS_CONFIG_DIRECTORY}/${where}/index.ts`);
  const existsAsFile = fs.existsSync(`${SLS_CONFIG_DIRECTORY}/${where}.ts`);
  const exists = existsAsIndex || existsAsFile;

  if (exists) {
    let configSection: IDictionary = require(`${SLS_CONFIG_DIRECTORY}/${where}`).default;
    if (!configSection) {
      console.log(
        `- The ${where} configuration does not export anything on default so skipping`
      );
      return;
    }
    const serverlessConfig: IServerlessConfig = yaml.safeLoad(
      fs.readFileSync(`${process.env.PWD}/serverless.yml`, {
        encoding: "utf-8"
      })
    ) as IServerlessConfig;

    const isList = Array.isArray(configSection);
    const isDefined: boolean = Object.keys(configSection).length > 0 ? true : false;

    if (!isDefined && options.required) {
      console.log(
        chalk.magenta(
          `- Warning: there exist ${name} configuration at "${SLS_CONFIG_DIRECTORY}/${where} but its export is empty!`
        )
      );

      if ((Object.keys(serverlessConfig[where]).length as any) === 0) {
        console.log(
          chalk.red(`- the serverless.yml file also has no ${name} definitions!`)
        );
      } else {
        console.log(
          chalk.grey(
            `- Note: serverless.yml will continue to use the definitions for ${name} that previously existed in the file [ ${
              Object.keys(serverlessConfig[where] as IDictionary).length
            } ]`
          )
        );
        configSection = serverlessConfig[where] as IDictionary;
      }
    }
    if (Object.keys(configSection).length > 0) {
      serverlessConfig[where] = configSection;

      if (!options.quiet) {
        console.log(
          chalk.yellow(
            `- Injected ${
              options.singular ? "" : Object.keys(configSection).length + " "
            }${name} into serverless.yml`
          )
        );
      }
    } else {
      if (!options.quiet) {
        console.log(chalk.grey(`- Nothing to add in section "${name}"`));
      }
      delete serverlessConfig[where];
    }
    fs.writeFileSync(`${process.env.PWD}/serverless.yml`, yaml.dump(serverlessConfig));
  } else {
    console.error(
      chalk.grey(
        `- No ${name} found in ${SLS_CONFIG_DIRECTORY}/${where}/index.ts so ignoring`
      )
    );
  }
}

/** tests whether the running function is running withing Lambda */
export function isLambda() {
  return !!((process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) || false);
}

export async function includeStaticDependencies() {
  let staticDeps;
  try {
    staticDeps = yaml.safeLoad(
      fs.readFileSync(STATIC_DEPENDENCIES_FILE, { encoding: "utf-8" })
    );
  } catch (e) {
    // ignore
  }

  if (staticDeps) {
    console.log(`- Adding static dependencies to list of inclusions/exclusions`);

    const config: IServerlessConfig = yaml.safeLoad(
      fs.readFileSync(`${process.env.PWD}/serverless.yml`, { encoding: "utf-8" })
    );
    if (staticDeps.include && Array.isArray(staticDeps.include)) {
      config.package.include = [...config.package.include, ...staticDeps.include];
    }
    if (staticDeps.exclude && Array.isArray(staticDeps.exclude)) {
      config.package.exclude = [...config.package.exclude, ...staticDeps.exclude];
    }

    fs.writeFileSync(`${process.env.PWD}/serverless.yml`, yaml.dump(config), {
      encoding: "utf-8"
    });
  }
}

export async function getFunctions() {
  return getSomething<IDictionary<IServerlessFunction>>("functions");
}

export async function getStepFunctions() {
  return getSomething<IDictionary<IStepFunction>>("stepFunctions");
}

async function getSomething<T = any>(something: string) {
  const file = fs.existsSync(`${SLS_CONFIG_DIRECTORY}/${something}.ts`)
    ? `${SLS_CONFIG_DIRECTORY}/${something}.ts`
    : `${SLS_CONFIG_DIRECTORY}/${something}/index.ts`;

  const defExport = await import(file);

  return defExport.default as T;
}
