const child = require('child_process');
const esbuild = require('esbuild');

esbuild.build({
    bundle: true,
    entryPoints: ['src/app.tsx'],
    minify: false,
    outfile: 'app.js',
    platform: 'browser',
    sourcemap: true,
    target: 'es2017',
    watch: {
        onRebuild: (error) => {
            const dt = (new Date()).toISOString();
            if (error) {
                console.error(`[${dt}] esbuild error: ${error}`);
            } else {
                console.log(`[${dt}] esbuild OK`);
            }
        },
    },
}).catch(err => {
    console.error(err);
    process.exit(1);
});

const tsc = child.spawn('node', ['./node_modules/.bin/tsc', '--watch', '--project', 'tsconfig.json'], {
    stdio: 'inherit',
});
