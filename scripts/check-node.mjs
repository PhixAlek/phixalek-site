const major = Number(process.versions.node.split('.')[0]);
if (major !== 24) {
  console.error(`This project uses Node 24. Current version: ${process.version}.\nRun: nvm use\nThen: npm run dev`);
  process.exit(1);
}
