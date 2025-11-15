const process = require('process');
const child = require('child_process');
const esbuild = require('esbuild');
const isProduction = process.env.NODE_ENV === 'production';

const context = esbuild.context({
    bundle: true,
    entryPoints: ['client/app.tsx'],
    minify: isProduction,
    outfile: 'public/app.js',
    platform: 'browser',
    plugins: [
        {
            name: 'do_something_on_rebuild',
            setup: build => {
                build.onEnd(result => {
                    const dt = (new Date()).toISOString();
                    const error = result.errors
                        .map(e => String(e))
                        .join('\n');

                    if (error) {
                        console.error(`[${dt}] esbuild error: ${error}`);
                    } else {
                        console.log(`[${dt}] esbuild OK`);
                    }
                });
            },
        },
    ],
    sourcemap: true,
    target: 'es2020',
    jsx: "automatic",
});

if (isProduction) {
    context.then(async c => {
        await c.rebuild();
        await c.dispose();
    });
}

if (!isProduction) {
    context.then(c => {
        console.log('Watching!');

        process.on('SIGINT', async event => {
            await c.dispose();
        });

        return c.watch();
    });

    // typescript compiler
    const tsc = child.spawn('node', ['./node_modules/.bin/tsc', '--watch', '--project', 'tsconfig.json']);

    tsc.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    tsc.stderr.on('data', (data) => {
        console.error(data.toString())
    });

    // php web server
    const php = child.spawn('php', ['-S', 'localhost:8000', '-t', 'public'], {
        stdio: 'inherit',
    });

    process.on('SIGINT', event => {
        tsc.kill('SIGINT');
        php.kill('SIGINT');
    });
}
