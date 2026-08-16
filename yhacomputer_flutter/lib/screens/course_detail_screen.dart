import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/student_auth_service.dart';
import '../models/course.dart';
import '../models/subject.dart';
import '../theme/app_theme.dart';
import '../utils/course_formatters.dart';

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
  bool enrollmentSubmitting = false;

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
      if (widget.courseId == null) {
        throw Exception('Course id is missing.');
      }
      final data = await ApiService.fetchCourseDetail(widget.courseId!);
      final courseData = data?['data'];
      final related = data?['related'] as Map? ?? const {};
      final subjectData = related['subjects'] as List? ?? const [];
      final loadedCourse = courseData is Map<String, dynamic>
          ? Course.fromJson(courseData)
          : Course(title: '');
      final loadedSubjects = subjectData
          .map(
            (subject) =>
                Subject.fromJson(Map<String, dynamic>.from(subject as Map)),
          )
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

  Future<void> _requestEnrollment() async {
    final selectedCourse = course;
    if (selectedCourse?.id == null) return;
    if (!selectedCourse!.enrollmentOpen) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enrollment is currently closed for this course.')),
      );
      return;
    }
    if (!StudentAuthService.instance.isSignedIn) {
      await Navigator.pushNamed(
        context,
        '/student-login',
        arguments: {'course_id': selectedCourse.id},
      );
      return;
    }

    final note = TextEditingController();
    try {
      final confirmed = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        builder: (context) => Padding(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.md,
            AppSpacing.md,
            MediaQuery.of(context).viewInsets.bottom + AppSpacing.md,
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Request enrollment', style: AppTextStyles.titleLarge),
                const SizedBox(height: 6),
                Text('Send a request for ${selectedCourse.title}. YHA will review it in the Admin Dashboard.', style: AppTextStyles.bodyMedium),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: note,
                  minLines: 2,
                  maxLines: 4,
                  maxLength: 1000,
                  decoration: const InputDecoration(
                    labelText: 'Note for admissions (optional)',
                    hintText: 'Preferred class time or a question',
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                FilledButton.icon(
                  onPressed: () => Navigator.pop(context, true),
                  icon: const Icon(Icons.send_rounded),
                  label: const Text('Send request'),
                ),
              ],
            ),
          ),
        ),
      );
      if (confirmed != true || !mounted) return;
      setState(() => enrollmentSubmitting = true);
      await StudentAuthService.instance.enroll(courseId: selectedCourse.id!, note: note.text);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enrollment request sent. You can track it in My Learning.')),
      );
      Navigator.pushNamed(context, '/my-learning');
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      note.dispose();
      if (mounted) setState(() => enrollmentSubmitting = false);
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
              Text('Course not found.', style: AppTextStyles.bodyLarge),
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
                          icon: const Icon(
                            Icons.arrow_back,
                            color: AppColors.onSurface,
                          ),
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                  ),
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
                      Text(course!.title, style: AppTextStyles.displayMedium),
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
                      const SizedBox(height: 20),
                      AppPriceCard(price: course!.price),
                      if (!course!.enrollmentOpen) ...[
                        const SizedBox(height: 12),
                        AppCard(
                          backgroundColor: AppColors.accentContainer,
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          child: const Row(
                            children: [
                              Icon(
                                Icons.info_outline_rounded,
                                color: AppColors.accent,
                              ),
                              SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  'Enrollment is currently closed. Check Updates or contact YHA for the next intake.',
                                ),
                              ),
                            ],
                          ),
                        ),
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
                        Text('Subjects', style: AppTextStyles.titleLarge),
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
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        subject.name,
                                        style: AppTextStyles.bodyMedium
                                            .copyWith(
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                      if (subject.description != null &&
                                          subject.description!.isNotEmpty) ...[
                                        const SizedBox(height: 3),
                                        Text(
                                          subject.description!,
                                          style: AppTextStyles.bodyMedium
                                              .copyWith(height: 1.5),
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
                              onPressed: course!.enrollmentOpen && !enrollmentSubmitting
                                  ? _requestEnrollment
                                  : null,
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(
                                    AppDimens.buttonRadius,
                                  ),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (enrollmentSubmitting)
                                    const SizedBox.square(
                                      dimension: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  else
                                    const Icon(Icons.how_to_reg_rounded, size: 18),
                                  const SizedBox(width: 6),
                                  Text(enrollmentSubmitting ? 'Sending…' : course!.enrollmentOpen ? 'Enroll now' : 'Enrollment closed'),
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
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(
                                    AppDimens.buttonRadius,
                                  ),
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
    );
  }
}

class AppPriceCard extends StatelessWidget {
  final String? price;
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
            formatCourseFee(price),
            style: AppTextStyles.titleLarge.copyWith(
              color: hasConfirmedFee(price)
                  ? AppColors.primary
                  : AppColors.onSurfaceVariant,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            hasConfirmedFee(price) ? '/ course' : '/ course details',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
