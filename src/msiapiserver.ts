import { Rest, Toolbox } from 'bdt105toolbox/dist';
import { Connexion, JwtConfiguration } from 'bdt105connexion/dist';

export class MsiApiServer {
    private configuration: any;
    private fs: any;
    private logs: any;
    private configurationFileName = "configuration.json";
    private lastError: any;
    private defaultLogSize = 30;
    private jwtSecret = "122344";
    private apiIdentifier = "identifier";
    private apiListFiles = "listFiles";
    private apiDeleteFile = "deleteFile";
    private apiDownlaodFiles = "downloadFile";
    private token = "";
    private connexion: Connexion;
    private infos: any;

    private currentState = "";

    private deamon: any;

    private countFileCopied = 0;

    private started = false;

    private rest = new Rest();
    private toolbox = new Toolbox();

    private startDate: Date;
    private stopDate: Date;

    private defaultConfiguration = {
        "destinationDirectory": "N:\\Avisoconfig\\BACKUP\\",
        "tempDirectory": "./temp/",
        "baseUrl": "http://vps592280.ovh.net/apifileserver/",
        "interval": 2000,
        "qrcodeBaseUrl": "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data="
    }
    private nextExecutionDate: Date;

    constructor() {
        this.fs = require('fs');
        let jwtConf = new JwtConfiguration(this.jwtSecret, null, null, null);
        this.connexion = new Connexion(null, jwtConf);
    }

    getLastError() {
        return this.lastError;
    }

    private getToken() {
        if (!this.getToken) {
            this.token = this.connexion.createJwt({ "application": "msiserver" }, { "expiresIn": "10y" });
        }
        return this.token;
    }

    private startDownload() {
        this.nextExecutionDate = new Date(new Date().getTime() + this.configuration.interval);
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

    private setCurrentState(state: string) {
        this.currentState = state;
    }

    private download() {
        this.setCurrentState("Listing files...");
        this.listFiles(
            (data: any, error: any) => {
                if (data && data.statusCode == 200 && data.json && data.json.data && data.json.data.length > 0) {
                    let fileName = data.json.data[0];
                    this.setCurrentState("Downloading " + fileName + "...");
                    this.downloadFile(
                        (data: any, error: any) => {
                            this.setCurrentState("Downloading " + fileName + " done");
                            if (!error && data && data.statusCode == 200) {
                                this.setCurrentState(fileName + " downloaded");
                                this.copyFile(
                                    (data1: any, error1: any) => {
                                        if (!error1) {
                                            this.setCurrentState(fileName + " copied");
                                            this.deleteRemoteFile(
                                                (data2: any, error2: any) => {
                                                    if (!error2) {
                                                        this.countFileCopied++;
                                                        this.writeLog("File " + fileName + " copied");
                                                        this.setCurrentState("Remote file " + fileName + " deleted");
                                                    } else {
                                                        this.writeError("Remote file " + fileName + " NOT deleted");
                                                        this.writeError(JSON.stringify(error2));
                                                    }
                                                }, fileName)
                                        } else {
                                            this.writeError("File " + fileName + " NOT copied");
                                            this.writeError(JSON.stringify(error1));
                                        }
                                    }, fileName, fileName);
                            } else {
                                if (data && data.statusCode != 403) {
                                    this.writeError("File " + fileName + " NOT copied");
                                }
                                if (error) {
                                    this.writeError(JSON.stringify(error));
                                }
                            }
                        }, fileName);
                } else {
                    if (data && data.statusCode == 404) {
                        this.writeError("Identifier unknown. generate a new one please");
                    }
                    if (data && data.statusCode == 200 && data.json && data.json.data && data.json.data.length == 0) {
                        this.setCurrentState("Nothing to download");
                    }
                    if (error) {
                        this.writeError(JSON.stringify(error));
                    }
                }
            })
    }

    private getInfo() {
        this.infos = {};
        this.infos.os = process.env.OS;
        this.infos.userDomain = process.env.USERDOMAIN;
        this.infos.userName = process.env.USERNAME;
    }

    start() {
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
            this.checkServer(
                (data: any, error: any) => {
                    this.setCurrentState("Server checked");
                    if (!error && data.statusCode == 200) {
                        this.setCurrentState("Server started");
                        this.startDownload();
                        this.tickDownload();
                    } else {
                        this.writeError("File server error");
                        this.writeError(JSON.stringify(error) + (data ? JSON.stringify(data) : ""));
                        this.started = false;
                        this.setCurrentState("Server stopped");
                    }
                }
            );
        }
    }

