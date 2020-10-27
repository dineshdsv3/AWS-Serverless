import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';
import createAuctionSchema from '../lib/schemas/createAuctionSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
	const { email } = event.requestContext.authorizer;
	const { title } = event.body;
	const now = new Date();
	const endDate = new Date();
	endDate.setHours(now.getHours() + 1);

	const auction = {
		id: uuid(),
		title,
		status: 'OPEN',
		createdAt: now.toISOString(),
		endingAt: endDate.toISOString(),
		highestBid: {
			amount: 0,
		},
		seller: email,
	};

	try {
		await dynamodb
			.put({
				TableName: process.env.AUCTIONS_TABLE_NAME,
				Item: auction,
			})
			.promise();
	} catch (error) {
		console.error(error);
		throw new createError.InternalServerError(error);
	}

	return {
		statusCode: 201,
		body: JSON.stringify(auction),
	};
}

export const handler = commonMiddleware(createAuction).use(validator({ inputSchema: createAuctionSchema }));
// .use(httpJsonBodyParser()) // will automatically parse our stringified event body so we no need to give JSON.parse every time
// .use(httpEventNormalizer()) // will automatically adjust the API gateway event object to prevent us from accidentally having a non existing objects when trying to access path parameters or query parameters when they are not provided. Will save us from room for errors and IF statements
// .use(httpErrorHandler()); // will make error handling smooth and easy
