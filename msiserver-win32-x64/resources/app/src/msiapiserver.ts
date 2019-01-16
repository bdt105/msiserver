import express = require('express');

export class MsiApiServer {
    private app: any;
    private configuration: any;
    private bodyParser: any;
    private port: number;
    private fs: any;
    private logs: any;
    private configurationFileName = "configuration.json";
    private lastError: any;
    private logSize = 30;
    private server: any;

    constructor() {
        this.loadConfiguration();
    }

    getLastError() {
        return this.lastError;
    }

    initApi() {
        if (this.configuration) {
            this.server = null;
            this.app = express();
            this.bodyParser = require('body-parser');
            this.port = this.configuration.common.port;
            this.logs = [];
            this.app.use(this.bodyParser.json({ limit: '50mb' }));
            this.app.use(this.bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

            this.app.use(function (req: any, res: any, next: any) {
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
        }else{
            this.writeError("Could not find configuration file");
        }
    }

    stopApi() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.writeLog("Server stopped");
        } else {
            this.writeError("Server was not started");
        }
    }

    getStatus() {
        return this.server ? true : false;
    }

    private write(text: string) {
        let date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        if (!this.logs) {
            this.logs = [];
        } else {
            this.logs.splice(this.logSize, this.logs.length);
        }
        this.logs.splice(0, 0, date + " " + text);
    }

    private writeLog(text: string) {
        this.write("<span>" + text + "</span>");
    }

    private writeError(text: string) {
        this.write("<span style='color: red'>" + text + "</span>");
    }

    private intApiEntries() {
        this.initUpload();
    }

    private initUpload() {
        var multer = require('multer');
        var upload = multer({ dest: this.configuration.common.tempDirectory });

        this.app.post('/upload', upload.single('file'), (req: any, res: any) => {
            res.setHeader('content-type', 'application/json');
            this.writeLog("Receive file: '" + req.file.originalname + (req.body ? "', from: " + req.body.station + " (" + req.body.user + ")" : ""));
            let dest = this.configuration.common.destinationDirectory ? this.configuration.common.destinationDirectory : "./";
            this.fs.copyFile(this.configuration.common.tempDirectory + req.file.filename, dest + req.file.originalname,
                (err: any) => {
                    if (err) {
                        res.status(500);
                        this.writeError(JSON.stringify(err));
                        res.send(JSON.stringify({ status: "ERR", error: err }));
                    } else {
                        res.status(200);
                        this.fs.unlink(this.configuration.common.tempDirectory + req.file.filename, (err1: any) => {
                            if (err1) {
                                this.writeError(JSON.stringify(err1));
                            } else {
                                this.writeLog(this.configuration.common.tempDirectory + req.file.filename + " cleaned successfully");
                            }
                        });
                        res.status(200);
                        this.writeLog(dest + req.file.originalname + " copied successfully");
                        res.send(JSON.stringify({ status: "OK" }));
                    }
                });
        });
    }

    private loadConfiguration() {
        var fs = require('fs');
        if (fs.existsSync(this.configurationFileName)) {
            var conf = fs.readFileSync(this.configurationFileName);
            this.configuration = JSON.parse(conf);
        } else {
            this.writeError("Could not find configuration.json");
        }
    }

    /*
    process.on('uncaughtException', function (err) {
        console.error(err);
        console.error("Node NOT Exiting...");
        console.log(err);
        console.log("Node NOT Exiting...");
    });
    */

    private listen() {
        try {
            this.server = this.app.listen(this.port);
            this.writeLog("Listening to port " + this.port);
        } catch (error) {
            this.writeError(JSON.stringify(error));
        }
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

}