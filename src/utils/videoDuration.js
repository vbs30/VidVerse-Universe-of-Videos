import ffmpeg from "fluent-ffmpeg";

// Set ffmpeg and ffprobe paths (update these with your actual paths)
ffmpeg.setFfprobePath('D:/Ffmpeg/ffprobe.exe');
ffmpeg.setFfmpegPath('D:/Ffmpeg/ffmpeg.exe');

// Function to get video duration in HH:MM:SS format
const getVideoDuration = (videoPath) => {
    return new Promise((resolve, reject) => {
        // Use ffprobe to get video metadata
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                // Reject promise if there's an error
                reject(err);
            } else {
                // Get total duration in seconds and round down
                const totalSeconds = Math.floor(metadata.format.duration);

                // Calculate hours, minutes, and seconds
                const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
                const seconds = String(totalSeconds % 60).padStart(2, '0');

                // Resolve promise with formatted duration
                resolve(`${hours}:${minutes}:${seconds}`);
            }
        });
    });
};

// Export the function for use in other files
export { getVideoDuration };
