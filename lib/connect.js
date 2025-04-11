/** @format */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const config = require('../config');

var prefix = 'SESSION-ID'; // your prefix, same as in config.PREFIX
var output = './session/'; // path where creds.json will be saved

// Initialize Firebase if not done yet
if (!admin.apps.length) {
	var serviceAccount = require('./bin/cert.json');
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: config.FIREBASE_DATABASE_URL,
	});
}

async function saveCreds(id) {
	if (!id.startsWith(prefix)) {
		throw new Error(`Prefix doesn't match. Expected prefix: "${prefix}"`);
	}

	const nodeKey = id; // Full node key, e.g. "SESSION-IDabc123xyz"
	const db = admin.database();
	const ref = db.ref(nodeKey);

	const snapshot = await ref.once('value');
	const data = snapshot.val();

	if (!data) {
		throw new Error('No session data found for this ID');
	}

	const pth = path.join(output, 'creds.json');
	if (!fs.existsSync(output)) {
		fs.mkdirSync(output, { recursive: true });
	}

	fs.writeFileSync(pth, JSON.stringify(data, null, 2));
	console.log(`Session saved to ${pth}`);
}

module.exports = { saveCreds };
