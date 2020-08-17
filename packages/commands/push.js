const
  utils = require('../lib/utils'),
  chalk = require('chalk'),
  api = require('../lib/api'),
  querystring = require('querystring'),
  util = require('util'),
  fs = require('fs'),
  ora = require('ora'),
  globby = require('globby'),
  promiseSeries = require('promise.series'),
  child_process = require('child_process'),
  transformer = require('../lib/transformer'),
  path = require('path');

const cwd = process.cwd();
const fileTypeMap = {
  'apple_strings': 'strings',
  'android_strings': 'xml',
  'key_value_json': 'json'
}
let spinner = null;

function push() {
  const configUrl = path.resolve(cwd, 'poeditor-config.json');

  if (!utils.isExist(configUrl)) {
    console.log(chalk.red(`\n 😭  poeditor-config.json required ~~~\n`));
    process.exit(0);
  }

  const config = require(configUrl);
  const paths = globby.sync([config.targetDir]);

  spinner = ora(`${chalk.green(`Pushing file(s) to poeditor, approximately costs ${paths.length * 30}s`)}`).start();

  try {
    putTermFiles(config);
  } catch(err) {
    console.log(err)
  }
}

async function putTermFiles(config) {
  const targetDir = path.resolve(cwd, config.targetDir);
  const paths = await globby([targetDir]);
  const sleep = (func, timeout) => {
    return new Promise(async (resolve) => {
      setTimeout(() => {
        func && func();
        resolve();
      }, timeout);
    })
  };

  const promises = paths.map((url, index) => {
    return function() {
      let timeout = index * 30000 + 10;
      return sleep(async () => {
        // console.log('ext', path.parse(url).ext.);
        // console.log('type', fileTypeMap[config.fileType]);

        if (path.parse(url).ext.slice(1) !== fileTypeMap[config.fileType]) {
          console.log(chalk.red(`\n 😭  Incorrect fileType, ${fileTypeMap[config.fileType] || config.fileType} file required ~~~\n`));
          process.exit(0);
        }

        return await putTermFile({...config, file: url, language: path.parse(url).name});
      }, timeout);
    }
  })

  promiseSeries(promises).then((res) => {
    spinner.stop();
    console.log(`🥝  ${chalk.cyan(`All file(s) uploaded ~~~`)}`);
  }).catch(err => {
    console.log(chalk.red(`\n 😭  Error occurs at ${err} ~~~\n`));
  });
}

async function putTermFile(config) {
  // 需要为不同类型的翻译文件生成统一的上传占位符的临时文件再上传；

  let tempContent = fs.readFileSync(config.file).toString('utf8');
  let parseObj = path.parse(config.file);
  let tempUrl = `${parseObj.dir}/${parseObj.name}-temp${parseObj.ext}`;

  fs.writeFileSync(tempUrl, transformer.toUpstreamFormat(tempContent, {
    type: config.fileType
  }));
  console.log('template', tempContent)
  return

  const res = child_process.execSync(`
  curl -X POST https://api.poeditor.com/v2/projects/upload \
    -F api_token=${config.apiToken} \
    -F id=${config.projectId} \
    -F updating="terms_translations" \
    -F file=@"${tempUrl}" \
    -F language="${config.language}" \
    -F overwrite="1" -s`);

  // 删除临时文件
  fs.unlinkSync(curPath);

  return JSON.parse(res.toString());
}



module.exports = push;