import { readFile } from "node:fs/promises";

const toBuffer = (input) => {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  return null;
};

const parsePng = (buffer) => {
  if (buffer.length < 24) return undefined;
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return undefined;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    type: "png",
  };
};

const parseGif = (buffer) => {
  if (buffer.length < 10) return undefined;
  const signature = buffer.subarray(0, 6).toString("ascii");
  if (signature !== "GIF87a" && signature !== "GIF89a") return undefined;
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
    type: "gif",
  };
};

const parseJpeg = (buffer) => {
  if (buffer.length < 4) return undefined;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return undefined;

  let offset = 2;
  while (offset + 1 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (offset + 4 > buffer.length) break;

    const size = buffer.readUInt16BE(offset + 2);
    if (size < 2) break;

    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof && offset + 9 < buffer.length) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
        type: "jpg",
      };
    }

    offset += 2 + size;
  }

  return undefined;
};

const parseWebp = (buffer) => {
  if (buffer.length < 30) return undefined;
  if (buffer.subarray(0, 4).toString("ascii") !== "RIFF") return undefined;
  if (buffer.subarray(8, 12).toString("ascii") !== "WEBP") return undefined;

  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
      type: "webp",
    };
  }

  if (chunk === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26),
      height: buffer.readUInt16LE(28),
      type: "webp",
    };
  }

  if (chunk === "VP8L" && buffer.length >= 25) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height, type: "webp" };
  }

  return undefined;
};

export function imageSize(input) {
  const buffer = toBuffer(input);
  if (!buffer) return undefined;
  return parsePng(buffer) ?? parseGif(buffer) ?? parseJpeg(buffer) ?? parseWebp(buffer);
}

export async function imageSizeFromFile(filePath) {
  const buffer = await readFile(filePath);
  return imageSize(buffer);
}

export function disableTypes() {}

export function setConcurrency() {}

export default imageSize;
