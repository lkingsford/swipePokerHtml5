import fs = require('fs')
import { sys } = require('sys')

/* $uri = 
new-item -itemtype Directory -Force tmp
invoke-webrequest -uri $uri -OutFile tmp/butler.zip
expand-archive -path tmp\butler.zip -DestinationPath .\utils -Force
remove-item tmp -Force -Recurse */

const uri: string = "https://broth.itch.ovh/butler/windows-amd64/LATEST/archive/default"

