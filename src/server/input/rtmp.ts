import { spawn } from "child_process";
import { EventEmitter } from "events";
import { Messages } from "../interfaces/messages";

export class RTMPInput extends EventEmitter {
  // implements IInput
  private schema: string;

  constructor(schema: string) {
    super();
    this.schema = schema || "rtmp://localhost/application/stream";
    this.run();
  }

  public run() {
    let chunkId = 0;
    const timeStart = new Date().getTime();
    const rtmpdump = spawn("rtmpdump", ["-vr", this.schema, "-o", "-"]);

    rtmpdump.stdout.on("data", (data: Buffer) => {
      // this.parseStream(data);
      this.emit(Messages.FLV_INPUT_CHUNK, data);
      const time = (new Date().getTime() - timeStart) / 1000;
      console.log(`[${time}] RTMP got chunk ${chunkId}`);
      chunkId++;
    });

    rtmpdump.stdout.on("error", error => {
      console.log(error);
    });

    rtmpdump.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    rtmpdump.on("close", code => {
      console.log(`child process exited with code ${code}`);
    });
  }
}
