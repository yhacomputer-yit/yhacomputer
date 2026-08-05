import 'dart:convert';
import 'package:flutter/material.dart';

class AppColors {
  static const primary = Color(0xFF2563EB);
  static const primaryLight = Color(0xFF60A5FA);
  static const primaryContainer = Color(0xFFE0F2FE);

  static const background = Color(0xFFF8FAFC);
  static const surface = Color(0xFFFFFFFF);

  static const onSurface = Color(0xFF1E293B);
  static const onSurfaceVariant = Color(0xFF64748B);
  static const onSurfaceDisabled = Color(0xFFCBD5E1);

  static const accent = Color(0xFFF59E0B);
  static const accentContainer = Color(0xFFFFF4E5);

  static const border = Color(0xFFE2E8F0);

  static const error = Color(0xFFEF4444);
  static const errorContainer = Color(0xFFFFF1F1);

  static const success = Color(0xFF10B981);

  static const shadow = Color(0x0D1E293B);

  static const imageGradientStart = Color(0xFF1E293B);
  static const imageGradientEnd = Color(0xFF0F172A);
}

class AppTextStyles {
  static const displayLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w900,
    height: 1.1,
    color: AppColors.onSurface,
  );

  static const displayMedium = TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w800,
    height: 1.2,
    color: AppColors.onSurface,
  );

  static const titleLarge = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    height: 1.3,
    color: AppColors.onSurface,
  );

  static const titleMedium = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    height: 1.4,
    color: AppColors.onSurface,
  );

  static const titleSmall = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: 1.4,
    color: AppColors.onSurface,
  );

  static const bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.6,
    color: AppColors.onSurface,
  );

  static const bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.6,
    color: AppColors.onSurface,
  );

  static const bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.onSurfaceVariant,
  );

  static const labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.08,
    color: AppColors.onSurfaceVariant,
  );

  static const labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.1,
    color: AppColors.accent,
  );

  static const labelSmall = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: AppColors.onSurfaceVariant,
  );
}

class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;
}

class AppDimens {
  static const cardRadius = 16.0;
  static const inputRadius = 12.0;
  static const buttonRadius = 12.0;
  static const badgeRadius = 999.0;
  static const imageHeight = 200.0;
  static const sectionHeaderHeight = 92.0;
}

class AppTheme {
  static ThemeData light = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.light,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.accent,
      onSecondary: Colors.white,
      surface: AppColors.surface,
      onSurface: AppColors.onSurface,
      onSurfaceVariant: AppColors.onSurfaceVariant,
      error: AppColors.error,
      onError: Colors.white,
      errorContainer: AppColors.errorContainer,
      outline: AppColors.border,
      shadow: AppColors.shadow,
    ),
    scaffoldBackgroundColor: AppColors.background,
    textTheme: TextTheme(
      displayLarge: AppTextStyles.displayLarge,
      displayMedium: AppTextStyles.displayMedium,
      titleLarge: AppTextStyles.titleLarge,
      titleMedium: AppTextStyles.titleMedium,
      titleSmall: AppTextStyles.titleSmall,
      bodyLarge: AppTextStyles.bodyLarge,
      bodyMedium: AppTextStyles.bodyMedium,
      bodySmall: AppTextStyles.bodySmall,
      labelLarge: AppTextStyles.labelLarge,
      labelMedium: AppTextStyles.labelMedium,
      labelSmall: AppTextStyles.labelSmall,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.onSurface,
      elevation: 0,
      titleTextStyle: AppTextStyles.titleLarge,
      centerTitle: true,
      actionsIconTheme: const IconThemeData(color: AppColors.onSurface),
      iconTheme: const IconThemeData(color: AppColors.onSurface),
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
      ),
      shadowColor: AppColors.shadow,
      surfaceTintColor: Colors.transparent,
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.surface,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.onSurfaceVariant,
      selectedLabelStyle: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 12,
      ),
      unselectedLabelStyle: const TextStyle(
        fontWeight: FontWeight.w500,
        fontSize: 12,
      ),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.primaryContainer,
      elevation: 8,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppDimens.inputRadius),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppDimens.inputRadius),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppDimens.inputRadius),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      labelStyle: const TextStyle(color: AppColors.onSurfaceVariant),
      hintStyle: const TextStyle(color: AppColors.onSurfaceDisabled),
      prefixIconColor: AppColors.onSurfaceVariant,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
  );
}

