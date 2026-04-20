import 'package:flutter/material.dart';

/// Brand color palette — matches the StayHub web (#16A34A green).
class AppColors {
  AppColors._();

  // ── Primary ──────────────────────────────────────────────
  static const Color primary = Color(0xFF16A34A);
  static const Color primaryDark = Color(0xFF15803D);
  static const Color primaryDeep = Color(0xFF14532D);
  static const Color primaryLight = Color(0xFFDCFCE7);
  static const Color primaryMid = Color(0xFF4ADE80);
  static const Color onPrimary = Colors.white;

  // ── Gradient ─────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF16A34A), Color(0xFF15803D)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF14532D), Color(0xFF16A34A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ── Background / Surface ───────────────────────────
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Colors.white;
  static const Color surfaceVariant = Color(0xFFF1F5F9);
  static const Color surfaceElevated = Color(0xFFFFFFFF);

  // ── Text ─────────────────────────────────────────
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textHint = Color(0xFF94A3B8);
  static const Color textOnDark = Colors.white;

  // ── Border / Divider ──────────────────────────────
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderFocus = Color(0xFF16A34A);
  static const Color divider = Color(0xFFF1F5F9);

  // ── Status ──────────────────────────────────────
  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFFDCFCE7);
  static const Color info = Color(0xFF0EA5E9);
  static const Color infoLight = Color(0xFFE0F2FE);

  // ── Property status badges ──────────────────────────
  static const Color statusActive = Color(0xFF16A34A);
  static const Color statusActiveLight = Color(0xFFDCFCE7);
  static const Color statusPending = Color(0xFFF59E0B);
  static const Color statusPendingLight = Color(0xFFFEF3C7);
  static const Color statusRented = Color(0xFF0EA5E9);
  static const Color statusRentedLight = Color(0xFFE0F2FE);
  static const Color statusDraft = Color(0xFF94A3B8);
  static const Color statusDraftLight = Color(0xFFF1F5F9);
  static const Color statusRejected = Color(0xFFDC2626);
  static const Color statusRejectedLight = Color(0xFFFEE2E2);

  // ── Shadow ──────────────────────────────────────
  static const Color shadow = Color(0x0A0F172A);
  static const Color shadowMd = Color(0x140F172A);
  static const Color shadowLg = Color(0x1E0F172A);

  // Convenience shadow lists
  static const List<BoxShadow> cardShadow = [
    BoxShadow(color: Color(0x0A0F172A), blurRadius: 6, offset: Offset(0, 2)),
    BoxShadow(color: Color(0x060F172A), blurRadius: 2, offset: Offset(0, 1)),
  ];
  static const List<BoxShadow> elevatedShadow = [
    BoxShadow(color: Color(0x140F172A), blurRadius: 16, offset: Offset(0, 4)),
    BoxShadow(color: Color(0x080F172A), blurRadius: 4, offset: Offset(0, 1)),
  ];
}
