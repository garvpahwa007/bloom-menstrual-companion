// Recommendations affect ordering, never access to an educational topic.
export const LEARNING_PATHS = Object.freeze({
  under18: ['firstPeriod', 'cycle', 'products', 'cramps', 'irregular', 'pcos', 'pregnancy'],
  adult: ['irregular', 'pcos', 'cycle', 'cramps', 'products', 'pregnancy', 'firstPeriod'],
});

export function lessonsForAge(lessons, ageGroup = 'under18') {
  const order = LEARNING_PATHS[ageGroup] || LEARNING_PATHS.under18;
  return [...lessons].sort((a, b) => {
    const rank = item => order.includes(item.id) ? order.indexOf(item.id) : order.length;
    return rank(a) - rank(b);
  });
}
