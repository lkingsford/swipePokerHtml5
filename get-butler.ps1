$uri = "https://broth.itch.ovh/butler/windows-amd64/LATEST/archive/default"
new-item -itemtype Directory -Force tmp
invoke-webrequest -uri $uri -OutFile tmp/butler.zip
expand-archive -path tmp\butler.zip -DestinationPath .\utils -Force
remove-item tmp -Force -Recurse