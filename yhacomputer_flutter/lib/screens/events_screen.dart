import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/event.dart';
import '../widgets/nav_bar.dart';
import '../theme/app_theme.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  bool loading = true;
  String error = '';
  List<Event> events = [];
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
      final fetchedEvents = await ApiService.fetchEvents();
      setState(() {
        events = fetchedEvents;
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

  List<Event> get visible {
    final start = (page - 1) * pageSize;
    if (start >= events.length) return const <Event>[];
    return events.sublist(
      start,
      start + pageSize > events.length ? events.length : start + pageSize,
    );
  }

  int get totalPages => (events.length / pageSize).ceil();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('YHA events'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: loading
            ? ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: 6,
                itemBuilder: (context, _) => const _EventCardSkeleton(),
              )
            : error.isNotEmpty
                ? ListView(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    children: [AppErrorState(error)],
                  )
                : events.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        children: const [
                          AppEmptyState(
                            title: 'No upcoming events yet.',
                            subtitle:
                                'Events added in Turso will appear here automatically.',
                            icon: Icons.event_busy_outlined,
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
                                  'Workshops, community sessions, and learning events from YHA.',
                                  style: AppTextStyles.bodyMedium,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${events.length} event${events.length == 1 ? '' : 's'} available',
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
                                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                                child: _EventCard(event: visible[i]),
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

class _EventCard extends StatelessWidget {
  final Event event;
  const _EventCard({required this.event});

  String get imageUrl {
    final images = event.imageList;
    if (images.isEmpty) return '';
    return images[0];
  }

  @override
  Widget build(BuildContext context) {
    final facts = event.factList;

    return AppCard(
      backgroundColor: AppColors.surface,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppNetworkImage(
            imageUrl: imageUrl,
            fallbackText:
                event.title.isNotEmpty ? event.title[0].toUpperCase() : 'E',
            height: 160,
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
                        .map((t) => AppBadge(text: t))
                        .toList(),
                  ),
                if (event.tagList.isNotEmpty) const SizedBox(height: 8),
                Text(
                  event.title,
                  style: AppTextStyles.titleMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (event.description != null && event.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      event.description!,
                      style: AppTextStyles.bodySmall,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                if (facts.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: facts.map((f) => _FactRow(f)).toList(),
                    ),
                  ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: AppCircularButton(
                    icon: Icons.arrow_forward,
                    onPressed: () {
                      if (event.id != null) {
                        Navigator.pushNamed(
                          context,
                          '/events/:id',
                          arguments: {'id': event.id},
                        );
                      }
                    },
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

class _FactRow extends StatelessWidget {
  final Map<String, String> fact;
  const _FactRow(this.fact);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(
            '${fact['label']}:',
            style: AppTextStyles.labelSmall
                .copyWith(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(width: 8),
          Text(
            fact['value'] ?? '',
            style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w600),
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
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.border,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '${i + 1}',
                      style: TextStyle(
                        color: isSelected
                            ? Colors.white
                            : AppColors.onSurface,
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
            onPressed:
                page >= totalPages ? null : () => onChanged(page + 1),
            icon: const Icon(Icons.chevron_right,
                color: AppColors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _EventCardSkeleton extends StatelessWidget {
  const _EventCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 160,
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
                const SizedBox(height: 12),
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
