const fileHandler = require('./filehandler');
const httpProxyHandler = require('./httpproxyhandler');
const Service = require('webos-service');

// create webos service
var service = new Service('com.tvh.app.proxy');
service.activityManager.idleTimeout = 300;

// keep service alive 
var keepAlive;
service.activityManager.create("keepAlive", function (activity) {
    console.log("keep alive called");
    keepAlive = activity;
});

// When you're done, complete the activity 
service.activityManager.complete(keepAlive, function (activity) {
     console.log("completed activity");
});

/**
 * allow read/write access to files
 */
service.register('fileIO', fileHandler.handleFileIO);

/**
 * backend proxy for requests to tvheadend as they are
 * not possible from browser due to cors restrictions
 */
service.register('proxy', httpProxyHandler.proxy);
