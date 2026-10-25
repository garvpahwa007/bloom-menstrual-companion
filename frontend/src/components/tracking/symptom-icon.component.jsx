import React from 'react';
import { Droplets, Heart, Leaf, Moon, Sparkles, Sun, Wind } from 'lucide-react';
const symptomIcons = {
  cramps: Wind,
  headache: Sun,
  acne: Sparkles,
  bloating: Wind,
  fatigue: Moon,
  tiredness: Moon,
  moodChanges: Heart,
  mood: Heart,
  insomnia: Moon,
  sleep: Moon,
  troubleSleeping: Moon,
  dizziness: Wind,
  breathlessness: Wind,
  backache: Leaf,
  backPain: Leaf,
  nausea: Leaf,
  breastTenderness: Heart,
  discharge: Droplets
};
export const SymptomIcon = ({
  id,
  size = 22
}) => {
  const Icon = symptomIcons[id] || Leaf;
  return <Icon size={size} aria-hidden="true" />;
};
export default SymptomIcon;
