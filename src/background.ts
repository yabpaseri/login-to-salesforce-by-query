import { LoginCredential } from './LoginCredential';

const SALESFORCE_URL_PATTERN = '^https://.+\\.salesforce\\.com/.*$';
const SALESFORCE_URLS = ['https://*.salesforce.com/*'];

const receiveQueue = new Map<string, LoginCredential>();
const transmitQueue = new Map<number, LoginCredential>();

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
	// For mainframes only
	if (!(details.frameId === 0 && details.parentFrameId === -1 && details.frameType === 'outermost_frame')) {
		return;
	}

	const tabId = details.tabId;
	if (transmitQueue.delete(tabId)) {
		console.log('[webNavigation.onBeforeNavigate]', `Deleted from transmitQueue: tabId=${tabId}`);
	}
});

chrome.webRequest.onBeforeRequest.addListener(
	(details) => {
		// For mainframes only
		if (!(details.frameId === 0 && details.parentFrameId === -1 && details.tabId >= 0)) {
			return;
		}

		const url = new URL(details.url);
		const [un, pw] = [url.searchParams.get('un'), url.searchParams.get('pw')];
		if (!(un && pw)) {
			return;
		}

		const requestId = details.requestId;
		receiveQueue.set(requestId, { un, pw });
		console.log('[webRequest.onBeforeRequest]', `Added to receiveQueue: requestId=${requestId}`);
	},
	{ urls: SALESFORCE_URLS },
);

chrome.webRequest.onCompleted.addListener(
	(details) => {
		const tabId = details.tabId;
		const requestId = details.requestId;
		const credential = receiveQueue.get(requestId);
		if (credential == null) {
			return;
		}

		transmitQueue.set(tabId, credential);
		receiveQueue.delete(requestId);
		console.log('[webRequest.onCompleted]', `Move to transmitQueue from receiveQueue: requestId=${requestId}, tabId=${tabId}`);
	},
	{ urls: SALESFORCE_URLS },
);

chrome.webNavigation.onCompleted.addListener(
	(details) => {
		// For mainframes only
		if (!(details.frameId === 0 && details.frameType === 'outermost_frame')) {
			return;
		}

		const tabId = details.tabId;
		const credential = transmitQueue.get(tabId);
		if (credential == null) {
			return;
		}

		transmitQueue.delete(tabId);
		chrome.tabs.sendMessage(tabId, credential, (res) => {
			if (res) {
				console.log('[webNavigation.onCompleted]', `Sent to content_script: tabId=${tabId}`);
			}
		});
	},
	{ url: [{ urlMatches: SALESFORCE_URL_PATTERN }] },
);
