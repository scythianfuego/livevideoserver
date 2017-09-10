/// <reference types="node" />
import { EventEmitter } from 'events';
import { SmartBuffer } from '../utils/smartbuffer';
import { VideoTag } from '../interfaces/videotag';
export declare const FLV: {
    SCRIPT: number;
    VIDEO: number;
    VIDEO_AVC: number;
    VIDEO_AVC_KEYFRAME: number;
    VIDEO_AVC_INTERFRAME: number;
    AUDIO: number;
    AUDIO_AAC: number;
    AUDIO_AAC_HEADER: number;
    AUDIO_AAC_RAW: number;
    AUDIO_MP3: number;
    AVC_DECODER_CONFIG: number;
    AVC_VIDEO_DATA: number;
};
export declare class FLVDecoder extends EventEmitter {
    private streamReadyCallback;
    private streamReady;
    private firstChunk;
    private firstPacket;
    private AACHeader;
    private AVCDecoderConfig;
    private FLVScriptHeader;
    private FLVHeader;
    constructor(streamReadyCallback: () => void);
    saveTag(tag: VideoTag): void;
    logTag(tag: VideoTag): void;
    readTag(data: SmartBuffer): VideoTag | null;
    parseChunks(chunk: Buffer): number;
}
