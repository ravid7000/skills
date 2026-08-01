#!/usr/bin/env node
// Validates every skill under skills/ against the agentskills.io SKILL.md spec:
// https://agentskills.io/specification
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const SKILLS_DIR = join(process.cwd(), 'skills');
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME_LEN = 64;
const MAX_DESCRIPTION_LEN = 1024;
const MAX_COMPATIBILITY_LEN = 500;
const RECOMMENDED_MAX_BODY_LINES = 500;

// Repo policy, not part of the agentskills.io spec (which treats metadata as
// free-form). Adding a category is a deliberate one-line change here so that it
// surfaces in review instead of drifting skill by skill.
const ALLOWED_CATEGORIES = ['meta', 'research', 'workflow', 'diagnostics', 'maintenance'];

// Every skill must say when to reach for it and when to reach for something
// else. The exclusion check is content-based rather than heading-based so that
// either a "## Do not use for" heading or an inline "**Do not use for:**" line
// inside "When to Use" satisfies it.
const WHEN_TO_USE_RE = /^#{2,4}\s+when to use/im;
const DO_NOT_USE_RE = /do not use\s+(this\s+skill\s+)?for/i;

function listSkillDirs() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort();
}

function validateSkill(dirName) {
  const errors = [];
  const warnings = [];
  const skillPath = join(SKILLS_DIR, dirName);
  const skillMdPath = join(skillPath, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    return { dirName, errors: [`Missing required SKILL.md file at skills/${dirName}/SKILL.md`], warnings };
  }

  const raw = readFileSync(skillMdPath, 'utf8');
  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    return { dirName, errors: [`Failed to parse YAML frontmatter: ${err.message}`], warnings };
  }

  const data = parsed.data || {};

  // name
  if (!data.name) {
    errors.push('Frontmatter is missing required field "name"');
  } else if (typeof data.name !== 'string') {
    errors.push('Frontmatter field "name" must be a string');
  } else {
    if (data.name.length > MAX_NAME_LEN) {
      errors.push(`Frontmatter field "name" must be at most ${MAX_NAME_LEN} characters (got ${data.name.length})`);
    }
    if (!NAME_RE.test(data.name)) {
      errors.push(
        `Frontmatter field "name" ("${data.name}") must contain only lowercase letters, numbers, and single hyphens, and must not start/end with a hyphen`
      );
    }
    if (data.name !== dirName) {
      errors.push(`Frontmatter field "name" ("${data.name}") must match its parent directory name ("${dirName}")`);
    }
  }

  // description
  if (!data.description) {
    errors.push('Frontmatter is missing required field "description"');
  } else if (typeof data.description !== 'string') {
    errors.push('Frontmatter field "description" must be a string');
  } else if (data.description.trim().length === 0) {
    errors.push('Frontmatter field "description" must not be empty');
  } else if (data.description.length > MAX_DESCRIPTION_LEN) {
    errors.push(
      `Frontmatter field "description" must be at most ${MAX_DESCRIPTION_LEN} characters (got ${data.description.length})`
    );
  }

  // optional: license
  if (data.license !== undefined && typeof data.license !== 'string') {
    errors.push('Frontmatter field "license", when present, must be a string');
  }

  // optional: compatibility
  if (data.compatibility !== undefined) {
    if (typeof data.compatibility !== 'string') {
      errors.push('Frontmatter field "compatibility", when present, must be a string');
    } else if (data.compatibility.length > MAX_COMPATIBILITY_LEN) {
      errors.push(
        `Frontmatter field "compatibility" must be at most ${MAX_COMPATIBILITY_LEN} characters (got ${data.compatibility.length})`
      );
    }
  }

  // optional: allowed-tools
  const allowedTools = data['allowed-tools'];
  if (allowedTools !== undefined && typeof allowedTools !== 'string') {
    errors.push('Frontmatter field "allowed-tools", when present, must be a space-separated string');
  }

  // metadata: free-form per the spec, but this repo requires metadata.category
  if (data.metadata === undefined) {
    errors.push(
      `Frontmatter is missing "metadata.category" (repo policy). Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
    );
  } else if (typeof data.metadata !== 'object' || data.metadata === null || Array.isArray(data.metadata)) {
    errors.push('Frontmatter field "metadata", when present, must be a key-value mapping');
  } else {
    for (const [key, value] of Object.entries(data.metadata)) {
      if (typeof value !== 'string') {
        errors.push(`Frontmatter field "metadata.${key}" must be a string (got ${typeof value})`);
      }
    }

    const category = data.metadata.category;
    if (category === undefined) {
      errors.push(
        `Frontmatter is missing "metadata.category" (repo policy). Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
      );
    } else if (typeof category === 'string' && !ALLOWED_CATEGORIES.includes(category)) {
      errors.push(
        `Frontmatter field "metadata.category" ("${category}") is not an allowed category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}. To add a new category, update ALLOWED_CATEGORIES in scripts/validate-skills.js and document it in skills/creating-agent-skills/SKILL.md`
      );
    }
  }

  // required body sections
  if (!WHEN_TO_USE_RE.test(parsed.content)) {
    errors.push('SKILL.md body is missing a "When to Use" section');
  }
  if (!DO_NOT_USE_RE.test(parsed.content)) {
    errors.push(
      'SKILL.md body must state what NOT to use the skill for (e.g. a "Do not use for:" list), so overlapping skills stay distinguishable'
    );
  }

  // body length (soft warning per spec's progressive disclosure guidance)
  const bodyLines = parsed.content.split('\n').length;
  if (bodyLines > RECOMMENDED_MAX_BODY_LINES) {
    warnings.push(
      `SKILL.md body is ${bodyLines} lines; the spec recommends keeping it under ${RECOMMENDED_MAX_BODY_LINES} lines and moving detail to references/`
    );
  }

  return { dirName, errors, warnings };
}

function main() {
  const dirs = listSkillDirs();

  if (dirs.length === 0) {
    console.log('No skills found under skills/. Nothing to validate.');
    return;
  }

  let hasErrors = false;

  for (const dirName of dirs) {
    const { errors, warnings } = validateSkill(dirName);

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`OK    skills/${dirName}`);
      continue;
    }

    if (errors.length > 0) {
      hasErrors = true;
      console.log(`FAIL  skills/${dirName}`);
      for (const error of errors) console.log(`      error: ${error}`);
    } else {
      console.log(`WARN  skills/${dirName}`);
    }
    for (const warning of warnings) console.log(`      warning: ${warning}`);
  }

  console.log('');
  if (hasErrors) {
    console.error(`Validation failed for ${dirs.length} skill(s) checked.`);
    process.exit(1);
  }

  console.log(`Validated ${dirs.length} skill(s) successfully.`);
}

main();
