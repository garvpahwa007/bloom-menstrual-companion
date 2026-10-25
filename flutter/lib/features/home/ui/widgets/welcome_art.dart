import 'package:flutter/material.dart';

import '../../../../common/bloom_catalog.dart';

/// Decorative counterpart of the React welcome-art panel.
class WelcomeArt extends StatelessWidget {
  const WelcomeArt({super.key, required this.catalog, required this.language});

  final BloomCatalog catalog;
  final String language;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: Container(
      width: double.infinity,
      height: 220,
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0x268B4D63)),
        borderRadius: BorderRadius.circular(26),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFF5F8), Color(0xFFF7DFE7), Color(0xFFF0C7D5)],
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x216F394F),
            blurRadius: 26,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(25),
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.hardEdge,
          children: [
            const Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment(0, -0.15),
                    radius: 0.9,
                    colors: [Color(0xFFFFFAFC), Color(0x00FFF5F8)],
                  ),
                ),
              ),
            ),
            const _WelcomeOrbit(size: 206, opacity: .44),
            const _WelcomeOrbit(size: 152, opacity: .62),
            Padding(
              padding: const EdgeInsets.only(bottom: 56),
              child: Image.asset(
                'assets/images/bloom-logo.png',
                key: const ValueKey('welcome-full-logo'),
                width: 176,
                height: 146,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(
                  Icons.spa_rounded,
                  size: 76,
                  color: Color(0xFF895E70),
                ),
              ),
            ),
            Positioned(
              left: 14,
              right: 14,
              bottom: 11,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xE8FFFAFC),
                    border: Border.all(color: const Color(0x208B4D63)),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    catalog.t('app.tagline', language),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Color(0xFF67485A),
                      fontSize: 12,
                      height: 1.3,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _WelcomeOrbit extends StatelessWidget {
  const _WelcomeOrbit({required this.size, required this.opacity});

  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: size,
    child: DecoratedBox(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: const Color(0xFF8B4D63).withValues(alpha: opacity),
        ),
      ),
    ),
  );
}
