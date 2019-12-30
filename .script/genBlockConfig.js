const fs = require('fs');
const { join } = require('path');
const gitUrl = 'https://github.com/ilabservice/intelab-wfe-3.0';

const menuData = {
  usersetting: '个人设置',
};

const tagsKey = {
  usersetting: '个人设置',
};
/**
 * 从文件数组映射为 pro 的路由
 * @param {*} name
 */
const genBlockName = name =>
  name
    .match(/[A-Z]?[a-z]+|[0-9]+/g)
    .map(p => p.toLowerCase())
    .join('/');

/**
 * 从文件数组映射为 tags 列表
 * @param {*} name
 */
const genBlockTags = name =>
  Array.from(new Set(name.match(/[A-Z]?[a-z]+|[0-9]+/g).map(p => p.toLowerCase())))
    .map(key => tagsKey[key] || key)
    .filter(key => key !== 'remove');

const getFeature = filePath => {
  const feature = ['antd'];
  const srcPath = join(filePath, 'src');

  const localesPath = join(srcPath, 'locales');
  if (fs.existsSync(localesPath)) {
    feature.push('i18n');
  }

  const modalTsxPath = join(srcPath, 'model.tsx');
  const modalTsPath = join(srcPath, 'model.ts');
  const modalJsPath = join(srcPath, 'model.js');
  const modalJsxPath = join(srcPath, 'model.jsx');
  if (
    fs.existsSync(modalTsxPath) ||
    fs.existsSync(modalTsPath) ||
    fs.existsSync(modalJsPath) ||
    fs.existsSync(modalJsxPath)
  ) {
    feature.push('dva');
  }
  return feature;
};

/**
 * 遍历文件地址
 * @param path
 */
const getFolderTreeData = filePath => {
  const files = fs.readdirSync(filePath);
  const blockList = files
    .map(fileName => {
      const status = fs.statSync(join(filePath, fileName));
      if (status.isDirectory() && fileName.indexOf('.') !== 0 && fileName !== 'EmptyPage') {
        const absPkgPath = join(filePath, fileName, 'package.json');
        if (fs.existsSync(absPkgPath)) {
          const pkg = require(absPkgPath);

          return {
            name: menuData[genBlockName(fileName)],
            key: fileName,
            description: pkg.description,
            url: `${gitUrl}/tree/blocks/${fileName}`,
            path: fileName,
            features: getFeature(join(filePath, fileName)),
            img: `${gitUrl}/tree/blocks/${fileName}/snapshot.png?raw=true`,
            tags: genBlockTags(fileName),
            previewUrl: `${gitUrl}/tree/blocks/${fileName}`,
          };
        }
      }
      return undefined;
    })
    .filter(obj => obj);

  blockList.unshift({
    key: 'EmptyPage',
    name: '空白页面',
    description: '一个空白的页面，一切都从这里开始！',
    url: `${gitUrl}/tree/blocks`,
    path: 'NewPage',
    features: ['antd'],
    img:
      'https://raw.githubusercontent.com/ant-design/pro-blocks/master/EmptyPage/snapshot.png?raw=true',
    tags: ['空白页'],
    previewUrl: `${gitUrl}/tree/blocks`,
  });

  return blockList;
};

fs.writeFileSync(
  join(__dirname, '..', 'umi-block.json'),
  JSON.stringify({ list: getFolderTreeData(join(__dirname, '../')) }, null, 2),
);
