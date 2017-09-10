"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = require("../interfaces/messages");
const events_1 = require("events");
const child_process_1 = require("child_process");
class LoopInput extends events_1.EventEmitter {
    constructor() {
        super();
    }
    run() {
        let chunkId = 0;
        let timeStart = new Date().getTime();
        const loop = child_process_1.spawn("./ffmpeg", [
            "-re -stream_loop -1 -i loop.flv -f flv pipe:1 < /dev/null"
        ]);
        loop.stdout.on("data", data => {
            this.emit(messages_1.Messages.FLV_INPUT_CHUNK, data);
            const time = (new Date().getTime() - timeStart) / 1000;
            console.log(`[${time}] LOOP got chunk ${chunkId}`);
            chunkId++;
        });
        loop.stdout.on("error", error => {
            console.log(error);
        });
        loop.stderr.on("data", data => {
            console.log(`stderr: ${data}`);
        });
        loop.on("close", code => {
            console.log(`child process exited with code ${code}`);
        });
    }
}
exports.LoopInput = LoopInput;
//# sourceMappingURL=loop.js.map