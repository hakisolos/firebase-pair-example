/** @format */

const express = require('express');
const fs = require('fs');
const pino = require('pino');
const NodeCache = require('node-cache');
const {
	default: makeWASocket,
	useMultiFileAuthState,
	delay,
	Browsers,
	makeCacheableSignalKeyStore,
	DisconnectReason,
} = require('@whiskeysockets/baileys');
const { upload } = require('./firebase'); // Changed to firebase
const { Mutex } = require('async-mutex');
const config = require('./config');
const path = require('path');

const app = express();
const port = 3000;
const msgRetryCounterCache = new NodeCache();
const mutex = new Mutex();

app.use(express.static(path.join(__dirname, 'static')));

async function initializeSession(Num, res) {
	const sessionDir = './session';

	if (!fs.existsSync(sessionDir)) {
		fs.mkdirSync(sessionDir);
	}

	const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

	const session = makeWASocket({
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(
				state.keys,
				pino({ level: 'fatal' }).child({ level: 'fatal' })
			),
		},
		printQRInTerminal: false,
		logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
		browser: Browsers.macOS('Safari'),
		markOnlineOnConnect: true,
		msgRetryCounterCache,
	});

	if (!session.authState.creds.registered) {
		await delay(1500);
		Num = Num.replace(/[^0-9]/g, '');
		const code = await session.requestPairingCode(Num);
		if (!res.headersSent) {
			res.send({ code: code?.match(/.{1,4}/g)?.join('-') });
		}
	}

	session.ev.on('creds.update', async () => {
		await saveCreds();
	});

	session.ev.on('connection.update', async update => {
		const { connection, lastDisconnect } = update;
		if (connection === 'open') {
			console.log('Connected successfully');
			await delay(5000);
			const myr = await session.sendMessage(session.user.id, {
				text: `${config.MESSAGE}`,
			});
			const pth = './session/creds.json';
			try {
				const url = await upload(pth);
				let sID;
				if (url.includes('https://firebase.google.com/')) {
					// Updated to Firebase URL
					sID = config.PREFIX + url.split('https://firebase.google.com/')[1];
				} else {
					sID = 'Fekd up';
				}

				await session.sendMessage(
					session.user.id,
					{
						image: { url: `${config.IMAGE}` },
						caption: `*Session ID*\n\n${sID}`,
					},
					{ quoted: myr }
				);
			} catch (error) {
				console.error('Error:', error);
			} finally {
				if (fs.existsSync(path.join(__dirname, './session'))) {
					fs.rmdirSync(path.join(__dirname, './session'), { recursive: true });
				}
			}
		} else if (connection === 'close') {
			const reason = lastDisconnect?.error?.output?.statusCode;
			reconnect(reason);
		}
	});
}

function reconnect(reason) {
	if (
		[
			DisconnectReason.connectionLost,
			DisconnectReason.connectionClosed,
			DisconnectReason.restartRequired,
		].includes(reason)
	) {
		console.log('Connection lost, reconnecting...');
		initializeSession();
	} else {
		console.log(`Disconnected! reason: ${reason}`);
		session.end();
	}
}

app.get('/pair', async (req, res) => {
	const Num = req.query.code;
	if (!Num) {
		return res.status(418).json({ message: 'Phone number is required' });
	}

	// Mutex to prevent race conditions
	const release = await mutex.acquire();
	try {
		await initializeSession(Num, res);
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'An error occurred during pairing' });
	} finally {
		release();
	}
});

app.listen(port, () => {
	console.log(`Running on PORT:${port}`);
});
