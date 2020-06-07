import fs = require('fs')
import os = require('os')
import path = require('path')
import urllib = require('urllib')
import AdmZip = require('adm-zip')

function main() {
    let uri: string = "";
    let zipFileStream: fs.WriteStream;

    if (!fs.existsSync("utils"))
    {
        fs.mkdirSync("utils");
    }

    switch (os.type()) {
        case "Linux":
            uri = "https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default";
            break;
        case "Darwin":
            uri = "https://broth.itch.ovh/butler/darwin-amd64/LATEST/archive/default";
            break;
        case "Windows_NT":
            uri = "https://broth.itch.ovh/butler/windows-amd64/LATEST/archive/default";
            break;
        default:
            console.warn("Unsupported OS for Butler - Publish to itch.io not available")
            return;
    }

    urllib.request(uri, {followRedirect: true}).then((result: urllib.HttpClientResponse<Buffer>) => {
        if (result.res.statusCode != 200)
        {
            console.error("Failed to download butler - Error %s", result.status)
            return;
        }
        let z = new AdmZip(result.data)
        z.extractAllTo('utils', true);
    } );
}

    /* $uri =
    new-item -itemtype Directory -Force tmp
    invoke-webrequest -uri $uri -OutFile tmp/butler.zip
    expand-archive -path tmp\butler.zip -DestinationPath .\utils -Force
    remove-item tmp -Force -Recurse */

main()