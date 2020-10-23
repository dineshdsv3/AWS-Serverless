import AWS from 'aws-sdk';
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuction(event, context) {
	let auction;

	const { id } = event.pathParameters;

	try {
		const result = await dynamodb
			.get({
				TableName: process.env.AUCTIONS_TABLE_NAME,
				Key: { id },
			})
			.promise();

		auction = result.Item;
	} catch (error) {
		console.error(error);
		throw new createError.InternalServerError(error);
	}

	if (!auction) {
		throw new createError.NotFound(`Auction with "${id}" not found`);
	}

	return {
		statusCode: 200,
		body: JSON.stringify(auction),
	};
}

export const handler = middy(getAuction)
	.use(httpJsonBodyParser()) // will automatically parse our stringified event body so we no need to give JSON.parse every time
	.use(httpEventNormalizer()) // will automatically adjust the API gateway event object to prevent us from accidentally having a non existing objects when trying to access path parameters or query parameters when they are not provided. Will save us from room for errors and IF statements
	.use(httpErrorHandler()); // will make error handling smooth and easy
