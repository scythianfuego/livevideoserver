declare const EventEmitter: any;
declare const SmartBuffer: any;
declare let dataRemaining: any;
declare const FLV: {
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
declare const FLVHeaderSize = 9;
declare const FLVTagHeaderSize = 17;
declare class FLVDecoder extends EventEmitter {
    constructor(streamReadyCallback: any);
    saveTag(tag: any): void;
    logTag(tag: any): void;
    readTag(data: any): {
        type: number;
        aacFrameType: number;
        avcFrameType: number;
        avcPayloadType: number;
        size: number;
        timestamp: number;
        info: {
            audioFormat: number;
            audioBitRate: number;
            audioSampleSize: number;
            audioCodecID: number;
        };
        data: null;
    } | null;
    parseChunks(chunk: any): number | undefined;
}
