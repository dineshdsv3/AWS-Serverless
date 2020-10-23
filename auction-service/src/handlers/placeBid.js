import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
	const { id } = event.pathParameters;
	const { amount } = event.body;

	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id },
		UpdateExpression: 'set highestBid.amount = :amount',
		ExpressionAttributeValues: {
			':amount': amount,
		},
		ReturnValues: 'ALL_NEW',
	};

	let updatedAuction;

	try {
        const result = await dynamodb.update(params).promise();
        updatedAuction = result.Attributes;
	} catch (error) {
		console.error(error);
		throw new createError.InternalServerError(error);
	}


	return {
		statusCode: 200,
		body: JSON.stringify(updatedAuction),
	};
}

export const handler = commonMiddleware(placeBid);
// .use(httpJsonBodyParser()) // will automatically parse our stringified event body so we no need to give JSON.parse every time
// .use(httpEventNormalizer()) // will automatically adjust the API gateway event object to prevent us from accidentally having a non existing objects when trying to access path parameters or query parameters when they are not provided. Will save us from room for errors and IF statements
// .use(httpErrorHandler()); // will make error handling smooth and easy
