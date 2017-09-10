/// <reference types="node" />
export declare class SmartBuffer {
    internalBuffer: Buffer;
    readOffset: number;
    writeOffset: number;
    constructor(buffer: Buffer);
    readUInt8(offset?: number): any;
    readUInt24BE(): number;
    readUInt32BE(offset?: number): any;
    writeUInt8(value: number, offset?: number): void;
    writeUInt16BE(value: number, offset?: number): void;
    writeUInt32BE(value: number, offset?: number): void;
    readonly length: number;
    private readNumberValue(func, byteSize, offset?);
    private writeNumberValue(func, byteSize, value, offset?);
}
