/* eslint-disable import/no-extraneous-dependencies */
import path from "path";
import { green, yellow } from "picocolors";
import { tryGitInit } from "./helpers/git";
import { isFolderEmpty } from "./helpers/is-folder-empty";
import { getOnline } from "./helpers/is-online";
import { isWriteable } from "./helpers/is-writeable";
import { makeDir } from "./helpers/make-dir";

import fs from "fs";
import terminalLink from "terminal-link";
import type { InstallTemplateArgs, TemplateObservability } from "./helpers";
import { installTemplate } from "./helpers";
import { writeDevcontainer } from "./helpers/devcontainer";
import { templatesDir } from "./helpers/dir";
import { toolsRequireConfig } from "./helpers/tools";

export type InstallAppArgs = Omit<
  InstallTemplateArgs,
  "appName" | "root" | "isOnline" | "customApiPath"
> & {
  appPath: string;
  frontend: boolean;
};

export async function createApp({
  template,
  framework,
  ui,
  appPath,
  packageManager,
  frontend,
  modelConfig,
  llamaCloudKey,
  communityProjectConfig,
  llamapack,
  vectorDb,
  externalPort,
  postInstallAction,
  dataSources,
  tools,
  useLlamaParse,
  observability,
  agents,
}: InstallAppArgs): Promise<void> {
  const root = path.resolve(appPath);

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      "The application path is not writable, please check folder permissions and try again.",
    );
    console.error(
      "It is likely you do not have write permissions for this folder.",
    );
    process.exit(1);
  }

  const appName = path.basename(root);

  await makeDir(root);
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const useYarn = packageManager === "yarn";
  const isOnline = !useYarn || (await getOnline());

  console.log(`Creating a new LlamaIndex app in ${green(root)}.`);
  console.log();

  const args = {
    appName,
    root,
    template,
    framework,
    ui,
    packageManager,
    isOnline,
    modelConfig,
    llamaCloudKey,
    communityProjectConfig,
    llamapack,
    vectorDb,
    externalPort,
    postInstallAction,
    dataSources,
    tools,
    useLlamaParse,
    observability,
    agents,
  };

  if (frontend) {
    // install backend
    const backendRoot = path.join(root, "backend");
    await makeDir(backendRoot);
    await installTemplate({ ...args, root: backendRoot, backend: true });
    // install frontend
    const frontendRoot = path.join(root, "frontend");
    await makeDir(frontendRoot);
    await installTemplate({
      ...args,
      root: frontendRoot,
      framework: "nextjs",
      customApiPath: `http://localhost:${externalPort ?? 8000}/api/chat`,
      backend: false,
    });
    // copy readme for fullstack
    await fs.promises.copyFile(
      path.join(templatesDir, "README-fullstack.md"),
      path.join(root, "README.md"),
    );
  } else {
    await installTemplate({ ...args, backend: true });
  }

  await writeDevcontainer(root, templatesDir, framework, frontend);

  process.chdir(root);
  if (tryGitInit(root)) {
    console.log("Initialized a git repository.");
    console.log();
  }

  if (toolsRequireConfig(tools)) {
    const configFile =
      framework === "fastapi" ? "config/tools.yaml" : "config/tools.json";
    console.log(
      yellow(
        `You have selected tools that require configuration. Please configure them in the ${terminalLink(
          configFile,
          `file://${root}/${configFile}`,
        )} file.`,
      ),
    );
  }
  console.log("");
  console.log(`${green("Success!")} Created ${appName} at ${appPath}`);

  console.log(
    `Now have a look at the ${terminalLink(
      "README.md",
      `file://${root}/README.md`,
    )} and learn how to get started.`,
  );

  outputObservability(args.observability);

  if (
    dataSources.some((dataSource) => dataSource.type === "file") &&
    process.platform === "linux"
  ) {
    console.log(
      yellow(
        `You can add your own data files to ${terminalLink(
          "data",
          `file://${root}/data`,
        )} folder manually.`,
      ),
    );
  }

  console.log();
}

function outputObservability(observability?: TemplateObservability) {
  switch (observability) {
    case "traceloop":
      console.log(
        `\n${yellow("Observability")}: Visit the ${terminalLink(
          "documentation",
          "https://traceloop.com/docs/openllmetry/integrations",
        )} to set up the environment variables and start seeing execution traces.`,
      );
      break;
    case "llamatrace":
      console.log(
        `\n${yellow("Observability")}: LlamaTrace has been configured for your project. Visit the ${terminalLink(
          "LlamaTrace dashboard",
          "https://llamatrace.com/login",
        )} to view your traces and monitor your application.`,
      );
      break;
  }
}
