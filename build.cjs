const fs = require('fs');
const { get } = require('https');
const { execFileSync } = require('child_process');

// Read circuit.json
const circuit = JSON.parse(fs.readFileSync('circuit.json', 'utf8'));

// Find chips with gltfUrl
const chips = circuit.filter(c => c.type === 'chip' && c.cadModel?.gltfUrl);
if (chips.length < 2) throw new Error('Need at least 2 chips with gltfUrl');

// Function to download .glb file
function download(url, filename) {
  return new Promise((resolve, reject) => {
    console.log('📥 Downloading:', url);
    const file = fs.createWriteStream(filename);
    get(url, res => {
      if (res.statusCode !== 200) {
        fs.unlinkSync(filename);
        return reject(new Error(`Failed: ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => resolve());
      file.on('error', () => {
        fs.unlinkSync(filename);
        reject(new Error('Download failed'));
      });
    }).on('error', () => {
      fs.unlinkSync(filename);
      reject(new Error('Request failed'));
    });
  });
}

// Run everything
(async () => {
  try {
    await download(chips[0].cadModel.gltfUrl, 'chip0.glb');
    console.log('✅ Saved chip0.glb');

    await download(chips[1].cadModel.gltfUrl, 'chip1.glb');
    console.log('✅ Saved chip1.glb');

    console.log('🔧 Merging models with 3000-meter separation...');
    execFileSync('node', [
      'merge-glb.cjs',
      '--a', 'chip0.glb',
      '--b', 'chip1.glb',
      '--out', 'merged.glb',
      '--matA', '1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1',           // U1 at origin
      '--matB', '1,0,0,0,0,1,0,0,0,0,1,0,10.0,0,0,1'          // U2 at +3000 meter in X
    ], { stdio: 'inherit' });

    console.log('🎉 Success! Open https://gltf-viewer.donmccurdy.com and drag in merged.glb');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();