const child = require('child_process');
const esbuild = require('esbuild');
const isProduction = process.env.NODE_ENV === 'production';

esbuild.build({
    bundle: true,
    entryPoints: ['client/app.tsx'],
    minify: isProduction,
    outfile: 'public/app.js',
    platform: 'browser',
    sourcemap: true,
    target: 'es2017',
    watch: isProduction ? false : {
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

if (!isProduction) {
    // typescript compiler
    const tsc = child.spawn('node', ['./node_modules/.bin/tsc', '--watch', '--project', 'tsconfig.json']);

    tsc.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    tsc.stderr.on('data', (data) => {
        console.error(data.toString())
    });

// php web server
    child.spawn('php', ['-S', 'localhost:8000', '-t', 'public'], {
        stdio: 'inherit',
    });
}

