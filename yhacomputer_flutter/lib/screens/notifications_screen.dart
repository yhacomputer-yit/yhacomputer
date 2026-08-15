import 'package:flutter/material.dart';

import '../models/notification_model.dart';
import '../services/notification_sync_service.dart';
import '../theme/app_theme.dart';
import '../widgets/nav_bar.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationSyncService _syncService = NotificationSyncService();
  bool _loading = true;
  String _error = '';
  List<NotificationModel> _notifications = [];
  Set<String> _readKeys = <String>{};
  bool _showUnreadOnly = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final result = await _syncService.sync(showLocalAlerts: false);
      final readKeys = await _syncService.readKeys();
      if (!mounted) return;
      setState(() {
        _notifications = result.notifications;
        _readKeys = readKeys;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString();
        _loading = false;
      });
    }
  }

  bool _isRead(NotificationModel notification) {
    return notification.isRead || _readKeys.contains(notification.syncKey);
  }

  Future<void> _markRead(NotificationModel notification) async {
    if (_isRead(notification)) return;
    await _syncService.markRead(notification);
    if (!mounted) return;
    setState(() => _readKeys = {..._readKeys, notification.syncKey});
  }

  Future<void> _markAllRead() async {
    await _syncService.markAllRead(_notifications);
    if (!mounted) return;
    setState(() {
      _readKeys = {
        ..._readKeys,
        ..._notifications.map((notification) => notification.syncKey),
      };
    });
  }

  String _displayDate(String? rawValue) {
    if (rawValue == null || rawValue.trim().isEmpty) return 'Recent update';
    final date = DateTime.tryParse(rawValue)?.toLocal();
    if (date == null) return rawValue;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final itemDay = DateTime(date.year, date.month, date.day);
    final difference = today.difference(itemDay).inDays;
    final minutes = now.difference(date).inMinutes;

    if (minutes >= 0 && minutes < 60) {
      return '${minutes == 0 ? 1 : minutes}m ago';
    }
    if (difference == 0) return 'Today';
    if (difference == 1) return 'Yesterday';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((item) => !_isRead(item)).length;
    final visibleNotifications = _showUnreadOnly
        ? _notifications.where((item) => !_isRead(item)).toList()
        : _notifications;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Updates'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNotifications,
        child: _loading
            ? const _NotificationSkeletonList()
            : _error.isNotEmpty
            ? ListView(
                padding: const EdgeInsets.all(AppSpacing.md),
                children: [AppErrorState(_error)],
              )
            : _notifications.isEmpty
            ? ListView(
                padding: const EdgeInsets.all(AppSpacing.md),
                children: const [
                  AppEmptyState(
                    title: 'No notifications yet',
                    subtitle:
                        'Updates published from the YHA admin dashboard will appear here.',
                    icon: Icons.notifications_none_rounded,
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: visibleNotifications.length + 2,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _InboxSummary(
                      total: _notifications.length,
                      unread: unreadCount,
                    );
                  }
                  if (index == 1) {
                    return _InboxFilters(
                      showUnreadOnly: _showUnreadOnly,
                      unread: unreadCount,
                      onChanged: (value) =>
                          setState(() => _showUnreadOnly = value),
                    );
                  }
                  if (visibleNotifications.isEmpty) {
                    return const AppEmptyState(
                      title: 'No unread updates',
                      subtitle:
                          'You have caught up. Switch to All to read earlier updates.',
                      icon: Icons.done_all_rounded,
                    );
                  }
                  final notification = visibleNotifications[index - 2];
                  return _NotificationCard(
                    notification: notification,
                    isRead: _isRead(notification),
                    dateLabel: _displayDate(notification.createdAt),
                    onTap: () => _markRead(notification),
                    onOpenCourse: notification.courseId == null
                        ? null
                        : () async {
                            await _markRead(notification);
                            if (!context.mounted) return;
                            Navigator.pushNamed(
                              context,
                              '/courses/:id',
                              arguments: {'id': notification.courseId},
                            );
                          },
                  );
                },
              ),
      ),
      bottomNavigationBar: const NavBar(),
    );
  }
}

class _InboxSummary extends StatelessWidget {
  final int total;
  final int unread;

  const _InboxSummary({required this.total, required this.unread});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.primaryContainer,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.14),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.campaign_outlined,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unread == 0
                      ? 'You are up to date'
                      : '$unread unread update${unread == 1 ? '' : 's'}',
                  style: AppTextStyles.titleMedium,
                ),
                const SizedBox(height: 2),
                Text(
                  '$total update${total == 1 ? '' : 's'} from YHA Computer',
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

class _InboxFilters extends StatelessWidget {
  final bool showUnreadOnly;
  final int unread;
  final ValueChanged<bool> onChanged;

  const _InboxFilters({
    required this.showUnreadOnly,
    required this.unread,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ChoiceChip(
          label: const Text('All updates'),
          selected: !showUnreadOnly,
          onSelected: (_) => onChanged(false),
        ),
        const SizedBox(width: AppSpacing.sm),
        ChoiceChip(
          label: Text(unread == 0 ? 'Unread' : 'Unread ($unread)'),
          selected: showUnreadOnly,
          onSelected: (_) => onChanged(true),
        ),
      ],
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final NotificationModel notification;
  final bool isRead;
  final String dateLabel;
  final VoidCallback onTap;
  final VoidCallback? onOpenCourse;

  const _NotificationCard({
    required this.notification,
    required this.isRead,
    required this.dateLabel,
    required this.onTap,
    this.onOpenCourse,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: isRead ? AppColors.surface : AppColors.primaryContainer,
      padding: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isRead
                      ? AppColors.background
                      : AppColors.primary.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isRead
                      ? Icons.notifications_none_rounded
                      : Icons.notifications_active_outlined,
                  color: isRead
                      ? AppColors.onSurfaceVariant
                      : AppColors.primary,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title.isEmpty
                                ? 'YHA Computer'
                                : notification.title,
                            style: AppTextStyles.titleMedium.copyWith(
                              fontWeight: isRead
                                  ? FontWeight.w600
                                  : FontWeight.w800,
                            ),
                          ),
                        ),
                        if (!isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      notification.message.isEmpty
                          ? 'You have a new update from YHA Computer.'
                          : notification.message,
                      style: AppTextStyles.bodyMedium,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          dateLabel,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                        if (onOpenCourse != null) ...[
                          const Spacer(),
                          TextButton.icon(
                            onPressed: onOpenCourse,
                            icon: const Icon(
                              Icons.auto_stories_outlined,
                              size: 16,
                            ),
                            label: const Text('Course'),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                              ),
                              minimumSize: const Size(0, 34),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationSkeletonList extends StatelessWidget {
  const _NotificationSkeletonList();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: 5,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (_, _) => AppCard(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: const Row(
          children: [
            _SkeletonCircle(),
            SizedBox(width: AppSpacing.sm),
            Expanded(child: _SkeletonText()),
          ],
        ),
      ),
    );
  }
}

class _SkeletonCircle extends StatelessWidget {
  const _SkeletonCircle();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: const BoxDecoration(
        color: AppColors.border,
        shape: BoxShape.circle,
      ),
    );
  }
}

class _SkeletonText extends StatelessWidget {
  const _SkeletonText();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 160,
          height: 14,
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 12,
          decoration: BoxDecoration(
            color: AppColors.border,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ],
    );
  }
}
