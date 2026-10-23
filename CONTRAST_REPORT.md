# Contrast checks

Machine-readable measurements for the screen palette. This is a bounded token check, not an accessibility certification.

```json
{
  "schemaVersion": 1,
  "checkedOn": "2026-10-22",
  "method": "WCAG relative luminance, sRGB solid color pairs; ratios rounded to two decimals",
  "scope": "Specified color tokens only; this is not whole-app WCAG certification",
  "pairs": [
    {
      "id": "body",
      "foreground": "#302536",
      "background": "#faf8fb",
      "ratio": 13.77,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "muted_on_white",
      "foreground": "#655b6c",
      "background": "#ffffff",
      "ratio": 6.43,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "muted_on_soft",
      "foreground": "#655b6c",
      "background": "#f0eaf5",
      "ratio": 5.45,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "primary_button",
      "foreground": "#ffffff",
      "background": "#755486",
      "ratio": 6.23,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "hero_lightest_endpoint",
      "foreground": "#ffffff",
      "background": "#82618f",
      "ratio": 5.18,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "navigation",
      "foreground": "#756c7d",
      "background": "#ffffff",
      "ratio": 5,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "navigation_hover_base",
      "foreground": "#756c7d",
      "background": "#f7f3fa",
      "ratio": 4.56,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "tracking_link_hover",
      "foreground": "#755486",
      "background": "#f4f0f7",
      "ratio": 5.54,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "demo_notice",
      "foreground": "#73617f",
      "background": "#f3eef6",
      "ratio": 4.91,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "learn_description",
      "foreground": "#6e5c76",
      "background": "#eee6f1",
      "ratio": 4.98,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "logged_date",
      "foreground": "#8d5751",
      "background": "#f6dfdc",
      "ratio": 4.57,
      "minimumRatio": 4.5,
      "passes": true
    },
    {
      "id": "input_boundary",
      "foreground": "#9b87a6",
      "background": "#ffffff",
      "ratio": 3.28,
      "minimumRatio": 3,
      "passes": true
    },
    {
      "id": "selected_control_boundary",
      "foreground": "#755486",
      "background": "#f2ecf7",
      "ratio": 5.38,
      "minimumRatio": 3,
      "passes": true
    },
    {
      "id": "focus_on_soft",
      "foreground": "#674574",
      "background": "#f0eaf5",
      "ratio": 6.64,
      "minimumRatio": 3,
      "passes": true
    },
    {
      "id": "unchecked_toggle",
      "foreground": "#8c7b96",
      "background": "#ffffff",
      "ratio": 3.9,
      "minimumRatio": 3,
      "passes": true
    },
    {
      "id": "predicted_calendar_border",
      "foreground": "#80608f",
      "background": "#fbf8fe",
      "ratio": 5.01,
      "minimumRatio": 3,
      "passes": true
    },
    {
      "id": "cycle_chart_fill",
      "foreground": "#8c6e9c",
      "background": "#f7f3f9",
      "ratio": 3.97,
      "minimumRatio": 3,
      "passes": true
    },
    {
      "id": "period_chart_fill",
      "foreground": "#9f6259",
      "background": "#f7f3f9",
      "ratio": 4.39,
      "minimumRatio": 3,
      "passes": true
    }
  ],
  "limits": [
    "These are static CSS token calculations, not rendered pixel measurements.",
    "The hero measurement uses the lightest gradient endpoint; decorative overlay shapes need browser inspection.",
    "Disabled controls and decorative icons were not treated as essential text.",
    "Only eyebrow/nav-group metadata stays below 1rem; body, descriptive text and controls use at least 1rem.",
    "A limited headless Chromium smoke at 360 CSS pixels found no horizontal overflow in the tested English/Hindi views, including largest text and high contrast; this does not measure rendered contrast or fixed-element overlap across all routes.",
    "Ten keyboard-tab controls were spot-checked for non-empty accessible names; exhaustive keyboard/focus-order and screen-reader checks, including on physical devices, remain outstanding.",
    "Print CSS intentionally retains compact paper sizes; screen font-size guarantees do not apply to print."
  ]
}
```
