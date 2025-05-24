import zlib from 'zlib';

/**
 * Helper function to gzip encode data and return as base64
 * @param {Object} data - Data to encode
 * @returns {string} Base64 encoded gzip data
 */
export const gzipEncodeToBase64 = (data) => {
    const jsonString = JSON.stringify(data);
    const compressed = zlib.gzipSync(jsonString);
    return compressed.toString('base64');
}

/**
 * Helper function to gzip encode data and return as hex
 * @param {Object} data - Data to encode
 * @returns {string} Hex encoded gzip data
 */
export const gzipEncodeToHex = (data) => {
    const jsonString = JSON.stringify(data);
    const compressed = zlib.gzipSync(jsonString);
    return compressed.toString('hex');
}

/**
 * Get compression statistics for given data
 * @param {Object} data - Original data
 * @returns {Object} Compression stats
 */
export const getCompressionStats= (data) => {
    const jsonString = JSON.stringify(data);
    const originalSize = jsonString.length;
    const compressedBuffer = zlib.gzipSync(jsonString);
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    return {
        originalSize,
        compressedSize,
        compressionRatio: `${compressionRatio}%`,
        spaceSaved: `${originalSize - compressedSize} bytes`,
        compressedBuffer
    };
}

/**
 * Create a standardized encoded response
 * @param {Object} originalData - Original data to encode
 * @param {string} message - Custom message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Encoded response object
 */
export const createEncodedResponse = (originalData, message = 'Data has been gzip encoded', statusCode = 200) => {
    const stats = getCompressionStats(originalData);

    return {
        statusCode,
        contentEncoding: 'gzip',
        stats: {
            originalSize: stats.originalSize,
            compressedSize: stats.compressedSize,
            compressionRatio: stats.compressionRatio,
            spaceSaved: stats.spaceSaved
        },
        encodedData: {
            base64: stats.compressedBuffer.toString('base64'),
            hex: stats.compressedBuffer.toString('hex')
        },
        message,
        success: true
    };
}

/**
 * Middleware to automatically gzip encode response data
 * Usage: app.get('/api/route', gzipResponseMiddleware, (req, res) => { ... })
 */
export const gzipResponseMiddleware = (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to encode response
    res.json = function (data) {
        const encodedResponse = createEncodedResponse(
            data,
            'Response automatically encoded with gzip'
        );

        // Call original json method with encoded data
        originalJson.call(this, encodedResponse);
    };

    next();
}

/**
 * Decode gzip data from base64 or hex format
 * @param {string} encodedData - Encoded data string
 * @param {string} format - Format of encoded data ('base64' or 'hex')
 * @returns {Object} Decoded original data
 */
export const decodeGzipData = (encodedData, format = 'base64') => {
    let buffer;

    if (format === 'base64') {
        buffer = Buffer.from(encodedData, 'base64');
    } else if (format === 'hex') {
        buffer = Buffer.from(encodedData, 'hex');
    } else {
        throw new Error('Invalid format. Use "base64" or "hex"');
    }

    const decompressed = zlib.gunzipSync(buffer);
    return JSON.parse(decompressed.toString());
}