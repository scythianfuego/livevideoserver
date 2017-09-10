"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const smartbuffer_1 = require("../utils/smartbuffer");
exports.FLV = {
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
class FLVDecoder extends events_1.EventEmitter {
    constructor(streamReadyCallback) {
        super();
        this.streamReady = false;
        this.firstChunk = true;
        this.streamReadyCallback = streamReadyCallback;
    }
    saveTag(tag) {
        if (tag.type === exports.FLV.SCRIPT) {
            this.FLVScriptHeader = tag;
        }
        else if (tag.type === exports.FLV.VIDEO && tag.avcPayloadType === exports.FLV.AVC_DECODER_CONFIG) {
            this.AVCDecoderConfig = tag;
        }
        else if (tag.type === exports.FLV.AUDIO && tag.aacFrameType === exports.FLV.AUDIO_AAC_HEADER) {
            this.AACHeader = tag;
        }
        if (this.FLVHeader &&
            this.AVCDecoderConfig &&
            this.AACHeader &&
            this.FLVScriptHeader &&
            !this.streamReady) {
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
            this.emit('frame', tag);
        }
    }
    logTag(tag) {
        let audioFormatName = tag.info.audioFormat == 2 ? 'MP3' : tag.info.audioFormat == 10 ? 'AAC' : 'Other';
        audioFormatName += ' ' + ['5.5Khz', '11Khz', '22Khz', '44Khz'][tag.info.audioBitRate];
        audioFormatName += ' ' + ['8bit', '16bit'][tag.info.audioSampleSize];
        audioFormatName += ' ' + ['Mono', 'Stereo'][tag.info.audioType];
        const types = ['', 'key', 'inter', 'disposable', 'generated', 'command'];
        const codecs = ['', '', 'H.263', 'Screen', 'VP6', 'VP6+alpha', 'Screen v2', 'AVC'];
        let avcOpts = '';
        avcOpts += tag.avcPayloadType === exports.FLV.AVC_DECODER_CONFIG ? ' AVCDecoderConfig' : '';
        avcOpts += tag.avcPayloadType === exports.FLV.AVC_VIDEO_DATA ? ' AVCVideoData' : '';
        audioFormatName += tag.aacFrameType === exports.FLV.AUDIO_AAC_HEADER ? ' (aac header)' : ' (raw)';
        if (tag.type === exports.FLV.SCRIPT) {
            console.log(`[${tag.timestamp.toFixed(3)}] script frame`);
        }
        else if (tag.type === exports.FLV.AUDIO) {
            console.log(`[${tag.timestamp}] audio frame ${audioFormatName}`);
        }
        else if (tag.type === exports.FLV.VIDEO) {
            console.log(`[${tag.timestamp}] video frame ${codecs[exports.FLV.VIDEO_AVC]} ${types[tag.avcFrameType]} ${avcOpts}`);
        }
    }
    readTag(data) {
        const storedOffset = data.readOffset;
        if (data.length < data.readOffset + FLVTagHeaderSize) {
            console.log('cant read tag');
            return null;
        }
        const tagHeaderStart = data.readOffset;
        data.readOffset += 4;
        const flags = data.readUInt8();
        const tagSize = data.readUInt24BE();
        const tsLo = data.readUInt24BE();
        const tsHi = data.readUInt8();
        data.writeOffset = data.readOffset;
        data.writeUInt8(0);
        data.writeUInt16BE(0);
        data.readOffset += 3;
        const tagStart = data.readOffset;
        if (data.length < tagStart + tagSize) {
            data.readOffset = storedOffset;
            return null;
        }
        const tagData = data.internalBuffer.slice(tagHeaderStart, tagStart + tagSize);
        const tag = {
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
        };
        tag.type = flags & 0x1f;
        tag.timestamp = (tsLo + (tsHi << 24)) / 1000;
        if (tag.type === exports.FLV.SCRIPT) {
            console.log('scr');
        }
        else if (tag.type === exports.FLV.AUDIO) {
            const frameFlags = data.readUInt8();
            tag.info.audioFormat = frameFlags >> 4;
            tag.info.audioBitRate = (frameFlags & 0xc) >> 2;
            tag.info.audioSampleSize = (frameFlags & 0x2) >> 1;
            tag.info.audioType = frameFlags & 0x1;
            if (tag.info.audioFormat == exports.FLV.AUDIO_AAC) {
                tag.aacFrameType = data.readUInt8();
            }
        }
        else if (tag.type === exports.FLV.VIDEO) {
            const frameFlags = data.readUInt8();
            tag.avcFrameType = frameFlags >> 4;
            const codecID = frameFlags & 0xf;
            if (codecID == exports.FLV.VIDEO_AVC) {
                tag.avcPayloadType = data.readUInt8();
            }
            else {
                throw new Error(`Unsupported video codec: ${codecID}`);
            }
        }
        else {
            console.log('Unknown FLV tag');
        }
        this.saveTag(tag);
        data.readOffset = tagStart + tagSize;
        return tag;
    }
    parseChunks(chunk) {
        const data = new smartbuffer_1.SmartBuffer(chunk);
        if (this.firstChunk) {
            this.firstChunk = false;
            if (data.length < FLVHeaderSize) {
                console.log('No FLV header found, stopping');
                return 0;
            }
            const magic = data.readUInt32BE();
            if (magic !== 0x464c5601) {
                console.log('No FLV magic found, stopping');
                return 0;
            }
            else {
                console.log('FLV magic');
            }
            data.readOffset += 5;
            this.FLVHeader = chunk.slice(0, FLVHeaderSize);
        }
        while (true) {
            let tag = this.readTag(data);
            if (!tag) {
                break;
            }
        }
        return data.length - data.readOffset;
    }
}
exports.FLVDecoder = FLVDecoder;
module.exports = {
    FLV: exports.FLV,
    FLVDecoder
};
//# sourceMappingURL=flvdecoder.js.map