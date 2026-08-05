import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/course.dart';
import '../models/event.dart';
import '../models/review.dart';
import '../widgets/nav_bar.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool loading = true;
  String error = '';
  List<Course> courses = [];
  List<Event> events = [];
  List<Review> reviews = [];

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
      setState(() {
        courses = data['courses'] as List<Course>;
        events = data['events'] as List<Event>;
        reviews = data['reviews'] as List<Review>;
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final allowedSubjects = ['Ict', 'Programming', 'Graphic design'];
    final filtered = courses
        .where((c) => allowedSubjects.contains(c.subject))
        .toList();
    final display = filtered.take(6).toList();
    final featured = display.take(3).toList();
    final nextEvents = events.take(3).toList();

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: _HomeHero(
                featured: featured,
                loading: loading,
                error: error,
                courseCount: courses.length,
                eventCount: events.length,
                reviewCount: reviews.length,
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(AppSpacing.md),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (loading && error.isEmpty)
                    ..._buildSkeletonSections(),
                  if (error.isNotEmpty) AppErrorState(error),
                  if (!loading && error.isEmpty) ...[
                    _FeaturedCourses(featured: featured),
                    const SizedBox(height: AppSpacing.xl),
                    _UpcomingEvents(events: nextEvents),
                    const SizedBox(height: AppSpacing.xl),
                    _StudentReviews(reviews: reviews),
                    const SizedBox(height: AppSpacing.xl),
                    _CTASection(),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const NavBar(),
    );
  }

  List<Widget> _buildSkeletonSections() {
    return [
      Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 60,
              height: 14,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              height: 18,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 24),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(3, (_) {
                  return Container(
                    width: 240,
                    margin: const EdgeInsets.only(right: AppSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 140,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: AppColors.border,
                            borderRadius: BorderRadius.circular(AppDimens.cardRadius),
                          ),
                        ),
                        const SizedBox(height: 12),
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
                      ],
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    ];
  }
}

class _HomeHero extends StatelessWidget {
  final List<Course> featured;
  final bool loading;
  final String error;
  final int courseCount;
  final int eventCount;
  final int reviewCount;

  const _HomeHero({
    required this.featured,
    required this.loading,
    required this.error,
    required this.courseCount,
    required this.eventCount,
    required this.reviewCount,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, 40, AppSpacing.md, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Practical IT training in Myanmar',
              style: AppTextStyles.labelMedium.copyWith(
                color: AppColors.primary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Build skills that move\nyour future forward.',
              style: AppTextStyles.displayLarge.copyWith(color: AppColors.onSurface, fontSize: 32),
            ),
            const SizedBox(height: 16),
            Text(
              'Learn current technology through guided lessons, real projects, and a community that helps you keep growing.',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 16,
              children: [
                FilledButton(
                  onPressed: () => Navigator.pushNamed(context, '/courses'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Explore courses'),
                      SizedBox(width: 6),
                      Icon(Icons.arrow_forward, size: 18),
                    ],
                  ),
                ),
                OutlinedButton(
                  onPressed: () => Navigator.pushNamed(context, '/contact'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.onSurface,
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
                    ),
                  ),
                  child: const Text('Get course guidance'),
                ),
              ],
            ),
            const SizedBox(height: 28),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _HomeMetric('${loading ? '...' : courseCount}', 'Courses'),
                Container(width: 1, height: 32, color: AppColors.border),
                _HomeMetric('${loading ? '...' : eventCount}', 'Events'),
                Container(width: 1, height: 32, color: AppColors.border),
                _HomeMetric('${loading ? '...' : reviewCount}', 'Reviews'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeMetric extends StatelessWidget {
  final String value;
  final String label;
  const _HomeMetric(this.value, this.label);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 24,
            fontWeight: FontWeight.w900,
          ),
        ),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.onSurfaceVariant,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

class _FeaturedCourses extends StatelessWidget {
  final List<Course> featured;
  const _FeaturedCourses({required this.featured});

  @override
  Widget build(BuildContext context) {
    if (featured.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          label: 'Turso-powered catalog',
          title: 'Find your next skill',
          actionLabel: 'View all',
          onAction: () => Navigator.pushNamed(context, '/courses'),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: featured
                .asMap()
                .map((i, course) {
                  return MapEntry(
                    i,
                    Container(
                      width: 260,
                      margin: EdgeInsets.only(
                        right: i < featured.length - 1 ? AppSpacing.md : 0,
                      ),
                      child: _CourseCardLarge(course: course),
                    ),
                  );
                })
                .values
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _CourseCardLarge extends StatelessWidget {
  final Course course;
  const _CourseCardLarge({required this.course});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: EdgeInsets.zero,
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppNetworkImage(
            imageUrl: courseImageUrl(course.image),
            fallbackText:
                course.title.isNotEmpty ? course.title[0].toUpperCase() : 'Y',
            height: 140,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(AppDimens.cardRadius),
            ),
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
                Text(
                  course.title,
                  style: AppTextStyles.titleMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                if (course.duration != null || course.price != null)
                  Text(
                    [course.duration, course.price]
                        .where((v) => v != null && v.isNotEmpty)
                        .join(' · '),
                    style: AppTextStyles.bodySmall,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String courseImageUrl(String? image) {
  if (image == null || image.isEmpty) return '';
  if (image.startsWith('http') || image.startsWith('data:')) return image;
  return '${ApiService.baseUrl}/${image.replaceAll(RegExp(r'^/'), '')}';
}

class _UpcomingEvents extends StatelessWidget {
  final List<Event> events;
  const _UpcomingEvents({required this.events});

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          label: 'Learn together',
          title: 'Upcoming events',
          actionLabel: 'See all',
          onAction: () => Navigator.pushNamed(context, '/events'),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: events.asMap().map((i, event) {
              return MapEntry(
                i,
                Container(
                  width: 260,
                  margin: EdgeInsets.only(
                    right: i < events.length - 1 ? AppSpacing.md : 0,
                  ),
                  child: _EventCard(event: event),
                ),
              );
            }).values.toList(),
          ),
        ),
      ],
    );
  }
}

class _EventCard extends StatelessWidget {
  final Event event;
  const _EventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    final images = event.imageList;
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppNetworkImage(
            imageUrl: images.isNotEmpty ? images[0] : '',
            fallbackText:
                event.title.isNotEmpty ? event.title[0].toUpperCase() : 'E',
            height: 140,
            fit: BoxFit.cover,
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(AppDimens.cardRadius),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (event.tagList.isNotEmpty)
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: event.tagList
                        .take(2)
                        .map((t) => AppBadge(text: t, backgroundColor: AppColors.accentContainer, textColor: const Color(0xFF92400E)))
                        .toList(),
                  ),
                Text(
                  event.title,
                  style: AppTextStyles.titleMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  [event.venue, event.date]
                      .where((v) => v != null && v.isNotEmpty)
                      .join(' · '),
                  style: AppTextStyles.bodySmall,
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.center,
                    child: TextButton(
                    onPressed: () {
                      if (event.id != null) {
                        Navigator.pushNamed(
                          context,
                          '/events/:id',
                          arguments: {'id': event.id},
                        );
                      }
                    },
                    child: const Text('View details'),
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

class _StudentReviews extends StatelessWidget {
  final List<Review> reviews;
  const _StudentReviews({required this.reviews});

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) return const SizedBox.shrink();

    final items = reviews.take(4).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          label: 'Student voices',
          title: 'What our students say',
          actionLabel: 'Read all',
          onAction: () => Navigator.pushNamed(context, '/reviews'),
        ),
        Text(
          'Real experiences from learners who studied with YHA Computer.',
          style: AppTextStyles.bodySmall,
        ),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: items.asMap().map((i, review) {
              return MapEntry(
                i,
                Container(
                  width: 280,
                  margin: EdgeInsets.only(
                    right: i < items.length - 1 ? AppSpacing.md : 0,
                  ),
                  child: _ReviewCard(review: review),
                ),
              );
            }).values.toList(),
          ),
        ),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Review review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '\u201C',
            style: TextStyle(
              fontSize: 32,
              color: AppColors.primary,
              fontFamily: 'Georgia',
            ),
          ),
          const SizedBox(height: 8),
          if (review.courseName != null && review.courseName!.isNotEmpty)
            AppBadge(
              text: review.courseName!,
              backgroundColor: AppColors.accentContainer,
              textColor: const Color(0xFF92400E),
              fontSize: 10,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            ),
          const SizedBox(height: 8),
          Text(
            review.message,
            style: AppTextStyles.bodyMedium.copyWith(height: 1.6),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary,
                child: Text(
                  review.name.isNotEmpty
                      ? review.name[0].toUpperCase()
                      : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.name,
                      style: AppTextStyles.titleSmall,
                    ),
                    if (review.courseName != null)
                      Text(
                        'via ${review.courseName!}',
                        style: AppTextStyles.bodySmall,
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CTASection extends StatelessWidget {
  const _CTASection();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.primary,
      border: BorderSide.none,
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ready when you are',
            style: AppTextStyles.labelMedium.copyWith(color: AppColors.primaryContainer, fontSize: 13),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose a course with confidence.',
            style: AppTextStyles.displayMedium.copyWith(color: Colors.white, fontSize: 24),
          ),
          const SizedBox(height: 8),
          Text(
            'Tell us your goals and budget, and our team will help you pick the path that fits you best.',
            style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => Navigator.pushNamed(context, '/contact'),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.onSurface,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
              ),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Ask for guidance'),
                SizedBox(width: 6),
                Icon(Icons.arrow_forward, size: 18),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _CTAFeature(Icons.check_circle, 'Free, honest course advice'),
              _CTAFeature(Icons.schedule, 'Flexible class schedules'),
              _CTAFeature(Icons.handyman, 'Hands-on, practical training'),
            ],
          ),
        ],
      ),
    );
  }
}

class _CTAFeature extends StatelessWidget {
  final IconData icon;
  final String text;
  const _CTAFeature(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: Colors.white70, size: 18),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}
