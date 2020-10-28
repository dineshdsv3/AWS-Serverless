import AWS from 'aws-sdk';

const ses = new AWS.SES({ region: 'eu-west-1' });

async function sendMail(event, context) {
	const params = {
		Source: 'dineshdsv3@gmail.com',
		Destination: {
			ToAddresses: ['dineshdsv3@gmail.com'],
		},
		Message: {
			Body: {
				Text: {
					Data: 'Hello from AWS SES service',
				},
			},
			Subject: {
				Data: 'Test AWS Mail',
			},
		},
	};

	try {
		const result = await ses.sendEmail(params).promise();
		console.log(result);
		return result;
	} catch (error) {
		console.log(error);
	}

	console.log(event);
	return {
		event,
	};
}

export const handler = sendMail;
