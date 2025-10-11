#!/usr/bin/env node
const { NodeIO } = require('@gltf-transform/core');
const { mergeDocuments, unpartition } = require('@gltf-transform/functions');
const { EXTMeshoptCompression } = require('@gltf-transform/extensions');
const { MeshoptDecoder } = require('meshoptimizer');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2), {
  string: ['a', 'b', 'out', 'matA', 'matB']
});

if (!argv.a || !argv.b || !argv.out) {
  console.error('Usage: node merge-glb.cjs --a chip0.glb --b chip1.glb --out merged.glb');
  process.exit(1);
}

const io = new NodeIO();

MeshoptDecoder.ready.then(() => {
  io.registerExtensions([EXTMeshoptCompression]);
  io.registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

  Promise.all([io.read(argv.a), io.read(argv.b)]).then(async ([docA, docB]) => {
    function parseMat(str) {
      return new Float32Array(str.split(',').map(Number));
    }

    const sceneA = docA.getRoot().getDefaultScene() || docA.createScene();

    const groupA = docA.createNode('chip0').setMatrix(parseMat(argv.matA));
    for (const child of sceneA.listChildren()) groupA.addChild(child);
    sceneA.addChild(groupA);

    const map = mergeDocuments(docA, docB);
    const sceneB = docB.getRoot().getDefaultScene();
    if (sceneB) {
      const sceneBInA = map.get(sceneB);
      const groupB = docA.createNode('chip1').setMatrix(parseMat(argv.matB));
      for (const child of sceneBInA.listChildren()) groupB.addChild(child);
      sceneA.addChild(groupB);
      sceneBInA.dispose();
    }

    await docA.transform(unpartition());
    await io.write(argv.out, docA);
    console.log(`✅ Wrote ${argv.out}`);
  }).catch(console.error);
}).catch(console.error);