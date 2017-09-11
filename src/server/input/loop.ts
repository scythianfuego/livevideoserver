import { spawn } from "child_process";
import { EventEmitter } from "events";
import { Messages } from "../interfaces/messages";

export class LoopInput extends EventEmitter {
  // implements IInput
  private schema: string;

  constructor(schema: string) {
    super();
    this.schema = schema;
    this.run();
  }

  public run() {
    let chunkId = 0;
    const timeStart = new Date().getTime();
    // ./ffmpeg -re -stream_loop -1 -i loop.flv -f flv pipe:1 < /dev/null
    // ./ffmpeg -re -i loop.flv -c copy test.flv < /dev/null
    // ./ffmpeg -re -stream_loop -1 -i loop.flv -c copy test.flv < /dev/null
    // ./ffmpeg -re -stream_loop -1 -i loop.flv -c copy -f flv pipe:1 < /dev/null
    console.log(process.cwd() + "/src/assets/");
    const loopProcess = spawn(
      "./ffmpeg",
      ["-re", "-stream_loop", "-1", "-i", "loop.flv", "-c", "copy", "-f", "flv", "pipe:1"],
      {
        cwd: process.cwd() + "/src/assets/"
      }
    );
    loopProcess.stdout.on("data", (data: Buffer) => {
      // parseStream(data);
      this.emit(Messages.FLV_INPUT_CHUNK, data);
      const time = (new Date().getTime() - timeStart) / 1000;
      console.log(`[${time}] LOOP got chunk ${chunkId}`);
      chunkId++;
    });
    loopProcess.stdout.on("error", (error: string) => {
      console.log(error);
    });
    loopProcess.stderr.on("data", (data: string) => {
      console.log(`stderr: ${data}`);
    });
    loopProcess.on("close", (code: number) => {
      console.log(`child process exited with code ${code}`);
    });
  }
}
