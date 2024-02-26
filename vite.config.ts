import { crx, defineManifest } from '@crxjs/vite-plugin';
import { defineConfig, loadEnv } from 'vite';
import { version as _version, author, description } from './package.json';
import archive from './plugins/vite-plugin-archive';

const [major, minor, patch, label = '0'] = _version.replace(/[^\d.-]+/g, '').split(/[.-]/);
const version = `${major}.${minor}.${patch}.${label}`;
const versionName = (mode: string) => (mode === 'production' ? _version : `${_version}(${mode})`);
const manifest = defineManifest(({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
	return {
		manifest_version: 3,
		name: process.env.VITE_APP_TITLE ?? 'Unknown Title',
		version,
		version_name: versionName(mode),
		author,
		description,
		icons: {
			'16': 'icons/icon16.png',
			'32': 'icons/icon32.png',
			'48': 'icons/icon48.png',
			'128': 'icons/icon128.png',
		},
		default_locale: 'en',
		permissions: ['webRequest', 'webNavigation'],
		host_permissions: ['https://*.salesforce.com/*'],
		background: {
			service_worker: 'src/background.ts',
			type: 'module',
		},
		content_scripts: [
			{
				js: ['src/content-script.ts'],
				matches: ['https://*.salesforce.com/*'],
				run_at: 'document_start',
			},
		],
	};
});

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [crx({ manifest }), archive()],
	build: {
		minify: false,
		rollupOptions: {
			// Do not use hash values
			output: {
				entryFileNames: `assets/[name].js`,
				chunkFileNames: `assets/[name].js`,
				assetFileNames: `assets/[name].[ext]`,
			},
		},
	},
});
