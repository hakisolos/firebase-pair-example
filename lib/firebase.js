/** @format */

const admin = require('firebase-admin');
const path = require('path');
const config = require('../config.js');
const serviceAccount = require('../bin/cert.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: config.FIREBASE_DATABASE_URL, // Make sure this is in config.js
});

const upload = async filePath => {
	try {
		const jsonData = require(filePath);
		const ref = admin.database().ref('sessions');
		const newSessionRef = ref.push();
		await newSessionRef.set(jsonData);
		const dbKey = newSessionRef.key;
		return dbKey; // return the DB key
	} catch (error) {
		throw error;
	}
};

module.exports = { upload };
