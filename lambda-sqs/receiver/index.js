'use strict';
const AWS = require('aws-sdk')

let lambda = new AWS.Lambda()

module.exports.process = async (event) => {
  // Log events
  console.log(event)

  // Add your logic here
  let params = {
    FunctionName: process.env.DOWNSTREAM_LAMBDA_FUNCTION_NAME,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(event),
  };

  let lambdaResult = await lambda.invoke(params).promise()
  console.log(lambdaResult)

  // Return response
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        service: 'Receiver Function v1',
        result: lambdaResult,
      },
      null,
      2
    ),
  };

};