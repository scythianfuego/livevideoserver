"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("uws");
const fs = require("fs");
const child_process_1 = require("child_process");
const flvdecoder_1 = require("./transform/flvdecoder");
class Server {
    constructor() {
        this.lastdata = Buffer.alloc(0);
        const configJson = fs.readFileSync(__dirname + '/../config.json');
        const config = JSON.parse(configJson.toString());
        this.streamUrl = config.source;
        this.decoder = new flvdecoder_1.FLVDecoder(() => {
            this.startSocketServer();
        });
        this.startRTMP();
    }
    startRTMP() {
        let chunkId = 0;
        let timeStart = new Date().getTime();
        const rtmpdump = child_process_1.spawn('rtmpdump', ['-vr', this.streamUrl, '-o', '-']);
        rtmpdump.stdout.on('data', (data) => {
            this.parseStream(data);
            const time = (new Date().getTime() - timeStart) / 1000;
            console.log(`[${time}] RTMP got chunk ${chunkId}`);
            chunkId++;
        });
        rtmpdump.stdout.on('error', error => {
            console.log(error);
        });
        rtmpdump.stderr.on('data', data => {
            console.log(`stderr: ${data}`);
        });
        rtmpdump.on('close', code => {
            console.log(`child process exited with code ${code}`);
        });
    }
    startSocketServer() {
        const wss = new WebSocket.Server({ host: '0.0.0.0', port: 9090 });
        wss.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
            });
            ws.send(this.decoder.firstPacket);
            let waitFirstKeyframe = true;
            let handler = (tag) => {
                if (tag.avcFrameType == flvdecoder_1.FLV.VIDEO_AVC_KEYFRAME) {
                    waitFirstKeyframe = false;
                }
                if (!waitFirstKeyframe) {
                    ws.send(tag.data, error => {
                        if (error) {
                            this.decoder.removeListener('frame', handler);
                        }
                    });
                }
            };
            this.decoder.on('frame', handler);
        });
    }
    parseStream(data) {
        data = Buffer.concat([this.lastdata, data]);
        let bytesLeft = this.decoder.parseChunks(data);
        const unprocessedDataStart = data.length - bytesLeft;
        data = data.slice(unprocessedDataStart);
        this.lastdata = data;
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map