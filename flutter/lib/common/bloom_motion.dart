import 'package:flutter/material.dart';

/// Gentle fade-and-rise motion shared by hero cards, answers, and calendar days.
class BloomEntrance extends StatelessWidget {
  const BloomEntrance({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 600),
    this.offset = 14,
  });

  final Widget child;
  final Duration duration;
  final double offset;

  @override
  Widget build(BuildContext context) {
    final effectiveDuration = MediaQuery.of(context).disableAnimations
        ? Duration.zero
        : duration;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: effectiveDuration,
      curve: Curves.easeOutCubic,
      builder: (context, value, child) => Opacity(
        opacity: value,
        child: Transform.translate(
          offset: Offset(0, (1 - value) * offset),
          child: child,
        ),
      ),
      child: child,
    );
  }
}
