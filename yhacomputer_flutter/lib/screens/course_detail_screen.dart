import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/course.dart';
import '../models/subject.dart';
import '../widgets/nav_bar.dart';
import '../theme/app_theme.dart';

class CourseDetailScreen extends StatefulWidget {
  final int? courseId;
  const CourseDetailScreen({super.key, this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  bool loading = true;
  String error = '';
  Course? course;
  List<Subject> courseSubjects = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      loading = true;
      error = '';
    });
    try {
      final data = await ApiService.fetchAll();
      final courses = data['courses'] as List<Course>;
      final subjects = data['subjects'] as List<Subject>;
      final loadedCourse = courses.firstWhere(
        (c) => c.id == widget.courseId,
        orElse: () => Course(title: ''),
      );
      final loadedSubjects = subjects
          .where((subject) => subject.courseId == loadedCourse.id)
          .toList();
      if (!mounted) return;
      setState(() {
        course = loadedCourse;
        courseSubjects = loadedSubjects;
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  String get imageUrl {
    if (course == null || course!.image == null || course!.image!.isEmpty) {
      return '';
    }
    final v = course!.image!;
    if (v.startsWith('http') || v.startsWith('data:')) return v;
    return '${ApiService.baseUrl}/${v.replaceAll(RegExp(r'^/'), '')}';
  }

  Widget _buildCourseImage(String url) {
    if (url.startsWith('data:')) {
      final parts = url.split(',');
      if (parts.length == 2) {
        final bytes = base64Decode(parts[1]);
        return ClipRRect(
          borderRadius: BorderRadius.vertical(
            bottom: Radius.circular(AppDimens.cardRadius),
          ),
          child: Image.memory(
            bytes,
            width: double.infinity,
            height: AppDimens.imageHeight + 40,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(),
          ),
        );
      }
    }
    return ClipRRect(
      borderRadius: BorderRadius.vertical(
        bottom: Radius.circular(AppDimens.cardRadius),
      ),
      child: Image.network(
        url,
        width: double.infinity,
        height: AppDimens.imageHeight + 40,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (error.isNotEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course')),
        body: Center(child: Text('Error: $error')),
      );
    }
    if (course == null || course!.title.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.search_off_outlined,
                size: 64,
                color: AppColors.onSurface.withValues(alpha: 0.3),
              ),
              const SizedBox(height: 16),
              Text(
                'Course not found.',
                style: AppTextStyles.bodyLarge,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Back to courses'),
              ),
            ],
          ),
        ),
      );
    }

    final badges = course!.badgeList;

    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  children: [
                    if (imageUrl.isNotEmpty)
                      _buildCourseImage(imageUrl)
                    else
                      Container(
                        height: AppDimens.imageHeight + 40,
                        width: double.infinity,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppColors.imageGradientStart,
                              AppColors.imageGradientEnd,
                            ],
                          ),
                        ),
                        child: Center(
                          child: Text(
                            course!.title.isNotEmpty
                                ? course!.title[0].toUpperCase()
                                : 'Y',
                            style: const TextStyle(
                              fontSize: 64,
                              fontWeight: FontWeight.w900,
                              color: Colors.white70,
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 12,
                      left: 12,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.shadow,
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
                        ),
                      ),
                    ),
                  ],
                ),
                Transform.translate(
                  offset: const Offset(0, -20),
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: Container(
                      width: 48,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Course overview',
                        style: AppTextStyles.labelMedium.copyWith(
                          color: AppColors.primary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        course!.title,
                        style: AppTextStyles.displayMedium,
                      ),
                      if (badges.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: badges
                              .map((b) => AppBadge(text: b))
                              .toList(),
                        ),
                      ],
                      if (course!.price != null && course!.price!.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        AppPriceCard(price: course!.price!),
                      ],
                      if (course!.description != null &&
                          course!.description!.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Text(
                          course!.description!,
                          style: AppTextStyles.bodyLarge.copyWith(height: 1.7),
                        ),
                      ],
                      if (courseSubjects.isNotEmpty) ...[
                        const SizedBox(height: 28),
                        Text(
                          'Subjects',
                          style: AppTextStyles.titleLarge,
                        ),
                        const SizedBox(height: 14),
                        ...courseSubjects.map(
                          (subject) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(
                                  Icons.check_circle,
                                  color: AppColors.success,
                                  size: 22,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        subject.name,
                                        style: AppTextStyles.bodyMedium.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      if (subject.description != null && subject.description!.isNotEmpty) ...[
                                        const SizedBox(height: 3),
                                        Text(
                                          subject.description!,
                                          style: AppTextStyles.bodyMedium.copyWith(height: 1.5),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 28),
                      Row(
                        children: [
                          Expanded(
                            child: FilledButton(
                              onPressed: () =>
                                  Navigator.pushNamed(context, '/contact'),
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
                                ),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Ask about enrollment'),
                                  SizedBox(width: 6),
                                  Icon(Icons.arrow_forward, size: 18),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () =>
                                  Navigator.pushNamed(context, '/courses'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.onSurface,
                                side: const BorderSide(color: AppColors.border),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
                                ),
                              ),
                              child: const Text('Browse more courses'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 28),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: const NavBar(),
    );
  }
}

class AppPriceCard extends StatelessWidget {
  final String price;
  const AppPriceCard({super.key, required this.price});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.primaryContainer,
      border: BorderSide.none,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Text(
            price,
            style: AppTextStyles.titleLarge.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '/ course',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
