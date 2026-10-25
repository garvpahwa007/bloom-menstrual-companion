import 'package:flutter_test/flutter_test.dart';
import 'package:bloom_companion/features/log/models/day_log.dart';
import 'package:bloom_companion/features/log/models/mood_catalog.dart';

void main() {
  group('DayLog', () {
    test('serializes and restores a private daily check-in', () {
      final original = DayLog(
        date: DateTime(2026, 10, 25),
        period: true,
        flow: 'light',
        pain: 3,
        symptoms: const ['Cramps', 'Tiredness'],
        mood: 'good',
        energy: 'high',
        sleep: 7.5,
        note: 'A note kept locally',
      );

      final restored = DayLog.fromJson(original.toJson());
      expect(restored.dateKey, '2026-10-25');
      expect(restored.period, isTrue);
      expect(restored.flow, 'light');
      expect(restored.pain, 3);
      expect(restored.symptoms, ['Cramps', 'Tiredness']);
      expect(restored.mood, 'good');
      expect(restored.energy, 'high');
      expect(restored.sleep, 7.5);
      expect(restored.note, 'A note kept locally');
    });

    test('new mood descriptors round-trip without dropping legacy choices', () {
      for (final mood in moodIds) {
        final original = DayLog(date: DateTime(2026, 10, 25), mood: mood);
        final restored = DayLog.fromJson(original.toJson());
        expect(restored.mood, mood);
        expect(validMoodIds.contains(restored.mood), isTrue);
      }
      expect(validMoodIds.contains('veryLow'), isTrue);
      expect(validMoodIds.contains('great'), isTrue);
    });

    test('copyWith changes selected values and preserves the rest', () {
      final original = DayLog(
        date: DateTime(2026, 10, 25),
        period: true,
        flow: 'medium',
        pain: 2,
      );
      final updated = original.copyWith(pain: 6, flow: 'heavy');
      expect(updated.pain, 6);
      expect(updated.flow, 'heavy');
      expect(updated.period, isTrue);
      expect(updated.dateKey, original.dateKey);
    });
  });
}
