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

const REPO_SLUG = 'ravid7000/skills';
// Absolute, because this README is also the npm package page, where relative
// links are rewritten inconsistently.
const REPO_URL = `https://github.com/${REPO_SLUG}/tree/master`;

// Two audiences, two shapes. The summary table is for someone scanning to see
// whether anything here is useful; the sections below give each skill its own
// pitch and a copy-pasteable install line. Both come from frontmatter, so the
// agent-facing `description` never has to double as marketing copy.
function buildTable() {
  const dirs = listSkillDirs();

  if (dirs.length === 0) {
    return '_No skills yet. See [CONTRIBUTING.md](CONTRIBUTING.md) to add the first one!_';
  }

  const skills = dirs.map((dirName) => {
    const skillMdPath = join(SKILLS_DIR, dirName, 'SKILL.md');
    if (!existsSync(skillMdPath)) {
      return { dirName, name: dirName, missing: true };
    }
    const { data } = matter(readFileSync(skillMdPath, 'utf8'));
    return {
      dirName,
      name: data.name || dirName,
      category: data.metadata?.category || '—',
      tagline: data.metadata?.tagline || '',
      description: (data.description || '').replace(/\r?\n/g, ' ').trim(),
      missing: false,
    };
  });

  const escape = (s) => s.replace(/\|/g, '\\|');

  const summary = [
    '| Skill | What it does |',
    '| --- | --- |',
    ...skills.map((s) =>
      s.missing
        ? `| \`${s.dirName}\` | _(missing SKILL.md)_ |`
        : `| [**${s.name}**](#${s.name}) | ${escape(s.tagline)} |`
    ),
  ].join('\n');

  const sections = skills
    .filter((s) => !s.missing)
    .map((s) =>
      [
        `### ${s.name}`,
        '',
        `\`${s.category}\` · [Read the skill →](${REPO_URL}/skills/${s.dirName})`,
        '',
        s.tagline,
        '',
        '```bash',
        `npx skills add ${REPO_SLUG} --skill ${s.name}`,
        '```',
        '',
        '<details><summary>When the agent loads it</summary>',
        '',
        s.description,
        '',
        '</details>',
      ].join('\n')
    )
    .join('\n\n');

  return `${summary}\n\n${sections}`;
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
