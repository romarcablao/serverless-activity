// src/uploadToS3.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs").promises;
const path = require("path");

const s3Client = new S3Client({});
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;

exports.handler = async (event) => {
  try {
    console.log("Raw upload event:", event);

    // Handle both direct invocation and Lambda payload
    let payload;
    if (typeof event === "string") {
      payload = JSON.parse(event);
    } else if (event.Payload) {
      payload = JSON.parse(event.Payload);
    } else {
      payload = event;
    }

    console.log("Processed payload:", payload);

    const { files, originalKey } = payload;
    const uploadedFiles = [];

    if (!files || !originalKey) {
      throw new Error("Missing required fields: files or originalKey");
    }

    const keyPrefix = path.dirname(originalKey);

    for (const filePath of files) {
      const fileContent = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const s3Key = path.join(keyPrefix, "processed", fileName);

      console.log(`Uploading ${fileName} to ${OUTPUT_BUCKET}/${s3Key}`);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: OUTPUT_BUCKET,
          Key: s3Key,
          Body: fileContent,
          ContentType: "application/octet-stream", // Changed to be more generic
        })
      );

      uploadedFiles.push(s3Key);

      // Clean up the file from EFS after upload
      await fs.unlink(filePath);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files uploaded successfully",
        files: uploadedFiles,
      }),
    };
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};
