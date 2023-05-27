const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')

// Instantiate S3 & SQS
const s3 = new AWS.S3();
const sqs = new AWS.SQS({
  region: 'ap-southeast-1',
  apiVersion: '2012-11-05',
})

// Sample dump file
// const dumpFile = require("./dump.json")

// Download from S3
const download = async(bucketName, objectName) => {
  let params = {Bucket: bucketName, Key: objectName}
  let response = await s3.getObject(params).promise()
  let fileContent = response.Body.toString('utf-8')
  return JSON.parse(fileContent)
}

module.exports.process = async (event) => {
  // Fetch from S3
  let s3DumpFile = await download(process.env.S3_BUCKET_NAME, "dump.json")

  let referenceIdList = []
  let sqsResponseList = []
  let sqsResponse = null
  let sqsPayloadCount = s3DumpFile.data.length

  for(let i=0; i<sqsPayloadCount; i++){
    let referenceId = uuidv4()
    let sqsPayload = {
      MessageBody: JSON.stringify({
        id: referenceId,
        purpose: 'poc',
        value: s3DumpFile.data[i].value
      }),
      MessageGroupId: referenceId,
      MessageDeduplicationId: referenceId,
      QueueUrl: process.env.SQS_QUEUE_URL,
    };
  
    sqsResponse = await sqs.sendMessage(sqsPayload).promise();
    sqsResponseList.push(sqsResponse)
    referenceIdList.push(referenceId)
    console.log("Done processing: ", referenceId)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        service: 'Sender Function v1',
        count: sqsPayloadCount,
        referenceIds: referenceIdList,
        queue: sqsResponseList,
      },
      null,
      2
    ),
  };
};