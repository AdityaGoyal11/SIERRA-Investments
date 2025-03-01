exports.handler = async (event) => {
    // TODO: Implement logic to process ESG data from S3 bucket and save it to DynamoDB
    return {
        statusCode: 200,
        body: JSON.stringify("ESG Lambda function to extract data from S3 csv data to DynamoDB executed successfully"),
    };
};
