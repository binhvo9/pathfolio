import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 is S3-compatible but presigned URLs need SigV4 signing — unlike
// gemini.ts's plain fetch, that's worth pulling in the official SDK for
// rather than hand-rolling. docs/specs/07-insight-ai.md's Export
// behavior: signed URL expires after 24h (NFR-SEC-3), not a permanent
// public link.

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;
const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;

export async function uploadReportPdf(key: string, pdf: Buffer): Promise<string> {
  await client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: pdf, ContentType: "application/pdf" })
  );
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
