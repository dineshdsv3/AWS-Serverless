import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getAuctionById(id) {

    let auction;

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

    return auction;
}

async function getAuction(event, context) {
	const { id } = event.pathParameters;
    const auction = await getAuctionById(id);

	return {
		statusCode: 200,
		body: JSON.stringify(auction),
	};
}

export const handler = commonMiddleware(getAuction);
// .use(httpJsonBodyParser()) // will automatically parse our stringified event body so we no need to give JSON.parse every time
// .use(httpEventNormalizer()) // will automatically adjust the API gateway event object to prevent us from accidentally having a non existing objects when trying to access path parameters or query parameters when they are not provided. Will save us from room for errors and IF statements
// .use(httpErrorHandler()); // will make error handling smooth and easy
