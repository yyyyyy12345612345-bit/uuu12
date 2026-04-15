export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(private stream: MediaStream) {}

  start() {
    this.chunks = [];
    // Use high bitrate for better quality
    const options = { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 // 5Mbps
    };
    
    // Check supported types
    const types = ['video/webm;codecs=vp9', 'video/webm;codecs=h264', 'video/webm', 'video/mp4'];
    const supportedType = types.find(t => MediaRecorder.isTypeSupported(t));

    this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: supportedType,
        videoBitsPerSecond: 8000000
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return resolve(new Blob());
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'video/webm' });
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }
}