    stop() {
        this.stopDate = new Date();
        this.started = false;
        if (this.deamon) {
            clearInterval(this.deamon);
            this.deamon = null;
        }
        this.setCurrentState("Server stopped");
    }

    getStartDate() {
        return this.toolbox.formatDate(this.startDate);
    }

    getStopDate() {
        return this.toolbox.formatDate(this.stopDate);
    }

    getServerDate() {
        return this.started ? this.getStartDate() : this.getStopDate()
    }

    getCountFileCopied() {
        return this.countFileCopied;
    }

    private getIdentifierFormServer(callback: Function) {
        let url = this.configuration.baseUrl + this.apiIdentifier;
        this.rest.call(
            (data: any, error: any) => {
                if (!error && data && data.json && data.json.data) {
                    this.configuration.identifier = data.json.data.identifier;
                    this.token = this.connexion.createJwt({ "identifier": this.configuration.identifier }, { "expiresIn": "10y" });
                }
                callback(data, error);
            }, "POST", url, { "token": this.getToken(), "infos": this.infos }
        )
    }

    getIdentifier() {
        return this.configuration.identifier;
    }

    getNewIdentifier(callback: Function) {
        if (this.configuration) {
            this.getIdentifierFormServer(
                (data: any, error: any) => {
                    if (!error) {
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

    getCurrentState() {
        return this.currentState;
    }

    private checkConfiguration() {
        let ret = true;
        if (this.configuration) {
            if (!this.configuration.identifier) {
                this.writeError("No identifier defined");
                ret = false;
            }
        } else {
            ret = false;
            this.writeError("No configuration defined");
        }
        return ret;
    }

    private checkServer(callback: Function) {
        this.rest.call(
            (data: any, error: any) => {
                callback(data, error);
            }, "GET", this.configuration.baseUrl
        )
    }

    private checkDestination() {
        let destinationDirectory = this.configuration.destinationDirectory;
        return this.fs.existsSync(destinationDirectory);
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
            callback, "POST", url, { "token": this.configuration.token, "identifier": this.configuration.identifier, "fileName": fileName, "infos": this.infos }
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
                if (!error && data && data.statusCode == 200) {
                    let temp = this.configuration.tempDirectory;
                    if (!this.fs.existsSync(temp)) {
                        this.fs.mkdirSync(temp);
                    }
                    if (this.fs.existsSync(temp + fileName)) {
                        this.fs.unlinkSync(temp + fileName);
                    }
                    this.fs.writeFileSync(temp + fileName, data.raw);
                }
                callback(data, error);
            }, "POST", url, { "identifier": this.configuration.identifier, "token": this.getToken(), "fileName": fileName, "infos": this.infos }
        )
    }

    private listFiles(callback: Function) {
        let url = this.configuration.baseUrl + this.apiListFiles;
        this.rest.call(
            (data: any, error: any) => {
                callback(data, error);
            }, "POST", url, { "token": this.getToken(), "identifier": this.configuration.identifier, "infos": this.infos }
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

    getQrCodeUrl() {
        let ret = "";
        if (this.configuration && this.configuration.identifier && this.configuration.qrcodeBaseUrl) {
            return this.configuration.qrcodeBaseUrl + this.configuration.identifier;
        }
        return ret;
    }
}