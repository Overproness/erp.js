const { basename, extname } = require('path');
const { globSync } = require('glob');
const fs = require('fs');

const appModelsFiles = globSync('./src/models/appModels/**/*.js');
const pattern = './src/models/**/*.js';

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
  const indexFilePath = `${controllerFolderPath}/index.js`;

  // ✅ Check if the controller *folder* and its index.js exist
  if (fs.existsSync(indexFilePath)) {
    constrollersList.push(controllerName);
    appModelsList.push(modelName);
    entityList.push(entity);
    routesList.push({
      entity: entity,
      modelName: modelName,
      controllerName: controllerName,
    });
  } else {
    console.warn(`[WARN] Skipping ${controllerName} — index.js not found at ${indexFilePath}`);
  }
}

module.exports = { constrollersList, appModelsList, modelsFiles, entityList, routesList };
