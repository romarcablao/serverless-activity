// src/processImage.js
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const fs = require("fs").promises;
const path = require("path");

const s3Client = new S3Client({});
const lambdaClient = new LambdaClient({});

const EFS_MOUNT_PATH = process.env.EFS_MOUNT_PATH;
const UPLOAD_FUNCTION_NAME = process.env.UPLOAD_FUNCTION_NAME;
const NUMBER_OF_COPIES = process.env.NUMBER_OF_COPIES || 3;

exports.handler = async (event) => {
  try {
    console.log("Processing event:", JSON.stringify(event, null, 2));

    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    const filename = path.basename(key);

    console.log(`Processing file from bucket: ${bucket}, key: ${key}`);

    // Get file from S3
    const getObjectResponse = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    // Convert readable stream to buffer
    const chunks = [];
    for await (const chunk of getObjectResponse.Body) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    const processedFiles = [];

    // Create multiple copies
    for (let copy = 1; copy <= NUMBER_OF_COPIES; copy++) {
      console.log(`Creating copy ${copy}`);

      const outputPath = path.join(EFS_MOUNT_PATH, `${filename}-copy${copy}`);

      // Save to EFS
      await fs.writeFile(outputPath, fileBuffer);
      processedFiles.push(outputPath);

      console.log(`Saved copy ${copy} to: ${outputPath}`);
    }

    // Trigger upload Lambda
    console.log("Triggering upload Lambda");
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: UPLOAD_FUNCTION_NAME,
        InvocationType: "Event",
        Payload: JSON.stringify({
          files: processedFiles,
          originalKey: key,
        }),
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files copied successfully",
        files: processedFiles,
      }),
    };
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
};
