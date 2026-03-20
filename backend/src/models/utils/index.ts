// @ts-nocheck
const { basename, extname } = require('path');
const { globSync } = require('glob');
const fs = require('fs');

const appModelsFiles = globSync('./src/models/appModels/**/*.{js,ts}');
const pattern = './src/models/**/*.{js,ts}';

const modelsFiles = globSync(pattern).map((filePath) => {
  const fileNameWithExtension = basename(filePath);
  const fileNameWithoutExtension = fileNameWithExtension.replace(
    extname(fileNameWithExtension),
    ''
  );
  return fileNameWithoutExtension;
});

const constrollersList = [];
const appModelsList = [];
const entityList = [];
const routesList = [];

for (const filePath of appModelsFiles) {
  const fileNameWithExtension = basename(filePath);
  const fileNameWithoutExtension = fileNameWithExtension.replace(
    extname(fileNameWithExtension),
    ''
  );

  const firstChar = fileNameWithoutExtension.charAt(0);
  const modelName = fileNameWithoutExtension.replace(firstChar, firstChar.toUpperCase());
  const fileNameLowerCaseFirstChar = fileNameWithoutExtension.replace(
    firstChar,
    firstChar.toLowerCase()
  );
  const entity = fileNameWithoutExtension.toLowerCase();

  const controllerName = fileNameLowerCaseFirstChar + 'Controller';
  const controllerFolderPath = `./src/controllers/appControllers/${controllerName}`;
  const indexFilePath_ts = `${controllerFolderPath}/index.ts`;
  const indexFilePath_js = `${controllerFolderPath}/index.js`;
  const singleFilePath_ts = `./src/controllers/appControllers/${controllerName}.ts`;
  const singleFilePath_js = `./src/controllers/appControllers/${controllerName}.js`;

  // ✅ Check if the controller exists as either a folder/index or a single file
  const controllerExists =
    fs.existsSync(indexFilePath_ts) ||
    fs.existsSync(indexFilePath_js) ||
    fs.existsSync(singleFilePath_ts) ||
    fs.existsSync(singleFilePath_js);

  if (controllerExists) {
    constrollersList.push(controllerName);
    appModelsList.push(modelName);
    entityList.push(entity);
    routesList.push({
      entity: entity,
      modelName: modelName,
      controllerName: controllerName,
    });
  }
}

module.exports = { constrollersList, appModelsList, modelsFiles, entityList, routesList };
