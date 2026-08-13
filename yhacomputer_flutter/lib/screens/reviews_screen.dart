import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/review.dart';
import '../widgets/nav_bar.dart';
import '../theme/app_theme.dart';

class ReviewsScreen extends StatefulWidget {
  const ReviewsScreen({super.key});

  @override
  State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  bool loading = true;
  String error = '';
  List<Review> reviews = [];
  int page = 1;
  static const pageSize = 6;

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
      final fetchedReviews = await ApiService.fetchReviews();
      setState(() {
        reviews = fetchedReviews;
        page = 1;
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  List<Review> get visible {
    final start = (page - 1) * pageSize;
    if (start >= reviews.length) return const <Review>[];
    return reviews.sublist(
      start,
      start + pageSize > reviews.length ? reviews.length : start + pageSize,
    );
  }

  int get totalPages => (reviews.length / pageSize).ceil();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student reviews'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: loading
            ? ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: 6,
                itemBuilder: (context, _) => const _ReviewCardSkeleton(),
              )
            : error.isNotEmpty
                ? ListView(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    children: [AppErrorState(error, title: 'We could not load student reviews.')],
                  )
                : reviews.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        children: const [
                          AppEmptyState(
                            title: 'No reviews yet.',
                            subtitle: 'Published Turso reviews will appear here.',
                            icon: Icons.rate_review_outlined,
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Feedback published by the YHA community.',
                                  style: AppTextStyles.bodyMedium,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${reviews.length} review${reviews.length == 1 ? '' : 's'} available',
                                  style: AppTextStyles.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.md,
                              ),
                              itemCount: visible.length,
                              itemBuilder: (context, i) => Padding(
                                padding:
                                    const EdgeInsets.only(bottom: AppSpacing.sm),
                                child: _ReviewCard(review: visible[i]),
                              ),
                            ),
                          ),
                          if (totalPages > 1)
                            _Pager(
                              page: page,
                              totalPages: totalPages,
                              onChanged: (p) => setState(() => page = p),
                            ),
                        ],
                      ),
      ),
      bottomNavigationBar: const NavBar(),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Review review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '\u201C',
            style: TextStyle(
              fontSize: 36,
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
            style: AppTextStyles.bodyMedium.copyWith(height: 1.7),
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

class _Pager extends StatelessWidget {
  final int page;
  final int totalPages;
  final ValueChanged<int> onChanged;
  const _Pager({
    required this.page,
    required this.totalPages,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          const EdgeInsets.symmetric(vertical: 20, horizontal: AppSpacing.md),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: page <= 1 ? null : () => onChanged(page - 1),
            icon: const Icon(Icons.chevron_left,
                color: AppColors.onSurfaceVariant),
          ),
          ...List.generate(totalPages, (i) {
            final isSelected = i + 1 == page;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: InkWell(
                onTap: () => onChanged(i + 1),
                borderRadius: BorderRadius.circular(11),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : AppColors.surface,
                    borderRadius: BorderRadius.circular(11),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '${i + 1}',
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppColors.onSurface,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
          IconButton(
            onPressed: page >= totalPages ? null : () => onChanged(page + 1),
            icon: const Icon(Icons.chevron_right,
                color: AppColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _ReviewCardSkeleton extends StatelessWidget {
  const _ReviewCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            height: 14,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 14,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 14,
            width: 200,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                width: 120,
                height: 14,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
