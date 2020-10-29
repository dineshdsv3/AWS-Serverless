import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(auction) {
	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id: auction.id },
		UpdateExpression: 'set #status = :status',
		ExpressionAttributeValues: {
			':status': 'CLOSED',
		},
		ExpressionAttributeNames: {
			'#status': 'status',
		},
	};

	await dynamodb.update(params).promise();

	const { title, seller, highestBid } = auction;
	const { amount, bidder } = highestBid;

	if (amount === 0) {
		await sqs
			.sendMessage({
				QueueUrl: process.env.MAIL_QUEUE_URL,
				MessageBody: JSON.stringify({
					subject: 'No bids on your action item :(',
					recipient: seller,
					body: `Oh No your item didnt get any bids "${title}" better luck next time`,
				}),
			})
			.promise();
		return;
	}

	const notifySeller = sqs
		.sendMessage({
			QueueUrl: process.env.MAIL_QUEUE_URL,
			MessageBody: JSON.stringify({
				subject: 'Your Item has been sold',
				recipient: seller,
				body: `Wohoo! Your item "${title}" has been sold for $${amount}`,
			}),
		})
		.promise();

	const notifyBidder = sqs
		.sendMessage({
			QueueUrl: process.env.MAIL_QUEUE_URL,
			MessageBody: JSON.stringify({
				subject: 'You Won an auction',
				recipient: bidder,
				body: `What a great Deal! you got yourself a ${title} fro ${amount}`,
			}),
		})
		.promise();

	return Promise.all([notifySeller, notifyBidder]);
}
