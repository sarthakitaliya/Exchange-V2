import { decode, encode } from "@msgpack/msgpack";
import s3Client from "../utils/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { snapshot } from "@ex/shared";

export class SnapshotManager {
  private bucketName: string;
  private key: string;
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(key: string, bucketName: string) {
    this.key = `${key}/latest`;
    this.bucketName = bucketName;
  }

  async save(snapshot: any) {
    const encoded = encode({...snapshot, timestamp: Date.now()});
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: this.key,
        Body: Buffer.from(encoded),
        Metadata: { timestamp: Date.now().toString() },
      })
    );
  }

  async startAutoSave(getSnapshot: () => any, intervalMs: number = 10000) {
    if (this.interval) return;

    console.log("Starting auto-save");
    
    this.interval = setInterval(async () => {
      try {
        const snapshot = getSnapshot();
        await this.save(snapshot);
      } catch (error) {
        console.error("Snapshot save error:", error);
      }
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.interval) clearInterval(this.interval);
  }

  async load(): Promise<snapshot | undefined> {
    try {
      const data = await s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: this.key,
        })
      );
      const buffer = await this.streamToBuffer(data.Body);
      return decode(buffer) as snapshot;
    } catch (error) {
      console.error("Error loading snapshot:", error);
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }
}
