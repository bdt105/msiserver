"use strict";
exports.__esModule = true;
var express = require("express");
var MsiApiServer = /** @class */ (function () {
    function MsiApiServer() {
        this.configurationFileName = "configuration.json";
        this.logSize = 30;
        this.loadConfiguration();
    }
    MsiApiServer.prototype.getLastError = function () {
        return this.lastError;
    };
    MsiApiServer.prototype.initApi = function () {
        if (this.configuration) {
            this.server = null;
            this.app = express();
            this.bodyParser = require('body-parser');
            this.port = this.configuration.common.port;
            this.logs = [];
            this.app.use(this.bodyParser.json({ limit: '50mb' }));
            this.app.use(this.bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
            this.app.use(function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', '*'); // Website you wish to allow to connect
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Request methods you wish to allow    
                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // Request headers you wish to allow
                res.setHeader('Access-Control-Allow-Credentials', 'true'); // Set to true if you need the website to include cookies in the requests sent, to the API (e.g. in case you use sessions)
                // Pass to next layer of middleware
                next();
            });
            this.fs = require('fs');
            this.intApiEntries();
            this.logs = [];
            this.listen();
        }
        else {
            this.writeError("Could not find configuration file");
        }
    };
    MsiApiServer.prototype.stopApi = function () {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.writeLog("Server stopped");
        }
        else {
            this.writeError("Server was not started");
        }
    };
    MsiApiServer.prototype.getStatus = function () {
        return this.server ? true : false;
    };
    MsiApiServer.prototype.write = function (text) {
        var date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        if (!this.logs) {
            this.logs = [];
        }
        else {
            this.logs.splice(this.logSize, this.logs.length);
        }
        this.logs.splice(0, 0, date + " " + text);
    };
    MsiApiServer.prototype.writeLog = function (text) {
        this.write("<span>" + text + "</span>");
    };
    MsiApiServer.prototype.writeError = function (text) {
        this.write("<span style='color: red'>" + text + "</span>");
    };
    MsiApiServer.prototype.intApiEntries = function () {
        this.initUpload();
    };
    MsiApiServer.prototype.initUpload = function () {
        var _this = this;
        var multer = require('multer');
        var upload = multer({ dest: this.configuration.common.tempDirectory });
        this.app.post('/upload', upload.single('file'), function (req, res) {
            res.setHeader('content-type', 'application/json');
            _this.writeLog("Receive file: '" + req.file.originalname + (req.body ? "', from: " + req.body.station + " (" + req.body.user + ")" : ""));
            var dest = _this.configuration.common.destinationDirectory ? _this.configuration.common.destinationDirectory : "./";
            _this.fs.copyFile(_this.configuration.common.tempDirectory + req.file.filename, dest + req.file.originalname, function (err) {
                if (err) {
                    res.status(500);
                    _this.writeError(JSON.stringify(err));
                    res.send(JSON.stringify({ status: "ERR", error: err }));
                }
                else {
                    res.status(200);
                    _this.fs.unlink(_this.configuration.common.tempDirectory + req.file.filename, function (err1) {
                        if (err1) {
                            _this.writeError(JSON.stringify(err1));
                        }
                        else {
                            _this.writeLog(_this.configuration.common.tempDirectory + req.file.filename + " cleaned successfully");
                        }
                    });
                    res.status(200);
                    _this.writeLog(dest + req.file.originalname + " copied successfully");
                    res.send(JSON.stringify({ status: "OK" }));
                }
            });
        });
    };
    MsiApiServer.prototype.loadConfiguration = function () {
        var fs = require('fs');
        if (fs.existsSync(this.configurationFileName)) {
            var conf = fs.readFileSync(this.configurationFileName);
            this.configuration = JSON.parse(conf);
        }
        else {
            this.writeError("Could not find configuration.json");
        }
    };
    /*
    process.on('uncaughtException', function (err) {
        console.error(err);
        console.error("Node NOT Exiting...");
        console.log(err);
        console.log("Node NOT Exiting...");
    });
    */
    MsiApiServer.prototype.listen = function () {
        try {
            this.server = this.app.listen(this.port);
            this.writeLog("Listening to port " + this.port);
        }
        catch (error) {
            this.writeError(JSON.stringify(error));
        }
    };
    MsiApiServer.prototype.getLogs = function (lineSeparator) {
        if (lineSeparator === void 0) { lineSeparator = "<br>"; }
        var ret = "";
        if (this.logs) {
            for (var i = 0; i < this.logs.length; i++) {
                ret += (ret ? lineSeparator : "") + this.logs[i];
            }
        }
        return ret;
    };
    return MsiApiServer;
}());
exports.MsiApiServer = MsiApiServer;
//# sourceMappingURL=msiapiserver.js.map