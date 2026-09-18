/**
 * Light synonym / transferability map for heuristic mode.
 * Jev (TypeSafe) is the source of truth when TYPESAFE_API_KEY is present.
 *
 * Keys and values are normalized lowercase skill tokens.
 * Bidirectional: if A covers B, B also covers A unless noted otherwise.
 */
const SYNONYM_GROUPS: string[][] = [
  ["typescript", "javascript", "js", "ts"],
  ["react", "next.js", "nextjs", "react.js", "reactjs"],
  ["vue", "nuxt", "vue.js", "vuejs"],
  ["angular", "rxjs"],
  ["node", "nodejs", "node.js", "express", "nestjs"],
  ["java", "spring", "springboot", "spring-boot"],
  ["kotlin", "android"],
  ["swift", "ios", "swiftui"],
  ["css", "tailwind", "tailwindcss", "scss", "sass"],
  ["html", "html5"],
  ["postgres", "postgresql", "sql", "mysql"],
  ["mongodb", "mongo", "nosql"],
  ["docker", "kubernetes", "k8s", "containers"],
  ["aws", "gcp", "azure", "cloud"],
  ["jest", "vitest", "testing", "cypress", "playwright"],
  ["python", "django", "flask", "fastapi"],
  ["graphql", "apollo"],
  ["ci/cd", "github actions", "gitlab ci", "devops"],
];

/** Canonical skill → set of skills that can cover it (including itself). */
function buildCoverMap(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const set = new Set(group);
    for (const skill of group) {
      const existing = map.get(skill) ?? new Set<string>();
      for (const other of set) existing.add(other);
      map.set(skill, existing);
    }
  }
  return map;
}

const COVER_MAP = buildCoverMap();

export function normalizeSkillToken(skill: string): string {
  return skill.trim().toLowerCase();
}

/** Does CV skill set cover `jobSkill` via synonym / equivalence groups? */
export function coversViaSynonym(
  jobSkill: string,
  cvSkills: Iterable<string>,
): boolean {
  const job = normalizeSkillToken(jobSkill);
  const cvSet = new Set(
    [...cvSkills].map(normalizeSkillToken).filter(Boolean),
  );
  if (cvSet.has(job)) return true;

  const covers = COVER_MAP.get(job);
  if (!covers) return false;
  for (const equiv of covers) {
    if (equiv === job) continue;
    if (cvSet.has(equiv)) return true;
  }

  // Also: CV may have a skill whose group includes the job requirement
  for (const cv of cvSet) {
    const cvCovers = COVER_MAP.get(cv);
    if (cvCovers?.has(job)) return true;
  }

  return false;
}

/**
 * Split naive missing skills into those covered by synonym map vs still missing.
 */
export function splitBySynonymEquivalence(
  missingSkills: string[],
  cvSkills: Iterable<string>,
): { coveredByEquivalence: string[]; stillMissing: string[] } {
  const coveredByEquivalence: string[] = [];
  const stillMissing: string[] = [];

  for (const skill of missingSkills) {
    if (coversViaSynonym(skill, cvSkills)) {
      coveredByEquivalence.push(skill);
    } else {
      stillMissing.push(skill);
    }
  }

  return { coveredByEquivalence, stillMissing };
}

/** Threshold: P(covered by equivalent skill) from Jev Noul. */
export const EQUIVALENCE_NOUL_THRESHOLD = 0.55;
