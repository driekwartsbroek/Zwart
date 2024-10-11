# Description

Wrapper around [qBittorrent's API](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation) to manage your torrents from Node. Documented and everything.

# Installation

`npm i qbittorrent-api`

# Overview

* [Connect to host](#connect)
* [Add a torrent](#add)
* [List torrents](#list)
* [Global info](#glinfo)
* [Torrent info](#info)
* [Global commands](#glcom)
* [Torrent commands](#com)
* [File commands](#fcom)

# Documentation

<a name="connect"></a>

## Connect to host

#### connect(host, [username], [password])

__Arguments__
* `host`
* `username` *optional*
* `password` *optional*

__Returns__

Interface object to call methods on.

__Example__
```js
var api = require("qbittorrent-api");

var qbt = api.connect("http://localhost:8080", "admin", "DELETETHIS");
qbt.version(function (error, data) {
  console.log(data);
});
```

# Methods

<a name="add"></a>

## Add a torrent

#### add(torrent, [savePath], [label], [callback])

__Arguments__
* `torrent` - Path or URL to torrent file, Readable stream, or magnet link.
* `savePath` *optional*
* `label` *optional*
* `callback` *optional*
  * `error`

__Example__
```js
qbt.add("magnet:?xt=urn:btih:PRFPQ2Z6XYO2SB3Z5N6A3RKW4KSJA62E");

qbt.add("http://torrents.linuxmint.com/torrents/linuxmint-17.3-cinnamon-64bit.iso.torrent", "D:\\Files", "software");

var stream = fs.createReadStream("~/torrents/2.Girls.1.Cup.torrent");
qbt.add(stream, "~/files/Tax Returns");

watcher.on("add", function (filePath) {
  qbt.add(filePath, function (error) {
    console.log("New torrent: " + filePath);
  });
});
```

#### setCookie(host, value)

__Arguments__
* `host`
* `value`

__Example__
```js
qbt.setCookie("www.website.com", "ui=28979218048197");
qbt.add("http://www.website.com/torrentname.torrent");
```

<a name="list"></a>

## List torrents

#### all([label], [options], callback)
#### downloading([label], [options], callback)
#### seeding([label], [options], callback)
#### completed([label], [options], callback)
#### resumed([label], [options], callback)
#### paused([label], [options], callback)
#### active([label], [options], callback)
#### inactive([label], [options], callback)
#### queued([label], [options], callback)
#### errored([label], [options], callback)

__Arguments__
* `label` *optional* - Filter by label
* `options` *optional* - Additional options
  * `sort`
  * `reverse`
  * `limit`
  * `offset`
* `callback`
  * `error`
  * `items`
 
__Example__
```js
qbt.all("Movies", { sort: "size", reverse: true }, function (error, items) {
  items.forEach(function (item) {
    console.log(item["name"] + ": " + item["size"]);
  });
});

qbt.paused(function (error, items) {
  qbt.resume(items);
});
```

#### search(searchText, [options], callback)

__Arguments__
* `searchText`
* `options` *optional* - Search options
  * `filter`
  * `label`
  * `sort`
  * `reverse`
  * `limit`
  * `offset`
* `callback`
  * `error`
  * `items`
 
__Example__
```js
qbt.search("donkey", {
  filter: "completed",
  label: "Video"
}, function (error, items) {
  qbt.deleteData(items);
});
```

<a name="glinfo"></a>

## Get global info

#### version(callback)
#### api(callback)
#### apiMin(callback)
#### transferInfo(callback)
#### preferences(callback)
#### getGlobalDlLimit(callback)
#### getGlobalUpLimit(callback)
#### alternativeSpeedLimitsEnabled(callback)

__Arguments__
* `callback`
  * `error`
  * `data`
 
__Example__
```js
qbt.transferInfo(function (error, data) {
  console.log(data["connection_status"]);
});
```

<a name="info"></a>

## Get torrent info

#### details(torrent, callback)
#### trackers(torrent, callback)
#### webseeds(torrent, callback)
#### files(torrent, callback)
#### getDlLimit(torrent, callback)
#### getUpLimit(torrent, callback)

__Arguments__
* `torrent` - Torrent object or hash string
* `callback`
  * `error`
  * `data`
 
__Example__
```js
qbt.active(function (error, items) {
  items.forEach(function (item) {
    qbt.details(item, function (error, data) {
      console.log(item["name"] + ": " + data["up_speed_avg"]);
    });
  });
});
```

<a name="glcom"></a>

## Global commands

#### pauseAll([callback])
#### resumeAll([callback])
#### toggleAlternativeSpeedLimits([callback])
__Arguments__
* `callback` *optional*
  * `error`

#### setGlobalDlLimit(value, [callback])
#### setGlobalUpLimit(value, [callback])
__Arguments__
* `value`
* `callback` *optional*
  * `error`

#### setPreferences(values, [callback])
__Arguments__
* `values` - Object of key-value pairs ([list of keys](https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation#get-qbittorrent-preferences))
* `callback` *optional*
  * `error`
 
__Example__
```js
qbt.setPreferences({ save_path: "D:\\New" }, function (error) {
  qbt.preferences(function (error, values) {
    console.log(values["save_path"]);
  });
});
```

<a name="com"></a>

## Torrent commands

#### pause(torrents, [callback])
#### resume(torrents, [callback])
#### recheck(torrents, [callback])
#### delete(torrents, [callback])
#### deleteData(torrents, [callback])
#### increasePrio(torrents, [callback])
#### decreasePrio(torrents, [callback])
#### topPrio(torrents, [callback])
#### bottomPrio(torrents, [callback])
#### toggleSeqDl(torrents, [callback])
#### toggleFirstLastPiecePrio(torrents, [callback])

__Arguments__
* `torrents` - One or more torrent objects or hash strings
* `callback` *optional*
  * `error`

__Example__
```js
qbt.errored(function (error, items) {
  qbt.recheck(items);
});
```

#### setDlLimit(torrents, value, [callback])
#### setUpLimit(torrents, value, [callback])
#### setLabel(torrents, value, [callback])
#### setForceStart(torrents, value, [callback])

__Arguments__
* `torrents` - One or more torrent objects or hash strings
* `value`
* `callback` *optional*
  * `error`

__Example__
```js
qbt.queued(function (error, items) {
  qbt.setForceStart(items, true);
});
```

#### addTrackers(torrents, trackers, [callback])

__Arguments__
* `torrents` - One or more torrent objects or hash strings
* `trackers` - Array of tracker url strings
* `callback` *optional*
  * `error`

__Example__
```js
qbt.inactive(function (error, items) {
  qbt.addTrackers(items, [
    "udp://tracker.openbittorrent.com:80/announce",
    "udp://tracker.publicbt.com:80/announce"
  ]);
});
```

<a name="fcom"></a>

## File commands

#### setFilePrio(torrent, fileId, value, [callback])

__Arguments__
* `torrent` - Single torrent object or hash string
* `fileId` - Index of the file in the torrent's file list (zero-based)
* `value`
  * `0` - Do not download
  * `1` - Normal
  * `2` - High
  * `7` - Maximum
* `callback` *optional*
  * `error`
 
__Example__
```js
qbt.paused(function (error, items) {
  items.forEach(function (item) {
    qbt.files(item, function (error, files) {
      files.forEach(function (file, index) {
        if (file.progress === 0) {
          qbt.setFilePrio(item, index, 0);
        }
      });
    });
  });
});
```
