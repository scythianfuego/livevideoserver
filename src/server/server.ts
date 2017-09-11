import * as fs from "fs";
import * as WebSocket from "uws";
import { LoopInput } from "./input/loop";
// import { RTMPInput } from "./input/rtmp";
import { IVideoTag } from "./interfaces/IVideoTag";
import { Messages } from "./interfaces/messages";
import { FLV, FLVDecoder } from "./transform/flvdecoder";

export class Server {
  private streamUrl: string;
  private lastdata = Buffer.alloc(0);
  private decoder: FLVDecoder;

  constructor() {
    const configJson = fs.readFileSync(process.cwd() + "/config.json");
    const config = JSON.parse(configJson.toString());
    this.streamUrl = config.source;
    this.decoder = new FLVDecoder(() => {
      this.startSocketServer();
    });

    const inp = new LoopInput(this.streamUrl);
    inp.on(Messages.FLV_INPUT_CHUNK, data => {
      this.parseStream(data);
    });
  }

  public startSocketServer() {
    // let clientId = 0;
    const wss = new WebSocket.Server({ host: "0.0.0.0", port: 9090 });
    wss.on("connection", ws => {
      ws.on("message", message => {
        console.log("received: %s", message);
      });

      // send flv header and aac/avc tags
      ws.send(this.decoder.firstPacket);
      // wait for keyframe
      let waitFirstKeyframe = true;
      // let wsClientId = ++clientId;

      // start sending data
      const handler = (tag: IVideoTag) => {
        if (tag.avcFrameType === FLV.VIDEO_AVC_KEYFRAME) {
          waitFirstKeyframe = false;
        }

        if (!waitFirstKeyframe) {
          // console.log('ws send frame to c:' + wsClientId);
          ws.send(tag.data, error => {
            if (error) {
              this.decoder.removeListener("frame", handler);
            }
          });
        }
      };

      this.decoder.on("frame", handler);
    });
  }

  public parseStream(data: Buffer) {
    console.log("last:" + this.lastdata.length + " new:" + data.length);

    data = Buffer.concat([this.lastdata, data]);
    const bytesLeft = this.decoder.parseChunks(data);
    const unprocessedDataStart = data.length - bytesLeft;
    data = data.slice(unprocessedDataStart);
    this.lastdata = data;
    // console.log('cut ' + bytesLeft);
  }
}

// const chunk = fs.readFileSync('stream.flv');
// decoder.parseChunks(chunk);
// const stream = fs.createReadStream('stream.flv');
// stream.on('data', parseStream);
