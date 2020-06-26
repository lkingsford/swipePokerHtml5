import os = require('os');
import path = require('path');
const exec = require('child_process').exec;
let pkgjson = require('../package.json')

let channel: string = process.argv[2]

if (os.type() != "Darwin" && os.type() != "Windows_NT" && os.type() != "Linux") {
    throw new Error("Not supported OS")
}

let butlerPath = path.join("utils", "butler")
if (os.type() === "Windows_NT") {
    butlerPath += ".exe"
}
else
{
    butlerPath = "./" + butlerPath
}

let source: string = "dist_prod";

switch(channel) {
    case "win":
        source = `dist-desktop/${pkgjson.name}-${pkgjson.version}-win.zip`
    case "linux":
        source = `dist-desktop/${pkgjson.name}-${pkgjson.version}.AppImage`
    case "mac":
        source = `dist-desktop/${pkgjson.name}-${pkgjson.version}.dmg`

}

let outChannel: string = "nerdygentleman/swipe-poker:" + channel;

exec(`${butlerPath} push ${source} ${outChannel}`, {shell: true}, (err: any, stdout: any, stderr: any) => {
    if (err) {
        console.log(`error: ${err.message}`);
        console.log(`stderr: ${stderr}`);
        console.log(`stdout: ${stdout}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
})
