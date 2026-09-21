/**
 * Nest a JSX expression inside a stack of provider elements.
 *
 * `wrappers` is outermost-first. Each level indents by two spaces, and the
 * first line is returned unindented because the caller places it inline after
 * its own indentation.
 *
 *   nest('<App />', [['Provider store={store}', 'Provider']], '    ')
 *
 *   <Provider store={store}>
 *     <App />
 *   </Provider>
 */
export function nestJsx(
  inner: string,
  wrappers: ReadonlyArray<readonly [open: string, close: string]>,
  baseIndent: string,
): string {
  if (wrappers.length === 0) return inner;

  const pad = (depth: number) => baseIndent + '  '.repeat(depth);
  const lines: string[] = [];

  wrappers.forEach(([open], depth) => lines.push(`${pad(depth)}<${open}>`));
  lines.push(`${pad(wrappers.length)}${inner}`);
  for (let depth = wrappers.length - 1; depth >= 0; depth--) {
    lines.push(`${pad(depth)}</${wrappers[depth]![1]}>`);
  }

  // The caller supplies the indentation for the opening line.
  return lines.join('\n').slice(baseIndent.length);
}
