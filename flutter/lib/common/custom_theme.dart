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
  static const background = Color(0xFFF2D0DA);
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
      scaffoldBackgroundColor: Colors.transparent,
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
        backgroundColor: const Color(0xF2FFF4F8),
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

/// Blush gradient canvas with the soft grid used by the updated React theme.
class BloomBackdrop extends StatelessWidget {
  const BloomBackdrop({super.key, this.highContrast = false});
  final bool highContrast;

  @override
  Widget build(BuildContext context) {
    if (highContrast) return const ColoredBox(color: Colors.white);
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFF8E1E7), Color(0xFFF2D0DA), Color(0xFFE8AFC1)],
            ),
          ),
        ),
        const _BloomGlow(
          center: Alignment(-0.82, -0.9),
          color: Color(0xFFFBE9EB),
        ),
        const _BloomGlow(
          center: Alignment(0.82, -0.55),
          color: Color(0xFFF0C8D4),
        ),
        const _BloomGlow(
          center: Alignment(-0.65, 0.82),
          color: Color(0xFFEAB6C7),
        ),
        const Positioned.fill(child: CustomPaint(painter: _BlushGridPainter())),
      ],
    );
  }
}

class _BloomGlow extends StatelessWidget {
  const _BloomGlow({required this.center, required this.color});
  final Alignment center;
  final Color color;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      gradient: RadialGradient(
        center: center,
        radius: 0.82,
        colors: [color, color.withValues(alpha: 0)],
        stops: const [0.05, 1],
      ),
    ),
  );
}

class _BlushGridPainter extends CustomPainter {
  const _BlushGridPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: .58)
      ..strokeWidth = 1;
    for (final fraction in const [1 / 3, 2 / 3]) {
      final x = size.width * fraction;
      final y = size.height * fraction;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _BlushGridPainter oldDelegate) => false;
}

/// A gentle loop used for Bloom's hero mark; it stops for reduced-motion users.
class BloomBreathe extends StatefulWidget {
  const BloomBreathe({
    super.key,
    required this.child,
    this.amplitude = 0.035,
    this.duration = const Duration(milliseconds: 3200),
  });
  final Widget child;
  final double amplitude;
  final Duration duration;

  @override
  State<BloomBreathe> createState() => _BloomBreatheState();
}

class _BloomBreatheState extends State<BloomBreathe>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: widget.duration,
  );
  bool? _reducedMotion;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reducedMotion = MediaQuery.of(context).disableAnimations;
    if (reducedMotion == _reducedMotion) return;
    _reducedMotion = reducedMotion;
    if (reducedMotion) {
      _controller.stop();
      _controller.value = 0;
    } else {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.of(context).disableAnimations) return widget.child;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Transform.scale(
        scale: 1 + (_controller.value * widget.amplitude),
        child: child,
      ),
      child: widget.child,
    );
  }
}
