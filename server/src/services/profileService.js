export function profileStrength(profile) {
  const checks = [
    { label: 'Academic details (course, semester)', done: Boolean(profile.course && profile.semester), weight: 15 },
    { label: 'Skills', done: (profile.skills || []).length >= 3, weight: 20 },
    { label: 'Interests', done: (profile.interests || []).length >= 2, weight: 10 },
    { label: 'Career goal', done: Boolean(profile.careerGoal), weight: 15 },
    { label: 'Resume', done: Boolean(profile.resume), weight: 15 },
    { label: 'GitHub / portfolio', done: Boolean(profile.github || profile.portfolio), weight: 10 },
    { label: 'Preferred location & mode', done: Boolean(profile.preferredLocation || profile.remotePreference !== 'any'), weight: 5 },
    { label: 'LinkedIn', done: Boolean(profile.linkedin), weight: 5 },
    { label: 'Learning hours', done: profile.weeklyLearningHours > 0, weight: 5 },
  ];
  const completed = checks.filter((c) => c.done).map((c) => c.label);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  const score = Math.round(checks.reduce((acc, c) => acc + (c.done ? c.weight : 0), 0));
  return { score, completed, missing };
}
