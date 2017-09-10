// derived from https://github.com/JoshGlazebrook/smart-buffer
// range checks excluded

type BufferReadFunction = (offset: number, noAssert?: boolean) => number;
type BufferWriteFunction = (value: number, offset: number, noAssert?: boolean) => number;

export class SmartBuffer {
  public internalBuffer: Buffer;
  public readOffset: number = 0;
  public writeOffset: number = 0;

  constructor(buffer: Buffer) {
    this.internalBuffer = buffer;
  }

  public readUInt8(offset?: number) {
    return this.readNumberValue(Buffer.prototype.readUInt8, 1, offset);
  }

  public readUInt24BE() {
    const value = this.internalBuffer.readIntBE(this.readOffset, 3);
    this.readOffset += 3;
    return value;
  }

  public readUInt32BE(offset?: number) {
    return this.readNumberValue(Buffer.prototype.readUInt32BE, 4, offset);
  }

  public writeUInt8(value: number, offset?: number) {
    return this.writeNumberValue(Buffer.prototype.writeUInt8, 1, value, offset);
  }

  public writeUInt16BE(value: number, offset?: number) {
    return this.writeNumberValue(Buffer.prototype.writeUInt16BE, 2, value, offset);
  }

  public writeUInt32BE(value: number, offset?: number) {
    return this.writeNumberValue(Buffer.prototype.writeUInt32BE, 4, value, offset);
  }

  public get length() {
    return this.internalBuffer.length;
  }

  private readNumberValue(func: BufferReadFunction, byteSize: number, offset?: number) {
    const offsetVal = typeof offset === "number" ? offset : this.readOffset;
    const value = func.call(this.internalBuffer, offsetVal);
    this.readOffset = offsetVal + byteSize;
    return value;
  }

  private writeNumberValue(
    func: BufferWriteFunction,
    byteSize: number,
    value: number,
    offset?: number
  ) {
    const offsetVal = typeof offset === "number" ? offset : this.writeOffset;
    func.call(this.internalBuffer, value, offsetVal);
    this.writeOffset = offsetVal + byteSize;
  }
}
