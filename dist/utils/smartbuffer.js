"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SmartBuffer {
    constructor(buffer) {
        this.readOffset = 0;
        this.writeOffset = 0;
        this.internalBuffer = buffer;
    }
    readUInt8(offset) {
        return this.readNumberValue(Buffer.prototype.readUInt8, 1, offset);
    }
    readUInt24BE() {
        let value = this.readUInt32BE();
        this.readOffset -= 1;
        return (value & 0xffffff00) >> 8;
    }
    readUInt32BE(offset) {
        return this.readNumberValue(Buffer.prototype.readUInt32BE, 4, offset);
    }
    writeUInt8(value, offset) {
        return this.writeNumberValue(Buffer.prototype.writeUInt8, 1, value, offset);
    }
    writeUInt16BE(value, offset) {
        return this.writeNumberValue(Buffer.prototype.writeUInt16BE, 2, value, offset);
    }
    writeUInt32BE(value, offset) {
        return this.writeNumberValue(Buffer.prototype.writeUInt32BE, 4, value, offset);
    }
    get length() {
        return this.internalBuffer.length;
    }
    readNumberValue(func, byteSize, offset) {
        const offsetVal = typeof offset === 'number' ? offset : this.readOffset;
        const value = func.call(this.internalBuffer, offsetVal);
        this.readOffset = offsetVal + byteSize;
        return value;
    }
    writeNumberValue(func, byteSize, value, offset) {
        const offsetVal = typeof offset === 'number' ? offset : this.writeOffset;
        func.call(this.internalBuffer, value, offsetVal);
        this.writeOffset = offsetVal + byteSize;
    }
}
exports.SmartBuffer = SmartBuffer;
//# sourceMappingURL=smartbuffer.js.map