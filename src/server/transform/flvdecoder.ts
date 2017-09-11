/* tslint:disable:no-bitwise */

import { EventEmitter } from "events";
import { IVideoTag } from "../interfaces/IVideoTag";
import { SmartBuffer } from "../utils/smartbuffer";

export const FLV = {
  SCRIPT: 18,
  VIDEO: 9,
  VIDEO_AVC: 7,
  VIDEO_AVC_KEYFRAME: 1,
  VIDEO_AVC_INTERFRAME: 2,
  AUDIO: 8,
  AUDIO_AAC: 10,
  AUDIO_AAC_HEADER: 0,
  AUDIO_AAC_RAW: 1,
  AUDIO_MP3: 2,
  AVC_DECODER_CONFIG: 0,
  AVC_VIDEO_DATA: 1
};

const FLVHeaderSize = 9;
const FLVTagHeaderSize = 17;

export class FLVDecoder extends EventEmitter {
  public firstPacket: Buffer;
  private streamReadyCallback: () => void;
  private streamReady: boolean = false;
  private firstChunk: boolean = true;
  private AACHeader: IVideoTag;
  private AVCDecoderConfig: IVideoTag;
  private FLVScriptHeader: IVideoTag;
  private FLVHeader: Buffer;

  constructor(streamReadyCallback: () => void) {
    super();
    this.streamReadyCallback = streamReadyCallback; // TODO: move out to separate class
  }

  // save important tags to reconstruct the stream
  public saveTag(tag: IVideoTag) {
    if (tag.type === FLV.SCRIPT) {
      this.FLVScriptHeader = tag;
    } else if (tag.type === FLV.VIDEO && tag.avcPayloadType === FLV.AVC_DECODER_CONFIG) {
      this.AVCDecoderConfig = tag;
    } else if (tag.type === FLV.AUDIO && tag.aacFrameType === FLV.AUDIO_AAC_HEADER) {
      this.AACHeader = tag;
    }

    if (
      this.FLVHeader &&
      this.AVCDecoderConfig &&
      this.AACHeader &&
      this.FLVScriptHeader &&
      !this.streamReady
    ) {
      this.streamReadyCallback();
      this.streamReady = true;

      this.FLVScriptHeader.data.writeUInt32BE(0, 0);
      this.AVCDecoderConfig.data.writeUInt32BE(this.FLVScriptHeader.data.length, 0);
      this.AACHeader.data.writeUInt32BE(this.AVCDecoderConfig.data.length, 0);
      this.firstPacket = Buffer.concat([
        this.FLVHeader,
        this.FLVScriptHeader.data,
        this.AVCDecoderConfig.data,
        this.AACHeader.data
      ]);
    }

    if (this.streamReady) {
      this.emit("frame", tag);
    }
  }

  public logTag(tag: IVideoTag) {
    let audioFormatName =
      tag.info.audioFormat === 2 ? "MP3" : tag.info.audioFormat === 10 ? "AAC" : "Other";
    audioFormatName += " " + ["5.5Khz", "11Khz", "22Khz", "44Khz"][tag.info.audioBitRate];
    audioFormatName += " " + ["8bit", "16bit"][tag.info.audioSampleSize];
    audioFormatName += " " + ["Mono", "Stereo"][tag.info.audioType];

    const types = ["", "key", "inter", "disposable", "generated", "command"];
    const codecs = ["", "", "H.263", "Screen", "VP6", "VP6+alpha", "Screen v2", "AVC"];
    let avcOpts = "";
    avcOpts += tag.avcPayloadType === FLV.AVC_DECODER_CONFIG ? " AVCDecoderConfig" : "";
    avcOpts += tag.avcPayloadType === FLV.AVC_VIDEO_DATA ? " AVCVideoData" : "";
    audioFormatName += tag.aacFrameType === FLV.AUDIO_AAC_HEADER ? " (aac header)" : " (raw)";

    if (tag.type === FLV.SCRIPT) {
      // script
      console.log(`[${tag.timestamp.toFixed(3)}] script frame`);
    } else if (tag.type === FLV.AUDIO) {
      // audio
      console.log(`[${tag.timestamp}] audio frame ${audioFormatName}`);
    } else if (tag.type === FLV.VIDEO) {
      // video
      console.log(
        `[${tag.timestamp}] video frame ${codecs[FLV.VIDEO_AVC]} ${types[
          tag.avcFrameType
        ]} ${avcOpts}`
      );
    }
  }

