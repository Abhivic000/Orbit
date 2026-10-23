// Turbopack loader: drop `//# sourceMappingURL=` comments.
//
// r3f-perf 7.2.3 ships dist/roboto.woff.{js,mjs}.map whose `sources` point at
// the *binary* src/roboto.woff with no sourcesContent. In `next dev` Turbopack
// reads that file as UTF-8 source and panics ("invalid utf-8 sequence"), which
// takes down every route. Production builds don't read source maps, and
// r3f-perf is dev-only, so stripping the reference for that one file is safe.
module.exports = function stripSourceMap(source) {
  return source.replace(/\/\/[#@] sourceMappingURL=.*$/gm, "");
};
