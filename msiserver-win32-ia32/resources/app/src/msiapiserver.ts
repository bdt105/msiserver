import { Rest, Toolbox } from 'bdt105toolbox/dist';

export class MsiApiServer {
    private configuration: any;
    private fs: any;
    private logs: any;
    private configurationFileName = "configuration.json";
    private lastError: any;
    private defaultLogSize = 30;
    private "jwtSecret": "122344";
    private apiIdentifier = "identifier";
    private apiListFiles = "listFiles";
    private apiDeleteFile = "deleteFile";
    private apiDownlaodFiles = "downloadFile";
    private token = "";
    private downloading = false;

    private deamon: any;

    private started = false;

    private rest = new Rest();
    private toolbox = new Toolbox()

    private defaultConfiguration = {
        "destinationDirectory": "N:\\APPRES\\AvisoConfig\\BACKUP\\",
        "tempDirectory": "./temp/",
        "baseUrl": "http://vps592280.ovh.net/apiupload/",
        "interval": 30000
    }
    private nextExecutionDate: Date;

    constructor() {
        this.fs = require('fs');
    }

    getLastError() {
        return this.lastError;
    }

    private startDownload() {
        this.nextExecutionDate = new Date( new Date().getTime() + this.configuration.interval);
        if (this.started) {
            this.download();
        }
    }

    private tickDownload() {
        this.deamon = setInterval(
            () => {
                this.startDownload();
            }, this.configuration.interval)
    }

    getNextExecutionDate() {
        return this.toolbox.formatDate(this.nextExecutionDate);
    }

    private download() {
        if (!this.downloading) {
            this.listFiles(
                (data: any, error: any) => {
                    if (data && data.statusCode == 200 && data.json && data.json.data && data.json.data.length > 0) {
                        let fileName = data.json.data[0];
                        this.downloading = true;
                        this.downloadFile(
                            (data: any, error: any) => {
                                if (!error) {
                                    this.copyFile(
                                        (data1: any, error1: any) => {
                                            if (!error1) {
                                                this.writeLog("File " + fileName + " copied");
                                                this.deleteRemoteFile(
                                                    (data2: any, error2: any) => {
                                                        if (!error2) {
                                                            this.writeLog("Remote file " + fileName + " deleted");
                                                        } else {
                                                            this.writeError("Remote file " + fileName + " NOT deleted");
                                                            this.writeError(JSON.stringify(error2));
                                                        }
                                                        this.downloading = false;
                                                    }, fileName)
                                            } else {
                                                this.writeError("File " + fileName + " NOT copied");
                                                this.writeError(JSON.stringify(error1));
                                            }
                                        }, fileName, fileName);
                                } else {
                                    this.writeError("File " + fileName + " NOT copied");
                                    this.writeError(JSON.stringify(error));
                                }
                            }, fileName);
                    } else {
                        if (error) {
                            this.writeError(JSON.stringify(error));
                        }
                    }
                })
        }
    }

    start() {
        this.loadConfiguration();
        this.started = this.configuration.identifier != null;
        this.logs = [];
        this.startDownload();
        this.tickDownload();
        return this.started;
    }

    stop() {
        this.started = false;
        this.downloading = false;
        if (this.deamon) {
            clearInterval(this.deamon);
            this.deamon = null;
        }
        return this.started;
    }

    private getIdentifierFormServer(callback: Function) {
        let url = this.configuration.baseUrl + this.apiIdentifier;
        this.rest.call(
            (data: any, error: any) => {
                if (!error) {
                    this.configuration.identifier = data.json.identifier;
                }
                callback(data, error);
            }, "POST", url, { "token": this.token }
        )
    }

    getIdentifier() {
        return this.configuration.identifier;
    }

