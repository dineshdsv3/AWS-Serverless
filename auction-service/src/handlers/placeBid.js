import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import { getAuctionById } from './getAuction';
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
	const { id } = event.pathParameters;
	const { amount } = event.body;
	const { email } = event.requestContext.authorizer;

	const auction = await getAuctionById(id);

	// Bid Identity validation
	if (email === auction.seller) {
		throw new createError.Forbidden('You cannot bid on your own auctions!');
	}
	// Avoid double bidding
	if (email === auction.highestBid.bidder) {
		throw new createError.Forbidden(`You are alreaddy the highest bidder`);
	}

	// Auction status validation
	if (auction.status !== 'OPEN') {
		throw new createError.Forbidden(`You cannot bid on closed auctions!`);
	}

	if (amount <= auction.highestBid.amount) {
		throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
	}

	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id },
		UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
		ExpressionAttributeValues: {
			':amount': amount,
			':bidder': email,
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

export const handler = commonMiddleware(placeBid).use(validator({ inputSchema: placeBidSchema }));
// .use(httpJsonBodyParser()) // will automatically parse our stringified event body so we no need to give JSON.parse every time
// .use(httpEventNormalizer()) // will automatically adjust the API gateway event object to prevent us from accidentally having a non existing objects when trying to access path parameters or query parameters when they are not provided. Will save us from room for errors and IF statements
// .use(httpErrorHandler()); // will make error handling smooth and easy
