#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import degit from "degit";
import chalk from "chalk";
import ora from "ora";

// Available templates
const TEMPLATES = {
  "Next.js + TypeScript": "nakamaio/iota-example-with-next",
  "Next.js + TypeScript + Tailwind + Shadcn":
    "nakamaio/iota-example-with-next-shadcn",
  "Next.js + TypeScript + Chakra UI": "nakamaio/iota-example-with-next-chakra",
  "Vite + React + TypeScript": "nakamaio/iota-example-with-vite-react",
};

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

      const spinner = ora("Creating your project...").start();

      // Clone the repository
      const emitter = degit(TEMPLATES[template], {
        cache: false,
        force: true,
        verbose: true,
      });

      await emitter.clone(projectDirectory);

      spinner.succeed(
        chalk.green(`Project created successfully in ${projectDirectory}!`)
      );

      console.log("\nNext steps:");
      console.log(chalk.cyan(`  cd ${projectDirectory}`));
      console.log(chalk.cyan("  npm install"));
      console.log(chalk.cyan("  npm run dev"));
    } catch (error) {
      console.error(chalk.red("Error creating project:"), error);
      process.exit(1);
    }
  });

program.parse();
