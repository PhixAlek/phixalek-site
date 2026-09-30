const [major, minor] = process.versions.node.split('.').map(Number);
if (major !== 26 || minor < 4) {
  console.error(`This project uses Node 26.4.0 or newer within Node 26. Current version: ${process.version}.\nRun: nvm use\nThen: npm run dev`);
  process.exit(1);
}
