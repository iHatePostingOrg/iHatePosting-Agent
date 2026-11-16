// A module-resolution hook for the tests (registered by index.test.mjs with `module.register`): where `@deepseek-ai/schemastery` cannot be found,
// the import goes to the stand-in next to this file; where it can be found, nothing changes.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@deepseek-ai/schemastery") {
    try {
      return await nextResolve(specifier, context);
    } catch {
      return { url: new URL("./schemastery-stand-in.mjs", import.meta.url).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
