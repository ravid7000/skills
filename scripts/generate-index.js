#!/usr/bin/env node
// Regenerates the skills table in README.md and the skills.sh repo-page
// catalog (skills.sh.json) from the frontmatter of every skills/*/SKILL.md.
// Run with --check to verify both are already up to date (used in CI)
// without writing any changes.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const SKILLS_DIR = join(ROOT, 'skills');
const README_PATH = join(ROOT, 'README.md');
const SKILLS_SH_PATH = join(ROOT, 'skills.sh.json');
const START_MARKER = '<!-- SKILLS_INDEX_START -->';
const END_MARKER = '<!-- SKILLS_INDEX_END -->';

const REPO_SLUG = 'ravid7000/skills';
// Absolute, because this README is also the npm package page, where relative
// links are rewritten inconsistently.
const REPO_URL = `https://github.com/${REPO_SLUG}/tree/master`;

// Order and copy for https://skills.sh/ravid7000/skills. Titles match the
// closed category vocabulary in validate-skills.js; descriptions are the
// human-facing sentences shown above each group on the repo page. Only
// groups that currently have a skill are emitted.
const SKILLS_SH_GROUPS = [
  {
    category: 'research',
    title: 'Research',
    description: 'Skills that gather current, cited evidence instead of answering from model memory.',
  },
  {
    category: 'workflow',
    title: 'Workflow',
    description: 'Skills for planning work and handing it off so the next session can resume.',
  },
  {
    category: 'diagnostics',
    title: 'Diagnostics',
    description: 'Skills for tracing broken flows and instrumenting what ships so failures are visible.',
  },
  {
    category: 'maintenance',
    title: 'Maintenance',
    description: 'Skills for changing existing code safely.',
  },
  {
    category: 'meta',
    title: 'Authoring',
    description: 'Skills for writing and reviewing the skills in this collection.',
  },
];

function listSkillDirs() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort();
}

function loadSkills() {
  return listSkillDirs().map((dirName) => {
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
}

// Two audiences, two shapes. The summary table is for someone scanning to see
// whether anything here is useful; the sections below give each skill its own
// pitch and a copy-pasteable install line. Both come from frontmatter, so the
// agent-facing `description` never has to double as marketing copy.
function buildTable(skills) {
  if (skills.length === 0) {
    return '_No skills yet. See [CONTRIBUTING.md](CONTRIBUTING.md) to add the first one!_';
  }

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

function buildReadme(readme, table) {
  const startIdx = readme.indexOf(START_MARKER);
  const endIdx = readme.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`Could not find ${START_MARKER} / ${END_MARKER} markers in README.md`);
  }

  const before = readme.slice(0, startIdx + START_MARKER.length);
  const after = readme.slice(endIdx);
  return `${before}\n${table}\n${after}`;
}

function buildSkillsShJson(skills) {
  const present = skills.filter((s) => !s.missing);
  const groupings = SKILLS_SH_GROUPS.flatMap((group) => {
    const names = present.filter((s) => s.category === group.category).map((s) => s.name);
    if (names.length === 0) return [];
    return [
      {
        title: group.title,
        description: group.description,
        skills: names,
      },
    ];
  });

  return `${JSON.stringify(
    {
      $schema: 'https://skills.sh/schemas/skills.sh.schema.json',
      notGrouped: 'bottom',
      groupings,
    },
    null,
    2
  )}\n`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const skills = loadSkills();
  const stale = [];
  const written = [];

  let readme;
  try {
    readme = readFileSync(README_PATH, 'utf8');
  } catch (err) {
    console.error(`Failed to read README.md: ${err.message}`);
    process.exit(1);
  }

  let updatedReadme;
  try {
    updatedReadme = buildReadme(readme, buildTable(skills));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  if (updatedReadme !== readme) {
    if (checkOnly) stale.push('README.md');
    else {
      writeFileSync(README_PATH, updatedReadme);
      written.push('README.md');
    }
  }

  const expectedCatalog = buildSkillsShJson(skills);
  const currentCatalog = existsSync(SKILLS_SH_PATH) ? readFileSync(SKILLS_SH_PATH, 'utf8') : null;
  if (currentCatalog !== expectedCatalog) {
    if (checkOnly) stale.push('skills.sh.json');
    else {
      writeFileSync(SKILLS_SH_PATH, expectedCatalog);
      written.push('skills.sh.json');
    }
  }

  if (checkOnly && stale.length > 0) {
    console.error(
      `${stale.join(' and ')} ${stale.length === 1 ? 'is' : 'are'} out of date. Run "npm run index" and commit the result.`
    );
    process.exit(1);
  }

  if (written.length === 0) {
    console.log('README.md skills index and skills.sh.json are already up to date.');
    return;
  }

  for (const file of written) {
    console.log(`${file} updated.`);
  }
}

main();