class SectionHeader extends StatelessWidget {
  final String label;
  final String title;
  final String actionLabel;
  final VoidCallback? onAction;
  const SectionHeader({
    super.key,
    required this.label,
    required this.title,
    this.actionLabel = 'View all',
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 6,
                height: 20,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 8),
              Text(label, style: AppTextStyles.labelMedium),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: AppTextStyles.displayMedium.copyWith(
                  fontSize: 22,
                  height: 1.2,
                ),
              ),
              if (onAction != null)
                TextButton(
                  onPressed: onAction,
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.onSurfaceVariant,
                  ),
                  child: Text(actionLabel),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class AppBadge extends StatelessWidget {
  final String text;
  final Color? backgroundColor;
  final Color? textColor;
  final double fontSize;
  final EdgeInsetsGeometry padding;
  const AppBadge({
    super.key,
    required this.text,
    this.backgroundColor = AppColors.accentContainer,
    this.textColor = const Color(0xFF92400E),
    this.fontSize = 11,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppDimens.badgeRadius),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: fontSize,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.08,
        ),
      ),
    );
  }
}

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final Color? backgroundColor;
  final double radius;
  final BorderSide border;
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.margin = EdgeInsets.zero,
    this.backgroundColor = AppColors.surface,
    this.radius = AppDimens.cardRadius,
    this.border = const BorderSide(color: AppColors.border),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(radius),
        border: Border.fromBorderSide(border),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

class AppImageFallback extends StatelessWidget {
  final String text;
  final double height;
  final double width;
  final BorderRadiusGeometry borderRadius;
  const AppImageFallback({
    super.key,
    required this.text,
    required this.height,
    this.width = double.infinity,
    this.borderRadius = BorderRadius.zero,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: borderRadius,
      child: Container(
        height: height,
        width: width,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.imageGradientStart, AppColors.imageGradientEnd],
          ),
        ),
        child: Center(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.w900,
              color: Colors.white70,
            ),
          ),
        ),
      ),
    );
  }
}

class AppNetworkImage extends StatelessWidget {
  final String imageUrl;
  final String fallbackText;
  final double height;
  final double width;
  final BoxFit fit;
  final BorderRadiusGeometry borderRadius;
  const AppNetworkImage({
    super.key,
    required this.imageUrl,
    required this.fallbackText,
    this.height = 200,
    this.width = double.infinity,
    this.fit = BoxFit.cover,
    this.borderRadius = BorderRadius.zero,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isNotEmpty) {
      if (imageUrl.startsWith('data:')) {
        final parts = imageUrl.split(',');
        if (parts.length == 2) {
          final bytes = base64Decode(parts[1]);
          return ClipRRect(
            borderRadius: borderRadius,
            child: Image.memory(
              bytes,
              width: width,
              height: height,
              fit: fit,
              errorBuilder: (context, error, stackTrace) => AppImageFallback(
                text: fallbackText,
                height: height,
                width: width,
                borderRadius: borderRadius,
              ),
            ),
          );
        }
      }
      return ClipRRect(
        borderRadius: borderRadius,
        child: Image.network(
          imageUrl,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (context, error, stackTrace) => AppImageFallback(
            text: fallbackText,
            height: height,
            width: width,
            borderRadius: borderRadius,
          ),
        ),
      );
    }
    return AppImageFallback(
      text: fallbackText,
      height: height,
      width: width,
      borderRadius: borderRadius,
    );
  }
}

class AppCircularButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double size;
  const AppCircularButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.backgroundColor,
    this.foregroundColor,
    this.size = 44,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: backgroundColor ?? AppColors.primary,
          foregroundColor: foregroundColor ?? Colors.white,
          padding: EdgeInsets.zero,
          shape: const CircleBorder(),
        ),
        child: Icon(icon, size: 20),
      ),
    );
  }
}

class AppErrorState extends StatelessWidget {
  final String message;
  final String? title;
  const AppErrorState(this.message, {super.key, this.title});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.errorContainer,
      border: BorderSide(color: AppColors.error.withValues(alpha: 0.25)),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text(
            title ?? 'We could not load content.',
            style: AppTextStyles.titleSmall,
          ),
          Text(
            message,
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
          ),
        ],
      ),
    );
  }
}

class AppEmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  const AppEmptyState({
    super.key,
    required this.title,
    required this.subtitle,
    this.icon = Icons.inbox_outlined,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.background,
      border: const BorderSide(color: AppColors.border),
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 48,
            color: AppColors.onSurface.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: AppTextStyles.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: AppTextStyles.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
