// tslint:disable:no-implicit-dependencies
import chalk from "chalk";
import { asyncExec, exit } from "async-shelljs";
import { IServerlessConfig, IDictionary } from "common-types";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { parseArgv } from "./lib/util";
import { buildServerlessConfig } from "./lib/serverless";
import { getAwsCredentials } from "./lib/secrets";
import { IServerlessCustomConfig } from "../serverless-config/config-sections";

let _serverlessConfig: IServerlessConfig = null;
function serverlessConfig(): IServerlessConfig<IServerlessCustomConfig> {
  if (!_serverlessConfig) {
    _serverlessConfig = yaml.safeLoad(
      fs.readFileSync("./serverless.yml", {
        encoding: "utf-8"
      })
    ) as IServerlessConfig;
  }

  return _serverlessConfig;
}

function findFunctions(input: string[]): string[] {
  const fns: string[] = [];
  const functions = new Set(Object.keys(serverlessConfig().functions));
  input.map(i => {
    if (functions.has(i)) {
      fns.push(i);
    }
  });
  return fns;
}

function findSteps(input: string[]): string[] {
  const steps: string[] = [];
  const stepFunctions = new Set(
    Object.keys(
      serverlessConfig().stepFunctions
        ? serverlessConfig().stepFunctions.stateMachines
        : []
    )
  );

  input.map(i => {
    if (stepFunctions.has(i)) {
      steps.push(i);
    }
  });
  return steps;
}

async function build(fns?: string[]) {
  try {
    await asyncExec(`ts-node scripts/build.ts --color=true ${fns}}`);
  } catch (e) {
    console.error(chalk.red("- 🤯 build failed, deployment stopped"));
    process.exit();
  }
  console.log(chalk.green("- Build step completed successfully 🚀"));

  return;
}

async function deploy(stage: string, profile?: string, fns: string[] = []) {
  const awsProfile = profile ? `--aws-profile ${profile}` : ``;

  try {
    if (fns.length === 0) {
      console.log(
        chalk.yellow(`- starting full serverless deployment to ${chalk.bold(stage)}`)
      );
      console.log(
        chalk.grey(
          `- sls deploy --aws-s3-accelerate  --stage ${stage} ${awsProfile} --verbose`
        )
      );
      await asyncExec(
        `sls deploy --aws-s3-accelerate  --stage ${stage} ${awsProfile} --verbose`
      );
      console.log(chalk.green.bold(`- successful serverless deployment 🚀`));
    } else {
      const functions: string[] = findFunctions(fns);
      const steps: string[] = findSteps(fns);

      if (functions.length > 0) {
        console.log(
          chalk.yellow(
            `- deployment of ${functions.length} serverless function(s) to ${chalk.bold(
              stage
            )}: ${functions.join(", ")}`
          )
        );
        const promises: any[] = [];
        functions.map(fn => {
          promises.push(
            asyncExec(
              `sls deploy function --force --aws-s3-accelerate --function ${fn} --stage ${stage} ${awsProfile}`
            )
          );
        });
        await Promise.all(promises);
      }
      if (steps.length > 0) {
        console.log(
          chalk.yellow(
            `- deployment of ${steps.length} serverless function(s): ${steps.join(
              ", "
            )} to ${chalk.bold(stage)} environment.`
          )
        );
        await asyncExec(
          `sls deploy --name ${fns.join(" --function ")} --stage ${stage} ${awsProfile}`
        );
      }
      console.log(chalk.green.bold(`- 🚀  successful serverless deployment `));
    }
  } catch (e) {
    console.log(chalk.red.bold(`- 💩  problem deploying!`));
  }
}

// MAIN

(async () => {
  const { params, options } = parseArgv()("--help", "--profile", "--key");
  const profile = options.profile ? getAwsCredentials(options.profile) : undefined;
  let sls: IServerlessConfig<IServerlessCustomConfig>;
  try {
    sls = await serverlessConfig();
  } catch (e) {
    await buildServerlessConfig();
    sls = await serverlessConfig();
  }
  const defaults = {
    serviceName: typeof sls.service === "string" ? sls.service : sls.service.name,
    accountId: sls.custom.accountId || "999888777666",
    region:
      profile && profile.region ? profile.region : sls.provider.region || "us-east-1",
    profile: sls.provider.profile,
    provider: sls.provider.name
  };
  await buildServerlessConfig(defaults);

  const stage = options.prod ? "prod" : sls.provider.stage || "dev";
  console.log(`- deploying to the ${chalk.green.bold(stage)} env`);

  await deploy(stage, params);
})();
