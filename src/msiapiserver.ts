import express = require('express');

export class MsiApiServer {
    private app: any;
    private configuration: any;
    private bodyParser: any;
    private port: number;
    private fs: any;
    private logs: any;
    private configurationFileName = "./dist/configuration.json";
    private lastError: any;

    constructor() {
        this.loadConfiguration();
    }

    getLastError(){
        return this.lastError;
    }

    initApi() {
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
        return this.listen();
        
    }

    private writeLog(text: string) {
        let date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        this.logs.push(date + " " + text);
    }

    private intApiEntries() {
        this.initUpload();
    }

    private initUpload() {
        var multer = require('multer');
        var upload = multer({ dest: this.configuration.common.tempDirectory });

        this.app.post('/upload', upload.single('file'), (req: any, res: any) => {
            res.status(200);
            res.setHeader('content-type', 'application/json');
            this.writeLog("Receive file: '" + req.file.originalname + (req.body ? "', from: " + req.body.station + " (" + req.body.user + ")" : ""));
            let dest = this.configuration.common.destinationDirectory ? this.configuration.common.destinationDirectory : "./";
            this.fs.copyFile(this.configuration.common.tempDirectory + req.file.filename, dest + req.file.originalname, (err: any) => {
                if (err) {
                    this.writeLog(JSON.stringify(err));
                    res.status(500);
                    res.send(JSON.stringify({ status: "ERR", error: err }));
                } else {
                    this.fs.unlink(this.configuration.common.tempDirectory + req.file.filename, (err1: any) => {
                        if (err1) {
                            this.writeLog(JSON.stringify(err1));
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
            return true;
        } else {
            return false;
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
            this.app.listen(this.port); 
            return "Listening to port " + this.port;
        } catch (error) {
            this.lastError = error;
            return error;
        }
    }

}