    getNewIdentifier(callback: Function) {
        if (this.configuration) {
            this.getIdentifierFormServer(
                (data: any, error: any) => {
                    if (!error && data && data.json) {
                        this.configuration.identifier = data.json.identifier;
                        this.saveConfiguration();
                        callback(this.configuration.identifier, null);
                    } else {
                        callback(data, error);
                    }
                }
            )
        } else {
            this.lastError = "Configuration error";
            callback(null, this.lastError);
        }
    }

    isStarted() {
        return this.started;
    }

    getStatus() {
        let mes: string;
        if (this.configuration) {
            if (!this.configuration.identifier) {
                mes = "No identifier defined";
            } else {
                mes = this.started ? "Started" : "Stopped";
            }
        } else {
            mes = "No configuration defined";
        }
        return mes;
    }

    private write(text: string) {
        let date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        if (!this.logs) {
            this.logs = [];
        } else {
            this.logs.splice(this.configuration.logSize ? this.configuration.logSize : this.defaultLogSize, this.logs.length);
        }
        this.logs.splice(0, 0, date + " " + text);
    }

    private writeLog(text: string) {
        this.write("<span>" + text + "</span>");
    }

    private writeError(text: string) {
        this.write("<span style='color: red'>" + text + "</span>");
    }

    private copyFile(callback: Function, fileName: string, originalFileName: string): any {
        let ret = null;
        let dest = this.configuration.destinationDirectory;
        let temp = this.configuration.tempDirectory ? this.configuration.tempDirectory : "./temp/";
        this.fs.copyFile(temp + fileName, dest + originalFileName,
            (err: any) => {
                if (err) {
                    ret = err;
                } else {
                    this.fs.unlink(temp + fileName, (err1: any) => {
                        if (err1) {
                            ret = err1;
                        } else {
                            ret = null;
                        }
                        callback(null, err1);
                    });
                }
            });
        return ret;
    }


    private deleteRemoteFile(callback: Function, fileName: string) {
        let url = this.configuration.baseUrl + this.apiDeleteFile;
        this.rest.call(
            callback, "POST", url, { "token": this.configuration.token, "identifier": this.configuration.identifier, "fileName": fileName }
        )

    }
    loadConfiguration() {
        if (this.fs.existsSync(this.configurationFileName)) {
            var conf = this.fs.readFileSync(this.configurationFileName);
            this.configuration = JSON.parse(conf);
        } else {
            this.fs.writeFileSync(this.configurationFileName, JSON.stringify(this.defaultConfiguration));
            this.loadConfiguration();
        }
    }

    saveConfiguration() {
        this.fs.writeFileSync(this.configurationFileName, JSON.stringify(this.configuration));
    }

    private downloadFile(callback: Function, fileName: string) {
        let url = this.configuration.baseUrl + this.apiDownlaodFiles;
        this.rest.call(
            (data: any, error: any) => {
                let temp = this.configuration.tempDirectory;
                if (!this.fs.existsSync(temp)) {
                    this.fs.mkdirSync(temp);
                }
                if (this.fs.existsSync(temp + fileName)) {
                    this.fs.unlinkSync(temp + fileName);
                }
                this.fs.writeFileSync(temp + fileName, data.json, "utf8");
                this.writeLog("File " + fileName + " downloaded");
                callback(data, error);
            }, "POST", url, { "identifier": this.configuration.identifier, "token": this.token, "fileName": fileName }
        )
    }

    private listFiles(callback: Function) {
        let temp = this.configuration.tempDirectory;
        let url = this.configuration.baseUrl + this.apiListFiles;
        this.rest.call(
            (data: any, error: any) => {
                callback(data, error);
            }, "POST", url, { "token": this.token, "identifier": this.configuration.identifier }
        )
    }

    getLogs(lineSeparator = "<br>") {
        let ret = "";
        if (this.logs) {
            for (var i = 0; i < this.logs.length; i++) {
                ret += (ret ? lineSeparator : "") + this.logs[i];
            }
        }
        return ret;
    }

    getConfiguration() {
        return this.configuration;
    }

}