const fs = require('fs/promises');
const path = require('path');
const zlib = require('zlib');

const MAX_EXTRACTED_TEXT_LENGTH = 20000;
const DOCX_TEXT_ENTRY_PATTERN = /^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/i;

function normalizeExtractedText(value) {
    return String(value || '')
        .replace(/\u0000/g, ' ')
        .replace(/\r\n?/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t\f\v]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

function decodeXmlEntities(value) {
    return String(value || '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function decodePdfLiteralString(value) {
    let output = '';

    for (let index = 0; index < value.length; index += 1) {
        const current = value[index];
        if (current !== '\\') {
            output += current;
            continue;
        }

        const next = value[index + 1];
        if (next === undefined) {
            break;
        }

        if (/[0-7]/.test(next)) {
            let octal = next;
            let cursor = index + 2;
            while (cursor < value.length && octal.length < 3 && /[0-7]/.test(value[cursor])) {
                octal += value[cursor];
                cursor += 1;
            }
            output += String.fromCharCode(parseInt(octal, 8));
            index = cursor - 1;
            continue;
        }

        const escapeMap = {
            n: '\n',
            r: '\r',
            t: '\t',
            b: '\b',
            f: '\f',
            '(': '(',
            ')': ')',
            '\\': '\\',
        };

        output += escapeMap[next] !== undefined ? escapeMap[next] : next;
        index += 1;
    }

    return output;
}

function decodePdfHexString(value) {
    const hex = String(value || '').replace(/\s+/g, '');
    if (!hex) {
        return '';
    }

    const normalizedHex = hex.length % 2 === 0 ? hex : `${hex}0`;
    const buffer = Buffer.from(normalizedHex, 'hex');

    if (buffer.length >= 2 && (
        (buffer[0] === 0xfe && buffer[1] === 0xff) ||
        (buffer[0] === 0xff && buffer[1] === 0xfe)
    )) {
        let text = '';
        const isLittleEndian = buffer[0] === 0xff;
        for (let index = 2; index + 1 < buffer.length; index += 2) {
            const code = isLittleEndian
                ? buffer.readUInt16LE(index)
                : buffer.readUInt16BE(index);
            text += String.fromCharCode(code);
        }
        return text;
    }

    return buffer.toString('latin1');
}

function readPdfLiteralString(source, startIndex) {
    let depth = 1;
    let cursor = startIndex + 1;
    let raw = '';

    while (cursor < source.length) {
        const current = source[cursor];
        if (current === '\\') {
            raw += current;
            cursor += 1;
            if (cursor < source.length) {
                raw += source[cursor];
                cursor += 1;
            }
            continue;
        }

        if (current === '(') {
            depth += 1;
            raw += current;
            cursor += 1;
            continue;
        }

        if (current === ')') {
            depth -= 1;
            if (depth === 0) {
                return {
                    value: decodePdfLiteralString(raw),
                    endIndex: cursor + 1,
                };
            }
            raw += current;
            cursor += 1;
            continue;
        }

        raw += current;
        cursor += 1;
    }

    return null;
}

function tokenizePdfContent(source) {
    const tokens = [];
    let index = 0;

    while (index < source.length) {
        const current = source[index];

        if (/\s/.test(current)) {
            index += 1;
            continue;
        }

        if (current === '(') {
            const token = readPdfLiteralString(source, index);
            if (!token) {
                break;
            }
            tokens.push({ type: 'string', value: token.value });
            index = token.endIndex;
            continue;
        }

        if (current === '<' && source[index + 1] !== '<') {
            const endIndex = source.indexOf('>', index + 1);
            if (endIndex === -1) {
                break;
            }
            tokens.push({
                type: 'string',
                value: decodePdfHexString(source.slice(index + 1, endIndex)),
            });
            index = endIndex + 1;
            continue;
        }

        if (current === '[' || current === ']') {
            tokens.push(current);
            index += 1;
            continue;
        }

        let endIndex = index + 1;
        while (
            endIndex < source.length &&
            !/\s/.test(source[endIndex]) &&
            !['[', ']', '(', '<'].includes(source[endIndex])
        ) {
            endIndex += 1;
        }

        tokens.push(source.slice(index, endIndex));
        index = endIndex;
    }

    return tokens;
}

function extractPdfTextFromContent(content) {
    const tokens = tokenizePdfContent(content);
    const parts = [];

    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];

        if (token === '[') {
            const arrayStrings = [];
            let cursor = index + 1;
            while (cursor < tokens.length && tokens[cursor] !== ']') {
                if (tokens[cursor] && typeof tokens[cursor] === 'object' && tokens[cursor].type === 'string') {
                    arrayStrings.push(tokens[cursor].value);
                }
                cursor += 1;
            }

            const nextToken = tokens[cursor + 1];
            if (arrayStrings.length > 0 && nextToken === 'TJ') {
                parts.push(arrayStrings.join(' '));
            }

            index = cursor;
            continue;
        }

        if (token && typeof token === 'object' && token.type === 'string') {
            const operator = tokens[index + 1];
            if (operator === 'Tj' || operator === "'" || operator === '"') {
                parts.push(token.value);
            }
        }
    }

    return normalizeExtractedText(parts.join('\n'));
}

