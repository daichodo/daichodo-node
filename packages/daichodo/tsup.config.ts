import { defineConfig } from "tsup";

// Bundled rather than compiled file-by-file with tsc.
//
// The generated source uses extensionless relative imports (`./types.gen`),
// which is what @hey-api/openapi-ts emits and what `moduleResolution: bundler`
// accepts. tsc passes those through verbatim, so the published ESM output was
// unimportable from Node - which rejects extensionless specifiers - while
// working fine under any bundler. `import "daichodo"` threw ERR_MODULE_NOT_FOUND
// in plain Node, and that is most of this package's audience.
//
// Bundling sidesteps it entirely: there are no relative imports left in the
// output. It also emits CJS, so `require("daichodo")` works, which a
// type: module package otherwise refuses.
//
// The alternative was making the generator emit extensions. It cannot at this
// version, and upgrading it would change the client's API surface - a bigger
// change for consumers than a build tweak.
export default defineConfig({
  entry: ["src/index.ts"],
  // Without this, the .d.ts pass falls back to legacy module resolution and
  // cannot find @hey-api/client-fetch, which publishes only an "exports" map.
  tsconfig: "tsconfig.build.json",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // The HTTP client stays a real dependency rather than being inlined, so a
  // consumer resolves one copy of it however they already do.
  external: ["@hey-api/client-fetch"],
});
