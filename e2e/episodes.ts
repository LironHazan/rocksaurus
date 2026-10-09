import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The Shorts in the studio, read from the registry's source: importing src/episodes would start Web Audio and
// three.js in Node. Each entry is a folder the registry imports, with the `id` and `title` its index.ts declares.

const EPISODES = join(import.meta.dirname, '..', 'src', 'episodes');

const field = (source: string, name: string): string | undefined =>
  source.match(new RegExp(`^\\s+${name}: (['"])(.+?)\\1,`, 'm'))?.[2];

export const REGISTERED = [
  ...readFileSync(join(EPISODES, 'index.ts'), 'utf8').matchAll(/^import \w+ from '\.\/([\w-]+)';/gm),
].map(([, dir]) => {
  const source = readFileSync(join(EPISODES, dir!, 'index.ts'), 'utf8');
  const id = field(source, 'id');
  const title = field(source, 'title');
  if (!id || !title) throw new Error(`No id/title in src/episodes/${dir}/index.ts`);
  return { id, title };
});
