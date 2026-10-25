import 'package:flutter_test/flutter_test.dart';
import 'package:bloom_companion/features/log/models/day_log.dart';

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
