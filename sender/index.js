const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Instantiate SQS
const sqs = new AWS.SQS({
  region: 'ap-southeast-1',
  apiVersion: '2012-11-05',
});

// Sample dump file
const dumpFile = require("./dump.json")

module.exports.process = async (event) => {
  let referenceIdList = []
  let sqsResponseList = []
  let sqsResponse = null
  let sqsPayloadCount = dumpFile.data.length

  for(let i=0; i<sqsPayloadCount; i++){
    let referenceId = uuidv4()
    let sqsPayload = {
      MessageBody: JSON.stringify({
        id: referenceId,
        purpose: 'poc'
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