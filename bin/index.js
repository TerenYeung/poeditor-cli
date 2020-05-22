#!/usr/bin/env node
const
  version = require('../package.json').version,
  chalk = require('chalk'),
  axios = require('axios'),
  program = require('commander'),
  ora = require('ora'),
  pull = require('../packages/commands/pull'),
  push = require('../packages/commands/push');

program
  .version(version, '-v, --version')
  .description('POEditor cli is the Standard Tooling for POEditor workflow');

program
  .command('pull')
  .description('pull translation file(s) from upstream')
  .option('-c, --configuration <type>', 'configuration file', 'poeditor-config.json')
  .action(({configuration}) => {
    pull(configuration);
  });

program
  .command('push')
  .description('create new page')
  .action(() => {
    push();
  });

program.parse(process.argv);

