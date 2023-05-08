import fs from 'fs';
import util from 'util';

const readFile = util.promisify(fs.readFile);

async function generateVersionNumFile() {
    const packageString = await readFile('./package.json', 'utf8');
    const packageObj = JSON.parse(packageString);
    const versionNum = packageObj?.version;
    if (versionNum == null) {
        console.log('versionNum is null');
        return;
    }

    const fileContent = `export const currentVersion = '${versionNum}';`;
    fs.writeFile(`./src/version.ts`, fileContent, ['utf8'], () => { });
}

generateVersionNumFile();