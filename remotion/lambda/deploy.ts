/**
 * Deploy Remotion Lambda — sets up S3 bucket, deploys the site, and deploys the Lambda function.
 *
 * Usage:
 *   npx tsx remotion/lambda/deploy.ts
 *
 * Required env vars:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *
 * Optional env vars:
 *   REMOTION_AWS_REGION (default: us-east-1)
 *   REMOTION_LAMBDA_MEMORY (default: 2048)
 *   REMOTION_LAMBDA_TIMEOUT (default: 120)
 *   REMOTION_LAMBDA_DISK (default: 2048)
 */

import { deploySite, getOrCreateBucket, deployFunction, getFunctions } from "@remotion/lambda";
import path from "path";

const REGION = (process.env.REMOTION_AWS_REGION ?? "us-east-1") as "us-east-1";
const MEMORY = Number(process.env.REMOTION_LAMBDA_MEMORY ?? 2048);
const TIMEOUT = Number(process.env.REMOTION_LAMBDA_TIMEOUT ?? 120);
const DISK = Number(process.env.REMOTION_LAMBDA_DISK ?? 2048);

async function deploy() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
    process.exit(1);
  }

  console.log(`Deploying Remotion Lambda to ${REGION}...`);
  console.log(`  Memory: ${MEMORY}MB, Timeout: ${TIMEOUT}s, Disk: ${DISK}MB`);

  // Step 1: Get or create the S3 bucket
  console.log("\n1. Ensuring S3 bucket exists...");
  const { bucketName, alreadyExisted } = await getOrCreateBucket({ region: REGION });
  console.log(`   Bucket: ${bucketName} (${alreadyExisted ? "already existed" : "created"})`);

  // Step 2: Deploy the Remotion site (bundle + upload to S3)
  console.log("\n2. Deploying site to S3...");
  const entryPoint = path.resolve(__dirname, "..", "index.ts");

  const { serveUrl } = await deploySite({
    entryPoint,
    bucketName,
    region: REGION,
    options: {
      onBundleProgress: (progress) => {
        if (progress % 25 === 0) {
          console.log(`   Bundle progress: ${progress}%`);
        }
      },
      onUploadProgress: ({ totalFiles, filesUploaded }) => {
        if (filesUploaded % 50 === 0 || filesUploaded === totalFiles) {
          console.log(`   Upload progress: ${filesUploaded}/${totalFiles} files`);
        }
      },
    },
  });
  console.log(`   Serve URL: ${serveUrl}`);

  // Step 3: Deploy the Lambda function (or find existing compatible one)
  console.log("\n3. Checking for existing compatible Lambda functions...");
  const existingFunctions = await getFunctions({
    region: REGION,
    compatibleOnly: true,
  });

  let functionName: string;

  if (existingFunctions.length > 0) {
    functionName = existingFunctions[0].functionName;
    console.log(`   Found existing function: ${functionName}`);
  } else {
    console.log("   No compatible function found. Deploying new one...");
    const result = await deployFunction({
      region: REGION,
      timeoutInSeconds: TIMEOUT,
      memorySizeInMb: MEMORY,
      createCloudWatchLogGroup: true,
      diskSizeInMb: DISK,
    });
    functionName = result.functionName;
    console.log(`   Deployed function: ${functionName}`);
  }

  // Output deployment info
  console.log("\n=== Deployment Complete ===");
  console.log(`Region:        ${REGION}`);
  console.log(`Bucket:        ${bucketName}`);
  console.log(`Serve URL:     ${serveUrl}`);
  console.log(`Function:      ${functionName}`);
  console.log("\nAdd these to your .env.local:");
  console.log(`REMOTION_AWS_REGION=${REGION}`);
  console.log(`REMOTION_S3_BUCKET=${bucketName}`);
  console.log(`REMOTION_SERVE_URL=${serveUrl}`);
  console.log(`REMOTION_FUNCTION_NAME=${functionName}`);
}

deploy().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
