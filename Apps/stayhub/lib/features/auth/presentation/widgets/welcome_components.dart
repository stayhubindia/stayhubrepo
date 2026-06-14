import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

// ── Logo ──────────────────────────────────────────────────────

class WelcomeLogo extends StatelessWidget {
  const WelcomeLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // House icon in green outline style
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(16),
          ),
          child: CustomPaint(
            painter: _HouseIconPainter(),
          ),
        ),
        const SizedBox(height: 12),
        RichText(
          text: const TextSpan(
            children: [
              TextSpan(
                text: 'Stay',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.5,
                ),
              ),
              TextSpan(
                text: 'hub',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HouseIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final cx = size.width / 2;
    final cy = size.height / 2;

    // Roof
    final roofPath = Path()
      ..moveTo(cx - 18, cy - 2)
      ..lineTo(cx, cy - 18)
      ..lineTo(cx + 18, cy - 2);
    canvas.drawPath(roofPath, paint);

    // Walls
    final wallPath = Path()
      ..moveTo(cx - 14, cy - 2)
      ..lineTo(cx - 14, cy + 16)
      ..lineTo(cx + 14, cy + 16)
      ..lineTo(cx + 14, cy - 2);
    canvas.drawPath(wallPath, paint);

    // Door
    final doorPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    final doorPath = Path()
      ..moveTo(cx - 4, cy + 16)
      ..lineTo(cx - 4, cy + 6)
      ..arcToPoint(
        Offset(cx + 4, cy + 6),
        radius: const Radius.circular(4),
      )
      ..lineTo(cx + 4, cy + 16);
    canvas.drawPath(doorPath, doorPaint);

    // Window
    final winPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;
    canvas.drawRect(
      Rect.fromCenter(
          center: Offset(cx, cy + 4), width: 8, height: 7),
      winPaint,
    );
    // Window cross
    canvas.drawLine(
        Offset(cx - 4, cy + 4), Offset(cx + 4, cy + 4), winPaint);
    canvas.drawLine(
        Offset(cx, cy + 0.5), Offset(cx, cy + 7.5), winPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── House Illustration ────────────────────────────────────────

class WelcomeHouseIllustration extends StatelessWidget {
  const WelcomeHouseIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.infinite,
      painter: _HouseScenePainter(),
    );
  }
}

class _HouseScenePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // ── Sky / background tint ─────────────────────────────
    final bgPaint = Paint()
      ..color = const Color(0xFFF0FDF4)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          Rect.fromLTWH(0, 0, w, h), const Radius.circular(20)),
      bgPaint,
    );

    // ── Ground line ───────────────────────────────────────
    final groundPaint = Paint()
      ..color = const Color(0xFFBBF7D0)
      ..style = PaintingStyle.fill;
    canvas.drawRect(Rect.fromLTWH(0, h * 0.78, w, h * 0.22), groundPaint);

    // ── Background buildings (city skyline) ───────────────
    _drawBuilding(canvas, w * 0.05, h * 0.45, 40, h * 0.33,
        const Color(0xFFDCFCE7));
    _drawBuilding(canvas, w * 0.12, h * 0.38, 30, h * 0.40,
        const Color(0xFFDCFCE7));
    _drawBuilding(canvas, w * 0.72, h * 0.42, 35, h * 0.36,
        const Color(0xFFDCFCE7));
    _drawBuilding(canvas, w * 0.80, h * 0.35, 28, h * 0.43,
        const Color(0xFFDCFCE7));

    // ── Trees ─────────────────────────────────────────────
    _drawTree(canvas, w * 0.18, h * 0.72, 22);
    _drawTree(canvas, w * 0.25, h * 0.74, 18);
    _drawTree(canvas, w * 0.70, h * 0.72, 20);
    _drawTree(canvas, w * 0.78, h * 0.74, 16);

    // ── Main house ────────────────────────────────────────
    final houseX = w * 0.32;
    final houseY = h * 0.30;
    final houseW = w * 0.36;
    final houseH = h * 0.48;

    // House body
    final housePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    final houseBorderPaint = Paint()
      ..color = const Color(0xFFBBF7D0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final houseRect =
        RRect.fromRectAndRadius(
            Rect.fromLTWH(houseX, houseY + houseH * 0.28, houseW, houseH * 0.72),
            const Radius.circular(4));
    canvas.drawRRect(houseRect, housePaint);
    canvas.drawRRect(houseRect, houseBorderPaint);

    // Roof
    final roofPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;
    final roofPath = Path()
      ..moveTo(houseX - 8, houseY + houseH * 0.30)
      ..lineTo(houseX + houseW / 2, houseY)
      ..lineTo(houseX + houseW + 8, houseY + houseH * 0.30)
      ..close();
    canvas.drawPath(roofPath, roofPaint);

    // Roof overhang detail
    final roofDetailPaint = Paint()
      ..color = AppColors.primaryDark
      ..style = PaintingStyle.fill;
    final roofDetailPath = Path()
      ..moveTo(houseX - 8, houseY + houseH * 0.30)
      ..lineTo(houseX + houseW + 8, houseY + houseH * 0.30)
      ..lineTo(houseX + houseW + 8, houseY + houseH * 0.34)
      ..lineTo(houseX - 8, houseY + houseH * 0.34)
      ..close();
    canvas.drawPath(roofDetailPath, roofDetailPaint);

    // Windows (2 on upper floor)
    _drawWindow(canvas, houseX + houseW * 0.15,
        houseY + houseH * 0.38, houseW * 0.25, houseH * 0.18);
    _drawWindow(canvas, houseX + houseW * 0.55,
        houseY + houseH * 0.38, houseW * 0.25, houseH * 0.18);

    // Door
    final doorPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;
    final doorW = houseW * 0.22;
    final doorH = houseH * 0.28;
    final doorX = houseX + (houseW - doorW) / 2;
    final doorY = houseY + houseH - doorH;
    final doorPath = Path()
      ..moveTo(doorX, doorY + doorH)
      ..lineTo(doorX, doorY + doorH * 0.3)
      ..arcToPoint(
        Offset(doorX + doorW, doorY + doorH * 0.3),
        radius: Radius.circular(doorW / 2),
      )
      ..lineTo(doorX + doorW, doorY + doorH)
      ..close();
    canvas.drawPath(doorPath, doorPaint);

    // Door handle
    final handlePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
        Offset(doorX + doorW * 0.72, doorY + doorH * 0.6), 2.5, handlePaint);

    // ── Location pin ──────────────────────────────────────
    _drawLocationPin(canvas, houseX + houseW / 2, houseY - 16);
  }

  void _drawBuilding(Canvas canvas, double x, double y, double w, double h,
      Color color) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawRect(Rect.fromLTWH(x, y, w, h), paint);

    // Windows on building
    final winPaint = Paint()
      ..color = const Color(0xFFA7F3D0)
      ..style = PaintingStyle.fill;
    for (int row = 0; row < 3; row++) {
      for (int col = 0; col < 2; col++) {
        canvas.drawRect(
          Rect.fromLTWH(
            x + 4 + col * (w / 2 - 2),
            y + 6 + row * (h / 3 - 2),
            w / 2 - 8,
            h / 3 - 8,
          ),
          winPaint,
        );
      }
    }
  }

  void _drawTree(Canvas canvas, double x, double y, double r) {
    // Trunk
    final trunkPaint = Paint()
      ..color = const Color(0xFF86EFAC)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
        Rect.fromLTWH(x - 3, y - r * 0.3, 6, r * 0.5), trunkPaint);

    // Foliage (3 circles)
    final foliagePaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(x, y - r), r * 0.7, foliagePaint);
    canvas.drawCircle(Offset(x - r * 0.5, y - r * 0.5), r * 0.55,
        foliagePaint..color = AppColors.primaryDark);
    canvas.drawCircle(Offset(x + r * 0.5, y - r * 0.5), r * 0.55,
        foliagePaint..color = AppColors.primary);
  }

  void _drawWindow(
      Canvas canvas, double x, double y, double w, double h) {
    final framePaint = Paint()
      ..color = const Color(0xFFBBF7D0)
      ..style = PaintingStyle.fill;
    final glassPaint = Paint()
      ..color = const Color(0xFFE0F2FE)
      ..style = PaintingStyle.fill;
    final dividerPaint = Paint()
      ..color = const Color(0xFFBBF7D0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(x, y, w, h), const Radius.circular(3)),
        framePaint);
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(x + 2, y + 2, w - 4, h - 4),
            const Radius.circular(2)),
        glassPaint);
    // Cross divider
    canvas.drawLine(
        Offset(x + w / 2, y + 2), Offset(x + w / 2, y + h - 2), dividerPaint);
    canvas.drawLine(
        Offset(x + 2, y + h / 2), Offset(x + w - 2, y + h / 2), dividerPaint);
  }

  void _drawLocationPin(Canvas canvas, double cx, double cy) {
    final pinPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;

    // Pin body
    final pinPath = Path()
      ..addOval(Rect.fromCenter(
          center: Offset(cx, cy - 10), width: 20, height: 20))
      ..moveTo(cx - 4, cy - 4)
      ..lineTo(cx, cy + 4)
      ..lineTo(cx + 4, cy - 4)
      ..close();
    canvas.drawPath(pinPath, pinPaint);

    // Inner white dot
    canvas.drawCircle(
        Offset(cx, cy - 10), 5, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── Auth Button ───────────────────────────────────────────────

class AuthButton extends StatelessWidget {
  const AuthButton({
    super.key,
    required this.onTap,
    required this.icon,
    required this.label,
    required this.borderColor,
    required this.labelColor,
    this.trailing,
  });

  final VoidCallback? onTap;
  final Widget icon;
  final String label;
  final Color borderColor;
  final Color labelColor;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        opacity: 1.0,
        duration: const Duration(milliseconds: 200),
        child: Container(
          height: 54,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: borderColor, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(width: 24, height: 24, child: icon),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: labelColor,
                  letterSpacing: 0.1,
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 8),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Google Icon ───────────────────────────────────────────────

class GoogleIcon extends StatelessWidget {
  const GoogleIcon({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _GoogleIconPainter());
  }
}

class _GoogleIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width * 0.45;

    // Blue arc (right)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      -0.3,
      1.9,
      false,
      Paint()
        ..color = const Color(0xFF4285F4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
    // Red arc (top-left)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      3.5,
      1.1,
      false,
      Paint()
        ..color = const Color(0xFFEA4335)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
    // Yellow arc (bottom-left)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      4.6,
      0.8,
      false,
      Paint()
        ..color = const Color(0xFFFBBC05)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
    // Green arc (bottom)
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      5.4,
      0.7,
      false,
      Paint()
        ..color = const Color(0xFF34A853)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );

    // Horizontal bar for the "G"
    canvas.drawLine(
      Offset(cx, cy),
      Offset(cx + r, cy),
      Paint()
        ..color = const Color(0xFF4285F4)
        ..strokeWidth = 3,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── Phone Icon ────────────────────────────────────────────────

class PhoneIcon extends StatelessWidget {
  const PhoneIcon({super.key});

  @override
  Widget build(BuildContext context) {
    return const Icon(
      Icons.smartphone_outlined,
      color: AppColors.primary,
      size: 22,
    );
  }
}

// ── Role Picker Sheet ─────────────────────────────────────────

class RolePickerSheet extends StatefulWidget {
  const RolePickerSheet({super.key, required this.onSelected});
  final void Function(String role) onSelected;

  @override
  State<RolePickerSheet> createState() => _RolePickerSheetState();
}

class _RolePickerSheetState extends State<RolePickerSheet> {
  String _role = 'TENANT';

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'I am signing in as',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Existing users — your role is already saved.',
            style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              _RoleOption(
                label: 'Tenant',
                subtitle: 'Looking to rent',
                icon: Icons.search_rounded,
                selected: _role == 'TENANT',
                onTap: () => setState(() => _role = 'TENANT'),
              ),
              const SizedBox(width: 12),
              _RoleOption(
                label: 'Owner',
                subtitle: 'Have a property',
                icon: Icons.home_work_outlined,
                selected: _role == 'OWNER',
                onTap: () => setState(() => _role = 'OWNER'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => widget.onSelected(_role),
              child: const Text('Continue with Google'),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoleOption extends StatelessWidget {
  const _RoleOption({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.primaryLight
                : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.primary : const Color(0xFFE2E8F0),
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: selected ? AppColors.primary : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon,
                    color: selected ? Colors.white : const Color(0xFF94A3B8),
                    size: 22),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: selected
                      ? AppColors.primary
                      : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                    fontSize: 11, color: Color(0xFF94A3B8)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Terms Footer ──────────────────────────────────────────────

class WelcomeTermsFooter extends StatelessWidget {
  const WelcomeTermsFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(
        style: const TextStyle(
          fontSize: 12,
          color: Color(0xFF94A3B8),
          height: 1.6,
        ),
        children: [
          const TextSpan(text: 'By continuing, you agree to our\n'),
          TextSpan(
            text: 'Terms & Conditions',
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w500,
            ),
            recognizer: TapGestureRecognizer()..onTap = () {},
          ),
          const TextSpan(text: ' and '),
          TextSpan(
            text: 'Privacy Policy',
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w500,
            ),
            recognizer: TapGestureRecognizer()..onTap = () {},
          ),
        ],
      ),
    );
  }
}
