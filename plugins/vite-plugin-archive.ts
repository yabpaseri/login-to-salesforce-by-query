import Archiver from 'archiver';
import { createWriteStream, mkdirSync, statSync } from 'fs';
import path from 'path';
import { Plugin, ResolvedConfig, normalizePath } from 'vite';
import { constants as ZLIB_CONST } from 'zlib';
import { name, version } from '../package.json';

const archive = (): Plugin => {
	let conf: ResolvedConfig;
	return {
		name: 'archive',
		apply(_config, env) {
			return env.command === 'build' && env.mode === 'production';
		},
		configResolved(config) {
			conf = config;
		},
		async closeBundle() {
			const resource = normalizePath(conf.build.outDir); // dist
			const outDir = path.resolve(resource, '..', 'archive');
			const zipPath = path.resolve(outDir, `${name}@${version}.zip`);

			if (!statSync(outDir, { throwIfNoEntry: false })?.isDirectory()) {
				mkdirSync(outDir);
			}

			const archiver = Archiver.create('zip', { zlib: { level: ZLIB_CONST.Z_BEST_COMPRESSION } });
			const output = archiver.pipe(createWriteStream(zipPath));
			output.on('close', () => {
				console.log(`[vite-plugin-archive] created ${zipPath} (size: ${archiver.pointer()}bytes)`);
			});
			output.on('error', () => {
				throw output.errored;
			});
			await archiver
				.glob('**/*', {
					ignore: ['.vite/manifest.json'],
					cwd: resource,
				})
				.finalize();
		},
	};
};
export default archive;
