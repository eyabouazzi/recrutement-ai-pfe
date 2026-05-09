const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const { extractCvTextFromBuffer } = require('../utils/cvParser');
const { applyProfilePayload } = require('../utils/profileMutations');

function escapePdfText(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
}

function createSimplePdfBuffer(lines) {
    const content = [
        'BT',
        '/F1 12 Tf',
        '72 720 Td',
        ...lines.map((line, index) => `${index === 0 ? '' : 'T* ' }(${escapePdfText(line)}) Tj`.trim()),
        'ET',
    ].join('\n');
    const compressed = zlib.deflateSync(Buffer.from(content, 'latin1'));
    const header = Buffer.from(
        `%PDF-1.4
1 0 obj
<< /Length ${compressed.length} /Filter /FlateDecode >>
stream
`,
        'latin1'
    );
    const footer = Buffer.from(
        `
endstream
endobj
trailer
<<>>
%%EOF`,
        'latin1'
    );

    return Buffer.concat([header, compressed, footer]);
}

function buildZipBuffer(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    entries.forEach((entry) => {
        const fileNameBuffer = Buffer.from(entry.name, 'utf8');
        const contentBuffer = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content, 'utf8');
        const compressedContent = zlib.deflateRawSync(contentBuffer);

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(8, 8);
        localHeader.writeUInt16LE(0, 10);
        localHeader.writeUInt16LE(0, 12);
        localHeader.writeUInt32LE(0, 14);
        localHeader.writeUInt32LE(compressedContent.length, 18);
        localHeader.writeUInt32LE(contentBuffer.length, 22);
        localHeader.writeUInt16LE(fileNameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);

        localParts.push(localHeader, fileNameBuffer, compressedContent);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(8, 10);
        centralHeader.writeUInt16LE(0, 12);
        centralHeader.writeUInt16LE(0, 14);
        centralHeader.writeUInt32LE(0, 16);
        centralHeader.writeUInt32LE(compressedContent.length, 20);
        centralHeader.writeUInt32LE(contentBuffer.length, 24);
        centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);

        centralParts.push(centralHeader, fileNameBuffer);
        offset += localHeader.length + fileNameBuffer.length + compressedContent.length;
    });

    const centralDirectory = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralDirectory.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirectory, eocd]);
}

function createSimpleDocxBuffer(paragraphs) {
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.map((paragraph) => `<w:p><w:r><w:t>${paragraph}</w:t></w:r></w:p>`).join('')}
  </w:body>
</w:document>`;

    return buildZipBuffer([
        { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8"?><Types></Types>' },
        { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8"?><Relationships></Relationships>' },
        { name: 'word/document.xml', content: documentXml },
    ]);
}

describe('CV analysis pipeline', () => {
    it('extracts readable text from PDF uploads', () => {
        const pdfBuffer = createSimplePdfBuffer([
            'Jane Doe',
            'React Node.js SQL',
            '5 years experience',
        ]);

        const extracted = extractCvTextFromBuffer({
            buffer: pdfBuffer,
            fileName: 'resume.pdf',
            mimeType: 'application/pdf',
        });

        expect(extracted).toContain('Jane Doe');
        expect(extracted).toContain('React Node.js SQL');
        expect(extracted).toContain('5 years experience');
    });

    it('extracts readable text from DOCX uploads', () => {
        const docxBuffer = createSimpleDocxBuffer([
            'Jane Doe',
            'Data Analyst',
            'Python SQL Tableau',
        ]);

        const extracted = extractCvTextFromBuffer({
            buffer: docxBuffer,
            fileName: 'resume.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        expect(extracted).toContain('Jane Doe');
        expect(extracted).toContain('Data Analyst');
        expect(extracted).toContain('Python SQL Tableau');
    });

    it('updates CV text and analysis from the uploaded document instead of stale saved text', async () => {
        const tempPath = path.join(os.tmpdir(), `cv-analysis-${Date.now()}.pdf`);
        await fs.writeFile(tempPath, createSimplePdfBuffer([
            'Jane Doe',
            'React Node.js SQL',
            '5 years experience',
        ]));

        const user = {
            firstName: 'Jane',
            lastName: 'Doe',
            bio: '',
            education: '',
            skills: [],
            preferredSector: '',
            preferredLocation: '',
            preferredJobType: '',
            experienceYears: 5,
            cvUrl: '/uploads/old-cv.pdf',
            cvOriginalName: 'old-cv.pdf',
            cvText: 'OLD STALE CV TEXT',
        };

        try {
            await applyProfilePayload({
                user,
                body: { analyzeCv: 'true' },
                files: {
                    cv: [{
                        path: tempPath,
                        filename: 'fresh-cv.pdf',
                        originalname: 'fresh-cv.pdf',
                        mimetype: 'application/pdf',
                    }],
                },
            });
        } finally {
            await fs.unlink(tempPath).catch(() => {});
        }

        expect(user.cvText).toContain('React Node.js SQL');
        expect(user.cvText).not.toContain('OLD STALE CV TEXT');
        expect(user.cvAnalysis.summary).toContain('CV analyzed from uploaded document.');
        expect(user.cvAnalysis.detectedSkills).toEqual(expect.arrayContaining(['React', 'Node.js', 'SQL']));
    });

    it('clears stale extracted text when a newly uploaded CV cannot be parsed', async () => {
        const tempPath = path.join(os.tmpdir(), `cv-analysis-unreadable-${Date.now()}.pdf`);
        await fs.writeFile(tempPath, Buffer.from([0x00, 0x01, 0x02, 0x03]));

        const user = {
            firstName: 'Jane',
            lastName: 'Doe',
            bio: '',
            education: '',
            skills: [],
            preferredSector: '',
            preferredLocation: '',
            preferredJobType: '',
            experienceYears: 2,
            cvUrl: '/uploads/old-cv.pdf',
            cvOriginalName: 'old-cv.pdf',
            cvText: 'OLD STALE CV TEXT',
        };

        try {
            await applyProfilePayload({
                user,
                body: { analyzeCv: 'true' },
                files: {
                    cv: [{
                        path: tempPath,
                        filename: 'broken-cv.pdf',
                        originalname: 'broken-cv.pdf',
                        mimetype: 'application/pdf',
                    }],
                },
            });
        } finally {
            await fs.unlink(tempPath).catch(() => {});
        }

        expect(user.cvText).toBe('');
        expect(user.cvAnalysis.summary).toContain('CV uploaded but text extraction is incomplete.');
    });
});
