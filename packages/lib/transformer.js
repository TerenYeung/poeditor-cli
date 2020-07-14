function toUpstreamFormat(content, config) {
  let modifiedContent = '';
  let {type} = config;

  if (type === 'android_strings') {
    modifiedContent = toUpnstreamAndroidFormat(content);
  } else if (type === 'apple_strings') {
    modifiedContent = toUpstreamAppleFormat(content, {
      to: '%@'
    });
  } else if (type === 'json') {
    modifiedContent = JSON.stringify(content);
  }

  return modifiedContent;
}

function toDownstreamFormat(content, config) {
  let modifiedContent = '';
  let {type} = config;

  if (type === 'android_strings') {
    modifiedContent = toDownstreamAndroidFormat(content);
  } else if (type === 'apple_strings') {
    modifiedContent = toDownstreamAppleFormat(content, {
      to: '%@'
    });
  } else if (type === 'key_value_json') {
    modifiedContent = JSON.stringify(content);
  } else if (type === 'json') {
    modifiedContent = JSON.stringify(content);
  } else if (type === 'js') {
    modifiedContent = toDownstreamJSFormat(content);
  } else {
    modifiedContent = content;
  }

  return modifiedContent;
}

function toDownstreamAndroidFormat(content) {
    // 按 <string> 标签进行分组，
    // 识别每一行的 <string> 标签，然后将当前匹配行中的 {xxx} 占位替换为 %n$s
  const lineReg = /\n</g
  let modifiedContent = '';
  let ret = content.split(lineReg);

  ret = ret.map(item => {
    const reg = /\{\w+\}/g;
    const matched = item.match(reg);

    if (matched) {
      matched && matched.forEach((str, index) => {
        item = item.replace(/\{\w+\}/, () => `%${index+1}$s`);
      });
    }

    // 将文本的引号去除
    const reg2 = />\".*\"</g;
    const matched2 = item.match(reg2);

    if (matched2) {
      item = item.replace(matched2[0], (str) => {
        return `>${str.slice(2, str.length - 2)}<`
      })
    }

    return item;
  });
  return ret.join('\n<');
}

// 将 apple_strings.strings 文件中原始的 "app_login_name" = "{name} world" 转换为 "app_login_name" = "%@ world"
function toDownstreamAppleFormat(content, config) {
  let ret = '';
  const reg = /\{\w+\}/g;
  ret = content.replace(reg, (match, p1, offset, string) => {
    return config.to;
  });

  return ret;
}

function toDownstreamJSFormat(content) {
  let modifiedContent = '';
  let formatContent = '';

  for (let item of content) {
    formatContent += `\t// ${item.comment}\n`;
    formatContent += `\t${ "\'" + item.term + "\'"}: ${item.definition ? "\'"+ item.definition + "\'" : "\'\'"}, \n`;
  }

  let jsStr = `
export default {
  ${formatContent}
}`
  return jsStr;
}

const transformer = {
  toDownstreamFormat,
  toUpstreamFormat,
}

module.exports = transformer;