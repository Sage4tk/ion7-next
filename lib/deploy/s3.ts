import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_SITES_BUCKET || "ion7-sites";

export async function uploadSiteToS3(
  domainName: string,
  html: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${domainName}/index.html`,
      Body: html,
      ContentType: "text/html; charset=utf-8",
    }),
  );
}
