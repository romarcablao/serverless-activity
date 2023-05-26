'use strict';

module.exports.process = async (event) => {
  // Log events
  console.log(event)

  // Add your logic here

  // Return response
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        service: 'Receiver Function v1',
        input: event,
      },
      null,
      2
    ),
  };

};