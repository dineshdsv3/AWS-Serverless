const base64 = require('base-64');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();


const upload = async (file) => {
	let bytes = base64.decode(file);
	let text = utf8.decode(bytes);
    console.log(text);
    const params = {
        Bucket: 'upload-api-tutorial-youtube',
        Key: 'testfile.pdf',
        Body: text
    }

    return await new Promise((resolve, reject) => {
        s3.putObject(params, (err, result) => {
            if(err) reject(err);
            else resolve(result);
        })
    })
}

const main = async (event) => {
	// TODO implement
	const response = {
		statusCode: 200,
		body: upload(event.content),
	};
	return response;
};

exports.handler = main;