function extractPdfText(buffer) {
    const source = buffer.toString('latin1');
    const streamPattern = /stream\r?\n/g;
    const extractedParts = [];
    let match;

    while ((match = streamPattern.exec(source)) !== null) {
        const streamStart = match.index + match[0].length;
        const endIndex = source.indexOf('endstream', streamStart);
        if (endIndex === -1) {
            continue;
        }

        let streamBuffer = buffer.subarray(streamStart, endIndex);
        while (streamBuffer.length > 0 && (streamBuffer[0] === 0x0a || streamBuffer[0] === 0x0d)) {
            streamBuffer = streamBuffer.subarray(1);
        }
        while (
            streamBuffer.length > 0 &&
            (streamBuffer[streamBuffer.length - 1] === 0x0a || streamBuffer[streamBuffer.length - 1] === 0x0d)
        ) {
            streamBuffer = streamBuffer.subarray(0, streamBuffer.length - 1);
        }

        const dictionary = source.slice(Math.max(0, match.index - 300), match.index);
        let decodedStream = '';

        if (/\/FlateDecode\b/.test(dictionary)) {
            try {
                decodedStream = zlib.inflateSync(streamBuffer).toString('latin1');
            } catch (error) {
                decodedStream = '';
            }
        } else {
            decodedStream = streamBuffer.toString('latin1');
        }

        const text = extractPdfTextFromContent(decodedStream);
        if (text) {
            extractedParts.push(text);
        }

        streamPattern.lastIndex = endIndex + 'endstream'.length;
    }

    return normalizeExtractedText(extractedParts.join('\n\n'));
}

function stripRtfMarkup(source) {
    return String(source || '')
        .replace(/\\par[d]?/gi, '\n')
        .replace(/\\line/gi, '\n')
        .replace(/\\tab/gi, '\t')
        .replace(/\\u(-?\d+)\??/gi, (_, code) => {
            const parsed = Number(code);
            if (!Number.isFinite(parsed)) {
                return '';
            }
            const normalized = parsed < 0 ? 65536 + parsed : parsed;
            return String.fromCharCode(normalized);
        })
        .replace(/\\'([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\[a-z]+-?\d* ?/gi, ' ')
        .replace(/\\[^a-z0-9]/gi, ' ')
        .replace(/[{}]/g, ' ');
}

function extractRtfText(buffer) {
    return normalizeExtractedText(stripRtfMarkup(buffer.toString('latin1')));
}

function findZipEndOfCentralDirectory(buffer) {
    for (let index = buffer.length - 22; index >= 0; index -= 1) {
        if (buffer.readUInt32LE(index) === 0x06054b50) {
            return index;
        }
    }
    return -1;
}

function readZipEntries(buffer) {
    const eocdOffset = findZipEndOfCentralDirectory(buffer);
    if (eocdOffset === -1) {
        return [];
    }

    const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
    const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
    const entries = [];
    let cursor = centralDirectoryOffset;
    const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

    while (cursor + 46 <= centralDirectoryEnd && buffer.readUInt32LE(cursor) === 0x02014b50) {
        const compressionMethod = buffer.readUInt16LE(cursor + 10);
        const compressedSize = buffer.readUInt32LE(cursor + 20);
        const fileNameLength = buffer.readUInt16LE(cursor + 28);
        const extraLength = buffer.readUInt16LE(cursor + 30);
        const commentLength = buffer.readUInt16LE(cursor + 32);
        const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
        const fileName = buffer.toString('utf8', cursor + 46, cursor + 46 + fileNameLength);

        if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
            cursor += 46 + fileNameLength + extraLength + commentLength;
            continue;
        }

        const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
        const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
        const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
        const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);

        let content = null;
        if (compressionMethod === 0) {
            content = compressedData;
        } else if (compressionMethod === 8) {
            try {
                content = zlib.inflateRawSync(compressedData);
            } catch (error) {
                content = null;
            }
        }

        if (content) {
            entries.push({ name: fileName, content });
        }

        cursor += 46 + fileNameLength + extraLength + commentLength;
    }

    return entries;
}

function extractDocxXmlText(xml) {
    return normalizeExtractedText(
        decodeXmlEntities(String(xml || ''))
            .replace(/<w:tab[^>]*\/>/gi, '\t')
            .replace(/<w:(?:br|cr)[^>]*\/>/gi, '\n')
            .replace(/<\/w:p>/gi, '\n')
            .replace(/<\/w:tr>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
    );
}

function extractDocxText(buffer) {
    try {
        const entries = readZipEntries(buffer)
            .filter((entry) => DOCX_TEXT_ENTRY_PATTERN.test(entry.name))
            .sort((left, right) => left.name.localeCompare(right.name));

        return normalizeExtractedText(
            entries
                .map((entry) => extractDocxXmlText(entry.content.toString('utf8')))
                .filter(Boolean)
                .join('\n\n')
        );
    } catch (error) {
        return '';
    }
}

function extractPlainText(buffer) {
    return normalizeExtractedText(buffer.toString('utf8'));
}

function extractCvTextFromBuffer({ buffer, fileName = '', mimeType = '' }) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
        return '';
    }

    const ext = path.extname(fileName || '').toLowerCase();
    const mime = String(mimeType || '').toLowerCase();

    if (
        mime.startsWith('text/') ||
        ['.txt', '.md', '.csv', '.json'].includes(ext)
    ) {
        return extractPlainText(buffer);
    }

    if (ext === '.rtf' || mime === 'application/rtf' || mime === 'text/rtf') {
        return extractRtfText(buffer);
    }

    if (ext === '.docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return extractDocxText(buffer);
    }

    if (ext === '.pdf' || mime === 'application/pdf') {
        return extractPdfText(buffer);
    }

    return '';
}

async function extractCvTextFromFile(file) {
    if (!file?.path) {
        return '';
    }

    try {
        const buffer = await fs.readFile(file.path);
        return extractCvTextFromBuffer({
            buffer,
            fileName: file.originalname || file.filename || '',
            mimeType: file.mimetype || '',
        });
    } catch (error) {
        return '';
    }
}

module.exports = {
    extractCvTextFromBuffer,
    extractCvTextFromFile,
    normalizeExtractedText,
};
