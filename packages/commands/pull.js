const
  utils = require('../lib/utils'),
  chalk = require('chalk'),
  axios = require('axios'),
  api = require('../lib/api'),
  querystring = require('querystring'),
  util = require('util'),
  fs = require('fs'),
  ora = require('ora'),
  transformer = require('../lib/transformer'),
  path = require('path');

const cwd = process.cwd();
const fileTypeMap = {
  'apple_strings': 'strings',
  'android_strings': 'xml',
}
let spinner = null;

function pull() {
  const configUrl = path.resolve(cwd, 'poeditor-config.json');

  if (!utils.isExist(configUrl)) {
    console.log(chalk.red(`\n 😭  poeditor-config.json required ~~~\n`));
    process.exit(0);
  }

  const config = require(configUrl);
  // console.log(config);

  spinner = ora(`${chalk.green(`Pulling file(s) from poeditor`)}`).start();
  try {
    getTermFiles(config);
  } catch(err) {
    console.log(err);
  }
}

async function getTermFiles(config) {
  const {data: {result: {languages}}} = await getLanguages(config);
  const targetDir = path.resolve(cwd, config.targetDir);

  if (!utils.isExist(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  const promises = languages.map(async (lang) => {
    const payload = {
      api_token: config.apiToken,
      id: config.projectId,
      language: lang.code,
      type: config.fileType,
    };
    const res = await api.post('/projects/export', querystring.stringify(payload));
    // console.log('res', res);
    const {data: {result: {url}}} = await api.post('/projects/export', querystring.stringify(payload));
    // return
    const content = (await api.get(url)).data;
    // console.log('content', content)
    // @todo
    const modifiedContent = transformer.toDownstreamFormat(content, {
      type: config.fileType
    });

    return {
      ...config,
      language: lang.code,
      content: modifiedContent,
    };
  });

  const files = await Promise.all(promises);
  writeFiles(files);
  console.log(`🥝  ${chalk.cyan(`All file(s) downloaded ~~~`)}`);
}

async function getLanguages(config) {
  const payload = {
    api_token: config.apiToken,
    id: config.projectId,
  };

  return await api.post('/languages/list', querystring.stringify(payload));
}

function writeFiles(files) {
  files.forEach(file => {
    let suffix = file.fileType;

    const fileTypes = ['apple_strings', 'android_strings'];
    if (fileTypes.includes(file.fileType)) {
      suffix = fileTypeMap[file.fileType];
    }

    const filePath = path.resolve(cwd, `${file.targetDir}`, `${file.language}.${suffix}`);
    fs.writeFileSync(filePath, file.content);
  });
  spinner.stop();
}

module.exports = pull;