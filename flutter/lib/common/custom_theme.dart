import 'package:flutter/material.dart';

/// Bloom's visual language, ported from the React companion.
abstract final class BloomTheme {
  static const ink = Color(0xFF302536);
  static const muted = Color(0xFF655B6C);
  static const plum = Color(0xFF755486);
  static const plumDark = Color(0xFF53375F);
  static const lilac = Color(0xFFF0EAF5);
  static const coral = Color(0xFFC17B71);
  static const line = Color(0xFFEBE6ED);
  static const surface = Color(0xFFFFFFFF);
  static const background = Color(0xFFFAF8FB);
  static const peach = Color(0xFFF9EDE8);
  static const sage = Color(0xFFEFF3ED);
  static const heroStart = Color(0xFF674574);
  static const heroEnd = Color(0xFF82618F);

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: plum,
      brightness: Brightness.light,
      primary: plum,
      onPrimary: Colors.white,
      secondary: coral,
      surface: surface,
      onSurface: ink,
      error: const Color(0xFF9D3D47),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      fontFamily: 'Avenir Next',
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 30,
          height: 1.2,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.8,
          color: ink,
        ),
        headlineMedium: TextStyle(
          fontSize: 23,
          height: 1.25,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.4,
          color: ink,
        ),
        titleLarge: TextStyle(
          fontSize: 19,
          height: 1.3,
          fontWeight: FontWeight.w700,
          color: ink,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          height: 1.4,
          fontWeight: FontWeight.w600,
          color: ink,
        ),
        bodyLarge: TextStyle(fontSize: 15, height: 1.55, color: ink),
        bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: muted),
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: line),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: lilac,
        elevation: 0,
        height: 72,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? plumDark : muted,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: plum, width: 1.5),
        ),
      ),
      visualDensity: VisualDensity.standard,
    );
  }
}
