import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/course.dart';
import '../widgets/nav_bar.dart';
import '../theme/app_theme.dart';

class CoursesScreen extends StatefulWidget {
  const CoursesScreen({super.key});

  @override
  State<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends State<CoursesScreen> {
  bool loading = true;
  String error = '';
  List<Course> courses = [];
  String activeFilter = 'All';

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
      final fetchedCourses = await ApiService.fetchCourses();
      setState(() {
        courses = fetchedCourses;
        if (!filters.contains(activeFilter)) activeFilter = 'All';
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  List<String> get filters {
    final subjects = courses
        .map((course) => course.subject?.trim())
        .whereType<String>()
        .where((subject) => subject.isNotEmpty)
        .toSet()
        .toList()
      ..sort((left, right) => left.toLowerCase().compareTo(right.toLowerCase()));
    return ['All', ...subjects];
  }

  List<Course> get filtered {
    if (activeFilter == 'All') return courses;
    final normalizedFilter = activeFilter.toLowerCase().trim();
    return courses
        .where(
          (course) => course.subject?.trim().toLowerCase() == normalizedFilter,
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Courses'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(kToolbarHeight + 24),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                child: Text(
                  'Every course shown here is loaded directly from Turso.',
                  style: AppTextStyles.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: filters.asMap().entries.map((entry) {
                    final i = entry.key;
                    final f = entry.value;
                    final selected = activeFilter == f;
                    return Padding(
                      padding: EdgeInsets.only(
                        left: i == 0 ? AppSpacing.md : 0,
                        right: AppSpacing.sm,
                      ),
                      child: ChoiceChip(
                        label: Text(f),
                        selected: selected,
                        onSelected: (_) => setState(() => activeFilter = f),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        labelStyle: TextStyle(
                          color: selected
                              ? Colors.white
                              : AppColors.onSurfaceVariant,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          fontSize: 13,
                        ),
                        side: BorderSide(
                          color: selected
                              ? AppColors.primary
                              : AppColors.border,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppDimens.badgeRadius),
                        ),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: loading
            ? ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: 6,
                itemBuilder: (context, _) => const _CourseCardSkeleton(),
              )
            : error.isNotEmpty
                ? ListView(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    children: [AppErrorState(error)],
                  )
                : filtered.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        children: const [
                          AppEmptyState(
                            title: 'No courses available yet.',
                            subtitle:
                                'Course records added in Turso will appear here.',
                            icon: Icons.school_outlined,
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        itemCount: filtered.length,
                        itemBuilder: (context, i) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                          child: _CourseCard(course: filtered[i]),
                        ),
                      ),
      ),
      bottomNavigationBar: const NavBar(),
    );
  }
}

class _CourseCard extends StatelessWidget {
  final Course course;
  const _CourseCard({required this.course});

  String _formatFee(String? value) {
    final fee = value?.trim() ?? '';
    if (fee.isEmpty || fee == '0' || fee.toLowerCase() == 'null') {
      return 'Fee: pending';
    }
    return fee.toLowerCase().startsWith('fee') ? fee : 'Fee: $fee';
  }

  String get imageUrl {
    if (course.image == null || course.image!.isEmpty) return '';
    final v = course.image!;
    if (v.startsWith('http') || v.startsWith('data:')) return v;
    return '${ApiService.baseUrl}/${v.replaceAll(RegExp(r'^/'), '')}';
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppNetworkImage(
            imageUrl: imageUrl,
            fallbackText:
                course.title.isNotEmpty ? course.title[0].toUpperCase() : 'Y',
            height: 180,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(AppDimens.cardRadius)),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (course.badgeList.isNotEmpty)
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: course.badgeList
                        .take(3)
                        .map((b) => AppBadge(text: b))
                        .toList(),
                  ),
                if (course.badgeList.isNotEmpty) const SizedBox(height: 8),
                Text(
                  course.title,
                  style: AppTextStyles.titleMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (course.description != null &&
                    course.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      course.description!,
                      style: AppTextStyles.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    if (course.duration != null &&
                        course.duration!.isNotEmpty)
                      Text(course.duration!, style: AppTextStyles.bodySmall),
                    if (course.duration != null &&
                        course.duration!.isNotEmpty &&
                        course.price != null &&
                        course.price!.isNotEmpty)
                      Text(' · ', style: AppTextStyles.bodySmall),
                    Text(
                      _formatFee(course.price),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.accent,
                        fontSize: 14,
                      ),
                    ),
                    const Spacer(),
                    AppCircularButton(
                      icon: Icons.arrow_forward,
                      onPressed: () => Navigator.pushNamed(
                        context,
                        '/courses/:id',
                        arguments: {'id': course.id},
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CourseCardSkeleton extends StatelessWidget {
  const _CourseCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppDimens.cardRadius),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 16,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 14,
                  width: 120,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(height: 14),
                Align(
                  alignment: Alignment.centerRight,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
