#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import degit from "degit";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Available templates
const TEMPLATES = {
  "Next.js + TypeScript": "nakamaio/iota-example-with-next",
  "Next.js + TypeScript + Tailwind + Shadcn":
    "nakamaio/iota-example-with-next-shadcn",
  "Next.js + TypeScript + Chakra UI": "nakamaio/iota-example-with-next-chakra",
  "Vite + React + TypeScript": "nakamaio/iota-example-with-vite-react",
};

// Timeout duration in milliseconds (30 seconds)
const CLONE_TIMEOUT = 30000;

async function cloneWithTimeout(emitter, projectDirectory) {
  return Promise.race([
    emitter.clone(projectDirectory),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("TIMEOUT"));
      }, CLONE_TIMEOUT);
    }),
  ]);
}

program
  .name("create-iota-app")
  .description("Create a new IOTA application from a template")
  .argument("[project-directory]", "Directory to create the project in")
  .action(async (projectDirectory) => {
    try {
      // If no directory is provided, ask for one
      if (!projectDirectory) {
        const response = await inquirer.prompt([
          {
            type: "input",
            name: "projectDirectory",
            message: "What is the name of your project?",
            default: "my-iota-app",
          },
        ]);
        projectDirectory = response.projectDirectory;
      }

      // Select template
      const { template } = await inquirer.prompt([
        {
          type: "list",
          name: "template",
          message: "Which template would you like to use?",
          choices: Object.keys(TEMPLATES),
        },
      ]);

      const spinner = ora("Preparing to download template...").start();

      try {
        // Clone the repository
        const emitter = degit(TEMPLATES[template], {
          cache: false,
          force: true,
          verbose: true,
        });

        // Add event listeners for better feedback
        emitter.on("info", (info) => {
          spinner.text = `${info.message}`;
        });

        emitter.on("warn", (warning) => {
          spinner.warn(chalk.yellow(warning.message));
          spinner.start();
        });

        spinner.text = "Downloading template...";

        await cloneWithTimeout(emitter, projectDirectory);

        spinner.succeed(
          chalk.green(`Project created successfully in ${projectDirectory}!`)
        );

        console.log("\nNext steps:");
        console.log(chalk.cyan(`  cd ${projectDirectory}`));
        console.log(chalk.cyan("  npm install"));
        console.log(chalk.cyan("  npm run dev"));
      } catch (cloneError) {
        spinner.fail(chalk.red("Failed to create project"));

        if (cloneError.message === "TIMEOUT") {
          console.error(
            chalk.red("\nTemplate download timed out after 30 seconds.")
          );
          console.error(chalk.yellow("\nPossible reasons:"));
          console.error(
            chalk.yellow("1. The template repository might be private")
          );
          console.error(chalk.yellow("2. Network connection issues"));
          console.error(chalk.yellow("3. GitHub rate limiting"));
          console.error(
            chalk.yellow(
              "\nPlease try again later or check if the repository is accessible:"
            )
          );
          console.error(
            chalk.blue(`https://github.com/${TEMPLATES[template]}`)
          );
        } else {
          console.error(chalk.red("\nError details:"));
          console.error(chalk.red(cloneError.message));

          if (cloneError.message.includes("404")) {
            console.error(
              chalk.yellow(
                "\nThe template repository could not be found. It might be private or deleted."
              )
            );
          } else if (cloneError.message.includes("git checkout")) {
            console.error(
              chalk.yellow(
                "\nError accessing the repository. Please check if it's private."
              )
            );
          } else if (cloneError.message.includes("rate limit")) {
            console.error(
              chalk.yellow(
                "\nGitHub API rate limit exceeded. Please try again later."
              )
            );
          }
        }

        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error);
      process.exit(1);
    }
  });

program.parse();
