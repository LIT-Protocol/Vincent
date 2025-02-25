import esbuild from 'esbuild';

const buildConfigs = [
  {
    bundle: true,
    entryPoints: ['src/bin/server.ts'],
    format: 'cjs',
    outfile: 'dist/server.cjs',
    platform: 'node',
  },
];

Promise.all(
  buildConfigs.map((config) =>
    esbuild.build(config).catch((err) => {
      console.error(`Failed to build ${config.entryPoints}`);
      throw err;
    })
  )
).then(() => {
  console.log('Builds completed successfully');
});
