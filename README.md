# ---th0enix Build---
* Update dependencies
* Remove background, splash, icons
* Added extended request timeout & video preload disable (MartB)
* Right key opens Menu in TV-State (Special non-colorbutton remotes)

# webos-tvheadend
* This is a WebOS Client for TVHeadend
* It can currently only be installed using the Developer App or Homebrew
* The design is similiar to the famous Media Center Kodi
* It is tested on WebOS 3,4 and 5
* It uses react but most components use the canvas 2d api to improve performance on older TVs

## Setup
![Setup](screenshots/setup_verification.png?raw=true "Setup Verification")
## Channel list
![Channel List](screenshots/channellist.png?raw=true "Channel List")
## Channel list with details
![Channel List Details](screenshots/channellist_details.png?raw=true "Channel List Details")
## EPG
![EPG](screenshots/epg.png?raw=true "EPG")
## Current Channel info
![Infobar](screenshots/infobar.png?raw=true "Infobar")
## Menu
![Menü](screenshots/menu.png?raw=true "Menü")

## Build
Normal build without webos running
* TVGuides.js:getNow() needs to return 1607462851000 as mock timestamp for now
* TVHDataService:constructor() needs to use MockServiceAdapter instead of LunaServiceAdapter
```s
npm run start
```
* Device Setup
```s
name      deviceinfo                    connection  profile
--------  ----------------------------  ----------  -------
emulator  developer@127.0.0.1:6622      ssh         tv
tv        prisoner@192.168.178.22:9922  ssh         tv
```

Deployment to emulator/webos
```s
npm run webos:emu
npm run webos:tv

# for debugging attach to device
ares-inspect -d emulator com.willinux.tvh.app --open
ares-inspect -d tv com.willinux.tvh.app --open
```
## Features
- EPG
- Channel List
- Record live tv or plan recordings using EPG
- Play and Manage recordings
- User Authentication: basic and digest (md5, sha256)

## WebOS
Useful links for video playback using webos

* http://webostv.developer.lge.com/develop/app-developer-guide/resuming-media-quickly-mediaoption/
* http://webostv.developer.lge.com/api/web-api/mediaoption-parameter/

## tvheadend

#### API documentation
https://github.com/dave-p/TVH-API-docs/wiki
