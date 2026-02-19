import {
  CloudFrontClient,
  CreateDistributionCommand,
  CreateInvalidationCommand,
  GetDistributionCommand,
  UpdateDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import {
  ACMClient,
  RequestCertificateCommand,
  DescribeCertificateCommand,
} from "@aws-sdk/client-acm";

const cf = new CloudFrontClient({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ACM must be in us-east-1 for CloudFront
const acm = new ACMClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_SITES_BUCKET || "ion7-sites";
const REGION = process.env.AWS_REGION || "eu-west-1";

async function requestCertificate(
  domainName: string,
): Promise<string> {
  const result = await acm.send(
    new RequestCertificateCommand({
      DomainName: `www.${domainName}`,
      ValidationMethod: "DNS",
    }),
  );
  return result.CertificateArn!;
}

export async function getCertificateValidationRecord(
  certArn: string,
): Promise<{
  name: string;
  value: string;
} | null> {
  const result = await acm.send(
    new DescribeCertificateCommand({ CertificateArn: certArn }),
  );
  const options =
    result.Certificate?.DomainValidationOptions?.[0]?.ResourceRecord;
  if (!options) return null;
  return { name: options.Name!, value: options.Value! };
}

export async function ensureDistribution(
  domainName: string,
  existingDistId?: string | null,
  existingCertArn?: string | null,
): Promise<{
  distributionId: string;
  cloudfrontDomain: string;
  certArn: string;
}> {
  // If distribution already exists, return it
  if (existingDistId) {
    const dist = await cf.send(
      new GetDistributionCommand({ Id: existingDistId }),
    );
    return {
      distributionId: existingDistId,
      cloudfrontDomain: dist.Distribution!.DomainName!,
      certArn: existingCertArn || "",
    };
  }

  // Request ACM certificate
  const certArn = await requestCertificate(domainName);

  // Create CloudFront distribution
  const originDomain = `${BUCKET}.s3.${REGION}.amazonaws.com`;
  const callerRef = `${domainName}-${Date.now()}`;

  const result = await cf.send(
    new CreateDistributionCommand({
      DistributionConfig: {
        CallerReference: callerRef,
        Comment: `Site for www.${domainName}`,
        Enabled: true,
        Aliases: {
          Quantity: 1,
          Items: [`www.${domainName}`],
        },
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: `S3-${domainName}`,
              DomainName: originDomain,
              OriginPath: `/${domainName}`,
              S3OriginConfig: {
                OriginAccessIdentity: "",
              },
            },
          ],
        },
        DefaultCacheBehavior: {
          TargetOriginId: `S3-${domainName}`,
          ViewerProtocolPolicy: "redirect-to-https",
          AllowedMethods: {
            Quantity: 2,
            Items: ["GET", "HEAD"],
          },
          ForwardedValues: {
            QueryString: false,
            Cookies: { Forward: "none" },
          },
          MinTTL: 0,
          DefaultTTL: 86400,
          MaxTTL: 31536000,
          Compress: true,
        },
        DefaultRootObject: "index.html",
        ViewerCertificate: {
          ACMCertificateArn: certArn,
          SSLSupportMethod: "sni-only",
          MinimumProtocolVersion: "TLSv1.2_2021",
        },
        HttpVersion: "http2",
        PriceClass: "PriceClass_100",
      },
    }),
  );

  return {
    distributionId: result.Distribution!.Id!,
    cloudfrontDomain: result.Distribution!.DomainName!,
    certArn,
  };
}

export async function disableDistribution(distributionId: string): Promise<void> {
  const result = await cf.send(new GetDistributionCommand({ Id: distributionId }));
  const config = result.Distribution?.DistributionConfig;
  const etag = result.ETag;

  if (!config || !etag || config.Enabled === false) return; // Already disabled

  await cf.send(
    new UpdateDistributionCommand({
      Id: distributionId,
      IfMatch: etag,
      DistributionConfig: { ...config, Enabled: false },
    }),
  );
}

export async function invalidateCache(
  distributionId: string,
): Promise<void> {
  await cf.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `invalidate-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: ["/*"],
        },
      },
    }),
  );
}
