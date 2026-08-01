#!/usr/bin/env node
// Regenerates the skills table in README.md from the frontmatter of every
// skills/*/SKILL.md file. Run with --check to verify README.md is already
// up to date (used in CI) without writing any changes.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const SKILLS_DIR = join(ROOT, 'skills');
const README_PATH = join(ROOT, 'README.md');
const START_MARKER = '<!-- SKILLS_INDEX_START -->';
const END_MARKER = '<!-- SKILLS_INDEX_END -->';

function listSkillDirs() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort();
}

function buildTable() {
  const dirs = listSkillDirs();

  if (dirs.length === 0) {
    return '_No skills yet. See [CONTRIBUTING.md](CONTRIBUTING.md) to add the first one!_';
  }

  const rows = dirs.map((dirName) => {
    const skillMdPath = join(SKILLS_DIR, dirName, 'SKILL.md');
    if (!existsSync(skillMdPath)) {
      return `| \`${dirName}\` | — | _(missing SKILL.md)_ |`;
    }
    const { data } = matter(readFileSync(skillMdPath, 'utf8'));
    const name = data.name || dirName;
    const category = data.metadata?.category || '—';
    const description = (data.description || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    return `| [\`${name}\`](skills/${dirName}) | \`${category}\` | ${description} |`;
  });

  return ['| Skill | Category | Description |', '| --- | --- | --- |', ...rows].join('\n');
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const table = buildTable();
  const readme = readFileSync(README_PATH, 'utf8');

  const startIdx = readme.indexOf(START_MARKER);
  const endIdx = readme.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error(`Could not find ${START_MARKER} / ${END_MARKER} markers in README.md`);
    process.exit(1);
  }

  const before = readme.slice(0, startIdx + START_MARKER.length);
  const after = readme.slice(endIdx);
  const updated = `${before}\n${table}\n${after}`;

  if (updated === readme) {
    console.log('README.md skills index is already up to date.');
    return;
  }

  if (checkOnly) {
    console.error(
      'README.md skills index is out of date. Run "npm run index" and commit the result.'
    );
    process.exit(1);
  }

  writeFileSync(README_PATH, updated);
  console.log('README.md skills index updated.');
}

main();
