export interface IVideoTag {
  type: number;
  aacFrameType: number;
  avcFrameType: number;
  avcPayloadType: number;
  size: number;
  timestamp: number; // seconds
  info: {
    audioFormat: number;
    audioBitRate: number;
    audioSampleSize: number;
    audioType: number;
    audioCodecID: number;
  };
  data: Buffer;
}
