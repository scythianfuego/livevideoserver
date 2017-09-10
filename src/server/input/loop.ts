import { spawn } from "child_process";
import { EventEmitter } from "events";
import { IInput } from "../interfaces/IInput";
import { Messages } from "../interfaces/messages";

export class LoopInput extends EventEmitter implements IInput {
  constructor() {
    super();
  }

  public run() {
    let chunkId = 0;
    const timeStart = new Date().getTime();

    // ./ffmpeg -re -stream_loop -1 -i loop.flv -f flv pipe:1 < /dev/null

    const loop = spawn("./ffmpeg", ["-re -stream_loop -1 -i loop.flv -f flv pipe:1 < /dev/null"]);
    loop.stdout.on("data", data => {
      // parseStream(data);
      this.emit(Messages.FLV_INPUT_CHUNK, data);
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
