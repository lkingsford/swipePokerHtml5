import os = require('os');
import path = require('path');
const exec = require('child_process').exec;

//./utils/butler.exe push dist_prod nerdygentleman/itch-test:game

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

exec(butlerPath + " push dist_prod " + channel, (err: any, stdout: any, stderr: any) => {
    if (err) {
        console.log(`error: ${err.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
})