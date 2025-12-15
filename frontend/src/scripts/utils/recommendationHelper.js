// recommendationHelper.js

/**
 * Mapping skill → learning_path_id
 * Sesuaikan dengan data di database kamu
 */
export function mapSkillToLearningPath(weakSkills = []) {
  const skillMap = {
    html: 1,
    css: 1,
    javascript: 2,
    frontend: 2,
    backend: 3,
    database: 3,
  };

  for (const skill of weakSkills) {
    if (skillMap[skill.toLowerCase()]) {
      return skillMap[skill.toLowerCase()];
    }
  }

  // default path
  return 1;
}
