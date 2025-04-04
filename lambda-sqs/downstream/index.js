'use strict';

module.exports.process = async (event) => {
  // Log events
  console.log(event)

  // Return response
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        service: 'Downstream Function v1',
        input: event,
      },
      null,
      2
    ),
  };

};