  public readTag(data: SmartBuffer) {
    const storedOffset = data.readOffset;
    if (data.length < data.readOffset + FLVTagHeaderSize) {
      console.log("cant read tag: " + data.length + " " + data.readOffset + " " + FLVTagHeaderSize);
      return null;
    }
    console.log("tag reader");

    const tagHeaderStart = data.readOffset;
    data.readOffset += 4; // PreviousTagSize0
    const flags = data.readUInt8();
    const tagSize = data.readUInt24BE(); // Equal to length of the tag – 11
    const tsLo = data.readUInt24BE();
    const tsHi = data.readUInt8();
    // clear erroneus streamid
    data.writeOffset = data.readOffset;
    data.writeUInt8(0);
    data.writeUInt16BE(0);
    data.readOffset += 3; // StreamID (always zero)
    const tagStart = data.readOffset;

    if (data.length < tagStart + tagSize) {
      data.readOffset = storedOffset; // rewind
      console.log("cant read whole tag: size " + (tagSize + FLVTagHeaderSize));
      return null;
    }

    const tagData = data.internalBuffer.slice(tagHeaderStart, tagStart + tagSize);
    const tag: IVideoTag = {
      type: 0,
      aacFrameType: 0,
      avcFrameType: 0,
      avcPayloadType: 0,
      size: 0,
      timestamp: 0.0,
      info: {
        audioFormat: 0,
        audioBitRate: 0,
        audioSampleSize: 0,
        audioCodecID: 0,
        audioType: 0
      },
      data: tagData
    }; // seconds

    tag.type = flags & 0x1f;
    tag.timestamp = (tsLo + (tsHi << 24)) / 1000;
    if (tag.type === FLV.SCRIPT) {
      // script
      // do not parse
      console.log("scr");
    } else if (tag.type === FLV.AUDIO) {
      // audio
      const frameFlags = data.readUInt8();
      tag.info.audioFormat = frameFlags >> 4;
      tag.info.audioBitRate = (frameFlags & 0xc) >> 2;
      tag.info.audioSampleSize = (frameFlags & 0x2) >> 1;
      tag.info.audioType = frameFlags & 0x1;
      if (tag.info.audioFormat === FLV.AUDIO_AAC) {
        // aac
        tag.aacFrameType = data.readUInt8();
      }
    } else if (tag.type === FLV.VIDEO) {
      // video
      const frameFlags = data.readUInt8();
      tag.avcFrameType = frameFlags >> 4;
      const codecID = frameFlags & 0xf;

      if (codecID === FLV.VIDEO_AVC) {
        // avc
        tag.avcPayloadType = data.readUInt8();
      } else {
        console.log(tagData);
        throw new Error(`Unsupported video codec: ${codecID}`);
      }
    } else {
      console.log("Unknown FLV tag");
    }

    this.logTag(tag);
    this.saveTag(tag);
    data.readOffset = tagStart + tagSize;
    // console.log(`Tag T:${tag.type} start:${tagStart} size:${tagSize} end:${data.readOffset} dlen:${data.length}`)

    return tag;
  }

  public parseChunks(chunk: Buffer): number {
    const data = new SmartBuffer(chunk);
    // console.log(`Got chunk ${chunkCounter}, ${data.length} bytes`);
    if (this.firstChunk) {
      this.firstChunk = false;
      if (data.length < FLVHeaderSize) {
        console.log("No FLV header found, stopping");
        return 0;
      }
      const magic = data.readUInt32BE();
      if (magic !== 0x464c5601) {
        console.log("No FLV magic found, stopping");
        return 0;
      } else {
        console.log("FLV magic");
      }
      data.readOffset += 5; // uint8 flags == 5; uint32 headerSize == 9
      this.FLVHeader = chunk.slice(0, FLVHeaderSize);
    }

    while (true) {
      const tag = this.readTag(data);
      if (!tag) {
        // console.log('end of chunk');
        break;
      }
    }

    return data.length - data.readOffset; // unprocessed
  }
}

module.exports = {
  FLV,
  FLVDecoder
};
