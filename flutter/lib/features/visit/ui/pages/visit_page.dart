import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../common/bloom_catalog.dart';
import '../../../../common/date_utils.dart';
import '../../../../common/feature_scaffold.dart';
import '../../../log/services/diary_repository.dart';
import '../../services/visit_summary_service.dart';

class VisitPage extends StatelessWidget {
  const VisitPage({super.key, required this.diary});
  final DiaryRepository diary;

  @override
  Widget build(BuildContext context) {
    final catalog = BloomCatalog.instance;
    final lang = diary.language;
    final summary = buildVisitSummary(diary.snapshot);
    String t(String key, [Map<String, Object?> vars = const {}]) =>
        catalog.t(key, lang, vars);
    final from = summary['dateRange']['from'] as String?;
    final to = summary['dateRange']['to'] as String?;
    final cycles = (summary['cycles'] as List)
        .map<Widget>(
          (cycle) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.repeat_rounded),
            title: Text(
              t('visit.cycleLine', {
                'from': formatBloomDate(
                  cycle['start'] as String,
                  lang,
                  withYear: true,
                ),
                'count': cycle['length'],
              }),
            ),
            subtitle: Text('${cycle['start']} – ${cycle['end']}'),
          ),
        )
        .toList();
    final periods = (summary['periods'] as List)
        .map<Widget>(
          (period) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.water_drop_outlined),
            title: Text(
              t('visit.periodLine', {
                'from': formatBloomDate(period['start'] as String, lang),
                'to': formatBloomDate(period['end'] as String, lang),
                'count': period['length'],
              }),
            ),
            subtitle: period['ongoing'] == true
                ? Text(t('visit.ongoing'))
                : null,
          ),
        )
        .toList();
    final symptomCounts = (summary['symptomCounts'] as List)
        .map<Widget>(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(catalog.t('tracking.symptom.${item['id']}', lang)),
            trailing: Text('${item['count']}'),
          ),
        )
        .toList();
    final symptomIntensity = (summary['symptomIntensityCounts'] as List)
        .map<Widget>(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(catalog.t('tracking.symptom.${item['id']}', lang)),
            subtitle: Text(
              t('visit.symptomIntensityCount', {
                'mild': item['mild'],
                'moderate': item['moderate'],
                'strong': item['strong'],
                'ratedDays': item['ratedDays'],
              }),
            ),
          ),
        )
        .toList();
    final medicines = (summary['medicines'] as List)
        .map<Widget>(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.medication_outlined),
            title: Text(item['name'] as String),
            subtitle: Text(
              (item['dates'] as List)
                  .map((date) => formatBloomDate(date as String, lang))
                  .join(' · '),
            ),
          ),
        )
        .toList();
    final guidance = (summary['guidance'] as List)
        .map<Widget>(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.favorite_outline_rounded),
            title: Text(t('guidance.${item['id']}.title')),
            subtitle: Text(
              (item['dates'] as List)
                  .map((date) => formatBloomDate(date as String, lang))
                  .join(' · '),
            ),
          ),
        )
        .toList();

    return FeatureScaffold(
      title: t('visit.title'),
      kicker: t('doctor.prepare'),
      subtitle: t('visit.subtitle'),
      actions: [
        IconButton(
          tooltip: t('visit.pdf'),
          onPressed: () => _printPdf(summary, catalog, lang),
          icon: const Icon(Icons.picture_as_pdf_outlined),
        ),
        IconButton(
          tooltip: t('visit.fullRecord'),
          onPressed: () =>
              Share.share(_jsonForShare(summary), subject: t('visit.title')),
          icon: const Icon(Icons.ios_share_rounded),
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BloomInfoBanner(text: t('visit.overview')),
          const SizedBox(height: 12),
          BloomCard(
            title: t('visit.coverage', {
              'count': summary['loggedDays'],
              'from': from == null
                  ? '—'
                  : formatBloomDate(from, lang, withYear: true),
              'to': to == null
                  ? '—'
                  : formatBloomDate(to, lang, withYear: true),
            }),
            child: Row(
              children: [
                const Icon(Icons.event_note_rounded),
                const SizedBox(width: 9),
                Text('${summary['loggedDays']} ${t('visit.logs')}'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _listCard(t('visit.history'), cycles, t('visit.none')),
          const SizedBox(height: 12),
          _listCard(t('visit.periods'), periods, t('visit.none')),
          const SizedBox(height: 12),
          BloomCard(
            title: t('visit.painSummary'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t('visit.maxPain', {
                    'pain': (summary['pain']['max'] as num).round(),
                  }),
                ),
                Text(
                  t('visit.disrupted', {
                    'count': summary['pain']['daysDisrupted'],
                  }),
                ),
                Text(
                  t('visit.unrelieved', {
                    'count': summary['pain']['daysUnrelieved'],
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _listCard(t('visit.symptomCounts'), symptomCounts, t('visit.none')),
          const SizedBox(height: 12),
          _listCard(
            t('visit.symptomIntensity'),
            symptomIntensity,
            t('visit.none'),
          ),
          const SizedBox(height: 12),
          _listCard(t('visit.medicineHistory'), medicines, t('visit.none')),
          const SizedBox(height: 12),
          _listCard(t('visit.careEvidence'), guidance, t('visit.none')),
          const SizedBox(height: 12),
          BloomCard(
            title: t('visit.questions'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: ['q1', 'q2', 'q3']
                  .map(
                    (id) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text('•  ${t('visit.$id')}'),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 12),
          BloomInfoBanner(text: t('visit.noDiagnosis')),
        ],
      ),
    );
  }

  Widget _listCard(String title, List<Widget> rows, String empty) => BloomCard(
    title: title,
    child: rows.isEmpty ? Text(empty) : Column(children: rows),
  );

  String _jsonForShare(Map<String, dynamic> summary) =>
      const JsonEncoder.withIndent('  ').convert(summary);

  Future<void> _printPdf(
    Map<String, dynamic> summary,
    BloomCatalog catalog,
    String lang,
  ) async {
    final document = pw.Document();
    String t(String key, [Map<String, Object?> vars = const {}]) =>
        catalog.t(key, lang, vars);
    document.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(34),
        build: (context) => [
          pw.Text(
            t('app.name'),
            style: pw.TextStyle(
              fontSize: 12,
              color: PdfColor.fromHex('#755486'),
            ),
          ),
          pw.SizedBox(height: 9),
          pw.Text(
            t('visit.title'),
            style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 5),
          pw.Text(t('visit.subtitle')),
          pw.SizedBox(height: 18),
          _pdfSection(
            t('visit.overview'),
            '${summary['loggedDays']} ${t('visit.logs')}',
          ),
          _pdfSection(
            t('visit.history'),
            (summary['cycles'] as List)
                .map((cycle) => '${cycle['start']} · ${cycle['length']} days')
                .join('\n')
                .ifEmpty(t('visit.none')),
          ),
          _pdfSection(
            t('visit.periods'),
            (summary['periods'] as List)
                .map(
                  (period) =>
                      '${period['start']} – ${period['end']} · ${period['length']} days',
                )
                .join('\n')
                .ifEmpty(t('visit.none')),
          ),
          _pdfSection(
            t('visit.painSummary'),
            '${t('visit.maxPain', {'pain': (summary['pain']['max'] as num).round()})}\n${t('visit.disrupted', {'count': summary['pain']['daysDisrupted']})}\n${t('visit.unrelieved', {'count': summary['pain']['daysUnrelieved']})}',
          ),
          _pdfSection(
            t('visit.symptomCounts'),
            (summary['symptomCounts'] as List)
                .map(
                  (item) =>
                      '${catalog.t('tracking.symptom.${item['id']}', lang)}: ${item['count']}',
                )
                .join('\n')
                .ifEmpty(t('visit.none')),
          ),
          _pdfSection(
            t('visit.medicineHistory'),
            (summary['medicines'] as List)
                .map(
                  (item) =>
                      '${item['name']}: ${(item['dates'] as List).join(', ')}',
                )
                .join('\n')
                .ifEmpty(t('visit.none')),
          ),
          pw.SizedBox(height: 14),
          pw.Text(
            t('visit.noDiagnosis'),
            style: const pw.TextStyle(fontSize: 9),
          ),
        ],
      ),
    );
    final bytes = await document.save();
    await Printing.layoutPdf(onLayout: (_) async => Uint8List.fromList(bytes));
  }

  pw.Widget _pdfSection(String title, String body) => pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 13),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          title,
          style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold),
        ),
        pw.SizedBox(height: 4),
        pw.Text(body, style: const pw.TextStyle(fontSize: 10, lineSpacing: 2)),
      ],
    ),
  );
}

extension on String {
  String ifEmpty(String fallback) => isEmpty ? fallback : this;
}
