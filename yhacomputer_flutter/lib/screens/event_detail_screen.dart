import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/event.dart';
import '../theme/app_theme.dart';

class EventDetailScreen extends StatefulWidget {
  final int? eventId;
  const EventDetailScreen({super.key, this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  bool loading = true;
  String error = '';
  Event? event;
  int activeImage = 0;

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
      final events = data['events'] as List<Event>;
      setState(() {
        event = events.firstWhere(
          (e) => e.id == widget.eventId,
          orElse: () => Event(title: ''),
        );
        loading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
  }

  List<String> get gallery => event?.imageList ?? [];

  ImageProvider _galleryImage(String url) {
    if (url.startsWith('data:')) {
      final parts = url.split(',');
      if (parts.length == 2) {
        final bytes = base64Decode(parts[1]);
        return MemoryImage(bytes);
      }
    }
    return NetworkImage(url);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Event')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (error.isNotEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Event')),
        body: Center(child: Text('Error: $error')),
      );
    }
    if (event == null || event!.title.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Event')),
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
              Text('Event not found.', style: AppTextStyles.bodyLarge),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Back to events'),
              ),
            ],
          ),
        ),
      );
    }

    final tags = event!.tagList;
    final facts = event!.factList;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: AppColors.surface,
            foregroundColor: AppColors.onSurface,
            expandedHeight: gallery.isNotEmpty ? 320 : 120,
            leading: Padding(
              padding: const EdgeInsets.only(left: 8),
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
            flexibleSpace: FlexibleSpaceBar(
              background: gallery.isNotEmpty
                  ? AppNetworkImage(
                      imageUrl: gallery[activeImage],
                      fallbackText: event!.title.isNotEmpty
                          ? event!.title[0].toUpperCase()
                          : 'E',
                      height: 320,
                      fit: BoxFit.cover,
                    )
                  : null,
              title: null,
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(0),
              child: const SizedBox.shrink(),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (tags.isNotEmpty)
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: tags.map((t) => AppBadge(text: t)).toList(),
                    ),
                  if (tags.isNotEmpty) const SizedBox(height: 12),
                  Text(event!.title, style: AppTextStyles.displayMedium),
                  if (facts.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Wrap(
                      spacing: 24,
                      runSpacing: 16,
                      children: facts.map((f) => _FactColumn(f)).toList(),
                    ),
                  ],
                  if (event!.description != null &&
                      event!.description!.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text(
                      event!.description!,
                      style: AppTextStyles.bodyLarge.copyWith(height: 1.7),
                    ),
                  ],
                  if (gallery.length > 1) ...[
                    const SizedBox(height: 24),
                    Text('Gallery', style: AppTextStyles.titleLarge),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: gallery.length,
                        itemBuilder: (context, i) => GestureDetector(
                          onTap: () => setState(() => activeImage = i),
                          child: Container(
                            margin: const EdgeInsets.only(right: AppSpacing.sm),
                            width: 110,
                            height: 100,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: i == activeImage
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: i == activeImage ? 2 : 1,
                              ),
                              image: DecorationImage(
                                image: _galleryImage(gallery[i]),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
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
                              borderRadius: BorderRadius.circular(
                                AppDimens.buttonRadius,
                              ),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Ask about this event'),
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
                              Navigator.pushNamed(context, '/events'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.onSurface,
                            side: const BorderSide(color: AppColors.border),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                AppDimens.buttonRadius,
                              ),
                            ),
                          ),
                          child: const Text('Browse more events'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FactColumn extends StatelessWidget {
  final Map<String, String> fact;
  const _FactColumn(this.fact);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          fact['label'] ?? '',
          style: AppTextStyles.labelSmall.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          fact['value'] ?? '',
          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
