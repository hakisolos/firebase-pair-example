/** @format */

const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');
const config = require('./config.js');
var serviceAccount = require('./bin/cert.json');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	storageBucket: config.FIREBASE_STORAGE_BUCKET,
});

const upload = filePath => {
	return new Promise((resolve, reject) => {
		const randomFileName = `${crypto
			.randomBytes(5)
			.toString('hex')}${path.extname(filePath)}`;

		const jsonData = require(filePath);
		const fileContent = Buffer.from(JSON.stringify(jsonData));

		const storageBucket = admin.storage().bucket();
		const storageFile = storageBucket.file(randomFileName);

		const fileStream = storageFile.createWriteStream({
			metadata: {
				contentType: 'application/json',
				cacheControl: 'public, max-age=31536000',
			},
		});

		fileStream.end(fileContent);

		fileStream.on('finish', () => {
			const fileUrl = `https://storage.googleapis.com/${config.FIREBASE_STORAGE_BUCKET}/${randomFileName}`;
			resolve(fileUrl);
		});

		fileStream.on('error', error => {
			reject(error);
		});
	});
};

module.exports = { upload };
