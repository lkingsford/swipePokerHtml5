import fs = require('fs')
import os = require('os')
import http = require('http')

let uri: string = "" 
let temp_location: string = "/tmp/butler.zip"

switch (os.type())
{
    case "Linux":
        uri = "https://broth.itch.ovh/butler/windows-amd64/LATEST/archive/default";
        break;
    case "Darwin":
        uri = "https://broth.itch.ovh/butler/darwin-amd64/LATEST/archive/default";
        break;
    case "Windows":
        uri = "https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default";
        break;
}


/* $uri = 
new-item -itemtype Directory -Force tmp
invoke-webrequest -uri $uri -OutFile tmp/butler.zip
expand-archive -path tmp\butler.zip -DestinationPath .\utils -Force
remove-item tmp -Force -Recurse */
