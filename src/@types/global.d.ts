declare global {
  interface Buffer {
    length: number;
    write(string: string, offset?: number, length?: number, encoding?: string): number;
    toString(encoding?: string, start?: number, end?: number): string;
    slice(start?: number, end?: number): Buffer;
    copy(targetBuffer: Buffer, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
    concat(list: Buffer[], totalLength?: number): Buffer;
    fill(value: string | number | Buffer, offset?: number, end?: number): Buffer;
  }

  var Buffer: {
    new(str?: string, encoding?: string): Buffer;
    new(size: number): Buffer;
    from(array: number[]): Buffer;
    from(arrayBuffer: ArrayBuffer, byteOffset?: number, length?: number): Buffer;
    from(str: string, encoding?: string): Buffer;
    alloc(size: number, fill?: string | Buffer | number, encoding?: string): Buffer;
    allocUnsafe(size: number): Buffer;
    allocUnsafeSlow(size: number): Buffer;
    byteLength(string: string, encoding?: string): number;
    isBuffer(obj: any): obj is Buffer;
    compare(buf1: Buffer, buf2: Buffer): number;
    concat(list: Buffer[], totalLength?: number): Buffer;
  };

  type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';

  namespace NodeJS {
    interface ReadWriteStream {
      read(size?: number): Buffer | string;
      write(buffer: Buffer | string, cb?: Function): boolean;
      end(buffer?: Buffer | string, cb?: Function): void;
    }
  }
}

export {};
