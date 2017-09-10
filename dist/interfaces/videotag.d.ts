/// <reference types="node" />
export interface VideoTag {
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
        audioType: number;
        audioCodecID: number;
    };
    data: Buffer;
}
