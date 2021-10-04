"use strict";
exports.__esModule = true;
var dist_1 = require("bdt105toolbox/dist");
var dist_2 = require("bdt105connexion/dist");
var MsiApiServer = /** @class */ (function () {
    function MsiApiServer() {
        this.configurationFileName = "configuration.json";
        this.defaultLogSize = 30;
        this.jwtSecret = "122344";
        this.apiIdentifier = "identifier";
        this.apiListFiles = "listFiles";
        this.apiDeleteFile = "deleteFile";
        this.apiDownlaodFiles = "downloadFile";
        this.token = "";
        this.currentState = "";
        this.countFileCopied = 0;
        this.started = false;
        this.rest = new dist_1.Rest();
        this.toolbox = new dist_1.Toolbox();
        this.defaultConfiguration = {
            "destinationDirectory": "N:\\Avisoconfig\\BACKUP\\",
            "tempDirectory": "./temp/",
            "baseUrl": "http://vps592280.ovh.net/apifileserver/",
            "interval": 2000,
            "qrcodeBaseUrl": "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data="
        };
        this.fs = require('fs');
        var jwtConf = new dist_2.JwtConfiguration(this.jwtSecret, null, null, null);
        this.connexion = new dist_2.Connexion(null, jwtConf);
    }
    MsiApiServer.prototype.getLastError = function () {
        return this.lastError;
    };
    MsiApiServer.prototype.getToken = function () {
        return this.configuration.token;
    };
    MsiApiServer.prototype.startDownload = function () {
        this.nextExecutionDate = new Date(new Date().getTime() + this.configuration.interval);
        if (this.started) {
            this.download();
        }
    };
    MsiApiServer.prototype.tickDownload = function () {
        var _this = this;
        this.deamon = setInterval(function () {
            _this.startDownload();
        }, this.configuration.interval);
    };
    MsiApiServer.prototype.getNextExecutionDate = function () {
        return this.toolbox.formatDate(this.nextExecutionDate);
    };
    MsiApiServer.prototype.setCurrentState = function (state) {
        this.currentState = state;
    };
    MsiApiServer.prototype.download = function () {
        var _this = this;
        this.setCurrentState("Listing files...");
        this.listFiles(function (data, error) {
            if (data && data.statusCode == 200 && data.json && data.json && data.json.length > 0) {
                var fileName_1 = data.json[0];
                _this.setCurrentState("Downloading " + fileName_1 + "...");
                _this.downloadFile(function (data, error) {
                    _this.setCurrentState("Downloading " + fileName_1 + " done");
                    if (!error && data && data.statusCode == 200) {
                        _this.setCurrentState(fileName_1 + " downloaded");
                        _this.copyFile(function (data1, error1) {
                            if (!error1) {
                                _this.setCurrentState(fileName_1 + " copied");
                                _this.deleteRemoteFile(function (data2, error2) {
                                    if (!error2) {
                                        _this.countFileCopied++;
                                        _this.writeLog("File " + fileName_1 + " copied");
                                        _this.setCurrentState("Remote file " + fileName_1 + " deleted");
                                    }
                                    else {
                                        _this.writeError("Remote file " + fileName_1 + " NOT deleted");
                                        _this.writeError(JSON.stringify(error2));
                                    }
                                }, fileName_1);
                            }
                            else {
                                _this.writeError("File " + fileName_1 + " NOT copied");
                                _this.writeError(JSON.stringify(error1));
                            }
                        }, fileName_1, fileName_1);
                    }
                    else {
                        if (data && data.statusCode != 403) {
                            _this.writeError("File " + fileName_1 + " NOT copied");
                        }
                        if (error) {
                            _this.writeError(JSON.stringify(error));
                        }
                    }
                }, fileName_1);
            }
            else {
                if (data && data.statusCode == 404) {
                    _this.writeError("Identifier unknown. generate a new one please");
                }
                if (data && data.statusCode == 200 && data.json && data.json.length == 0) {
                    _this.setCurrentState("Nothing to download");
                }
                if (error) {
                    _this.writeError(JSON.stringify(error));
                }
            }
        });
    };
    MsiApiServer.prototype.getInfo = function () {
        this.infos = {};
        this.infos.os = process.env.OS;
        this.infos.userDomain = process.env.USERDOMAIN;
        this.infos.userName = process.env.USERNAME;
    };
    MsiApiServer.prototype.start = function () {
        var _this = this;
        this.getInfo();
        this.startDate = new Date();
        this.stopDate = null;
        this.logs = [];
        this.countFileCopied = 0;
        this.started = true;
        this.setCurrentState("Loading configuration");
        this.loadConfiguration();
        if (!this.checkConfiguration()) {
            this.started = false;
            this.writeError("Error configuration");
            this.setCurrentState("Server NOT started");
        }
        if (!this.checkDestination()) {
            this.started = false;
            this.writeError("Destination could not be reached");
            this.setCurrentState("Server NOT started");
        }
        if (this.started) {
            this.setCurrentState("Checking server");
            this.checkServer(function (data, error) {
                _this.setCurrentState("Server checked");
                if (!error && data.statusCode == 200) {
                    _this.setCurrentState("Server started");
                    _this.startDownload();
                    _this.tickDownload();
                }
                else {
                    _this.writeError("File server error");
                    _this.writeError(JSON.stringify(error) + (data ? JSON.stringify(data) : ""));
                    _this.started = false;
                    _this.setCurrentState("Server stopped");
                }
            });
        }
    };
    MsiApiServer.prototype.stop = function () {
        this.stopDate = new Date();
        this.started = false;
        if (this.deamon) {
            clearInterval(this.deamon);
            this.deamon = null;
        }
        this.setCurrentState("Server stopped");
    };
    MsiApiServer.prototype.getStartDate = function () {
        return this.toolbox.formatDate(this.startDate);
    };
    MsiApiServer.prototype.getStopDate = function () {
        return this.toolbox.formatDate(this.stopDate);
    };
    MsiApiServer.prototype.getServerDate = function () {
        return this.started ? this.getStartDate() : this.getStopDate();
    };
    MsiApiServer.prototype.getCountFileCopied = function () {
        return this.countFileCopied;
    };
    MsiApiServer.prototype.getIdentifierFormServer = function (callback) {
        var _this = this;
        var url = this.configuration.baseUrl + this.apiIdentifier;
        this.rest.call(function (data, error) {
            if (!error && data && data.json) {
                _this.configuration.identifier = data.json.identifier;
                _this.token = _this.connexion.createJwt({ "identifier": _this.configuration.identifier }, { "expiresIn": "10y" });
            }
            callback(data, error);
        }, "POST", url, { "token": this.getToken(), "infos": this.infos });
    };
    MsiApiServer.prototype.getIdentifier = function () {
        return this.configuration.identifier;
    };
    MsiApiServer.prototype.getNewIdentifier = function (callback) {
        var _this = this;
        if (this.configuration) {
            this.getIdentifierFormServer(function (data, error) {
                if (!error) {
                    _this.saveConfiguration();
                    callback(_this.configuration.identifier, null);
                }
                else {
                    callback(data, error);
                }
            });
        }
        else {
            this.lastError = "Configuration error";
            callback(null, this.lastError);
        }
    };
    MsiApiServer.prototype.isStarted = function () {
        return this.started;
    };
    MsiApiServer.prototype.getCurrentState = function () {
        return this.currentState;
    };
    MsiApiServer.prototype.checkConfiguration = function () {
        var ret = true;
        if (this.configuration) {
            if (!this.configuration.identifier) {
                this.writeError("No identifier defined");
                ret = false;
            }
        }
        else {
            ret = false;
            this.writeError("No configuration defined");
        }
        return ret;
    };
    MsiApiServer.prototype.checkServer = function (callback) {
        this.rest.call(function (data, error) {
            callback(data, error);
        }, "GET", this.configuration.baseUrl);
    };
    MsiApiServer.prototype.checkDestination = function () {
        var destinationDirectory = this.configuration.destinationDirectory;
        return this.fs.existsSync(destinationDirectory);
    };
    MsiApiServer.prototype.write = function (text) {
        var date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        if (!this.logs) {
            this.logs = [];
        }
        else {
            this.logs.splice(this.configuration.logSize ? this.configuration.logSize : this.defaultLogSize, this.logs.length);
        }
        this.logs.splice(0, 0, date + " " + text);
    };
    MsiApiServer.prototype.writeLog = function (text) {
        this.write("<span>" + text + "</span>");
    };
    MsiApiServer.prototype.writeError = function (text) {
        this.write("<span style='color: red'>" + text + "</span>");
    };
    MsiApiServer.prototype.copyFile = function (callback, fileName, originalFileName) {
        var _this = this;
        var ret = null;
        var dest = this.configuration.destinationDirectory;
        var temp = this.configuration.tempDirectory ? this.configuration.tempDirectory : "./temp/";
        this.fs.copyFile(temp + fileName, dest + originalFileName, function (err) {
            if (err) {
                ret = err;
            }
            else {
                _this.fs.unlink(temp + fileName, function (err1) {
                    if (err1) {
                        ret = err1;
                    }
                    else {
                        ret = null;
                    }
                    callback(null, err1);
                });
            }
        });
        return ret;
    };
    MsiApiServer.prototype.deleteRemoteFile = function (callback, fileName) {
        var url = this.configuration.baseUrl + this.apiDeleteFile;
        this.rest.call(callback, "POST", url, { "token": this.configuration.token, "identifier": this.configuration.identifier, "fileName": fileName, "infos": this.infos });
    };
    MsiApiServer.prototype.loadConfiguration = function () {
        if (this.fs.existsSync(this.configurationFileName)) {
            var conf = this.fs.readFileSync(this.configurationFileName);
            this.configuration = JSON.parse(conf);
        }
        else {
            this.fs.writeFileSync(this.configurationFileName, JSON.stringify(this.defaultConfiguration));
            this.loadConfiguration();
        }
    };
    MsiApiServer.prototype.saveConfiguration = function () {
        this.fs.writeFileSync(this.configurationFileName, JSON.stringify(this.configuration));
    };
    MsiApiServer.prototype.downloadFile = function (callback, fileName) {
        var _this = this;
        var url = this.configuration.baseUrl + this.apiDownlaodFiles;
        this.rest.call(function (data, error) {
            if (!error && data && data.statusCode == 200) {
                var temp = _this.configuration.tempDirectory;
                if (!_this.fs.existsSync(temp)) {
                    _this.fs.mkdirSync(temp);
                }
                if (_this.fs.existsSync(temp + fileName)) {
                    _this.fs.unlinkSync(temp + fileName);
                }
                _this.fs.writeFileSync(temp + fileName, data.raw);
            }
            callback(data, error);
        }, "POST", url, { "identifier": this.configuration.identifier, "token": this.getToken(), "fileName": fileName, "infos": this.infos });
    };
    MsiApiServer.prototype.listFiles = function (callback) {
        var url = this.configuration.baseUrl + this.apiListFiles;
        this.rest.call(function (data, error) {
            callback(data, error);
        }, "POST", url, { "token": this.getToken(), "identifier": this.configuration.identifier, "infos": this.infos });
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
    MsiApiServer.prototype.getConfiguration = function () {
        return this.configuration;
    };
    MsiApiServer.prototype.getQrCodeUrl = function () {
        var ret = "";
        if (this.configuration && this.configuration.identifier && this.configuration.qrcodeBaseUrl) {
            return this.configuration.qrcodeBaseUrl + this.configuration.identifier;
        }
        return ret;
    };
    return MsiApiServer;
}());
exports.MsiApiServer = MsiApiServer;
//# sourceMappingURL=msiapiserver.js.map