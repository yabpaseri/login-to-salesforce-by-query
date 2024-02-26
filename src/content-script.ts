import { LoginCredential } from './LoginCredential';

const EXTENSION_ORIGIN = new URL(chrome.runtime.getURL('')).origin;

const log = console.log.bind(console, `%c ${import.meta.env.VITE_APP_TITLE} %c`, 'background-color:#92D1EA;', '');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (sender.origin !== EXTENSION_ORIGIN) {
		return;
	}

	// Notify service_worker of successful transmission
	sendResponse(true);
	log('Received message from service-worker.');

	const useNewIdentity = document.getElementById('use_new_identity');
	if (useNewIdentity && useNewIdentity.checkVisibility()) {
		useNewIdentity.click();
	}

	const unInput = document.querySelector<HTMLInputElement>('#username');
	const pwInput = document.querySelector<HTMLInputElement>('#password');
	if (!(unInput && pwInput)) {
		return;
	}

	const credential: LoginCredential = message;
	unInput.value = credential.un;
	pwInput.value = credential.pw;

	const submit = document.getElementById('Login');
	if (submit) {
		submit.click();
	} else {
		log('Login button not found.');
	}
});
