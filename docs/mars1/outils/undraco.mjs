import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { dedup, prune, quantize } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const [src, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });
for (const f of readdirSync(src).filter((f) => f.endsWith(".glb"))) {
  const doc = await io.read(join(src, f));
  doc.getRoot().listExtensionsUsed().filter((e) => e.extensionName === "KHR_draco_mesh_compression").forEach((e) => e.dispose());
  await doc.transform(quantize());
  await io.write(join(out, f), doc);
  console.log(f, (statSync(join(src, f)).size / 1e6).toFixed(1), "->", (statSync(join(out, f)).size / 1e6).toFixed(1), "Mo");
}
