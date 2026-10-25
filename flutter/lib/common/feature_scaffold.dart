import 'package:flutter/material.dart';

import 'bloom_catalog.dart';
import 'custom_theme.dart';

/// Shared content framing for feature pages hosted inside the main Bloom shell.
class FeatureScaffold extends StatelessWidget {
  const FeatureScaffold({
    super.key,
    required this.title,
    required this.child,
    this.kicker,
    this.subtitle,
    this.actions = const [],
  });
  final String title;
  final String? kicker;
  final String? subtitle;
  final Widget child;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(20, 15, 20, 30),
    children: [
      if (kicker != null)
        Text(
          kicker!.toUpperCase(),
          style: Theme.of(context).textTheme.labelLarge
              ?.copyWith(color: BloomTheme.plum, letterSpacing: 1.05),
        ),
      if (kicker != null) const SizedBox(height: 5),
      Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ),
          if (actions.isNotEmpty) ...actions,
        ],
      ),
      if (subtitle != null)
        Padding(
          padding: const EdgeInsets.only(top: 7, bottom: 16),
          child: Text(subtitle!, style: Theme.of(context).textTheme.bodyMedium),
        ),
      child,
    ],
  );
}

class BloomCard extends StatelessWidget {
  const BloomCard({
    super.key,
    required this.child,
    this.title,
    this.subtitle,
    this.color,
  });
  final String? title;
  final String? subtitle;
  final Color? color;
  final Widget child;
  @override
  Widget build(BuildContext context) => Card(
    color: color,
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null)
            Text(title!, style: Theme.of(context).textTheme.titleMedium),
          if (subtitle != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                subtitle!,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          if (title != null || subtitle != null) const SizedBox(height: 12),
          child,
        ],
      ),
    ),
  );
}

class BloomInfoBanner extends StatelessWidget {
  const BloomInfoBanner({
    super.key,
    required this.text,
    this.icon = Icons.info_outline_rounded,
    this.color = BloomTheme.lilac,
  });
  final String text;
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: BloomTheme.plum, size: 19),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: const TextStyle(height: 1.5))),
      ],
    ),
  );
}

String bloomText(String key, String language) =>
    BloomCatalog.instance.t(key, language);
