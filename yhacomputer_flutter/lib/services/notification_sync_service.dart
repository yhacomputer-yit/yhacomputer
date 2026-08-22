import 'package:shared_preferences/shared_preferences.dart';

import '../models/notification_model.dart';
import 'api_service.dart';
import 'notification_service.dart';

class NotificationSyncService {
  static const _seenIdsKey = 'yha_seen_notification_ids_v1';
  static const _readIdsKey = 'yha_read_notification_ids_v1';
  static const _hasInitialSyncKey = 'yha_notifications_initial_sync_v1';
  static const _maxStoredIds = 300;

  /// Reads the public Turso API, records the current notification set, and
  /// optionally displays local alerts for records that were not seen before.
  /// The first successful sync creates a baseline only, preventing historical
  /// admin messages from being delivered as new alerts after installation.
  Future<NotificationSyncResult> sync({bool showLocalAlerts = true}) async {
    final preferences = await SharedPreferences.getInstance();
    final notifications = await ApiService.fetchNotifications();
    final sorted = [...notifications]
      ..sort((left, right) => _sortValue(right).compareTo(_sortValue(left)));

    final currentKeys = sorted.map((notification) => notification.syncKey).toSet();
    final hasInitialSync = preferences.getBool(_hasInitialSyncKey) ?? false;
    final seen = preferences.getStringList(_seenIdsKey)?.toSet() ?? <String>{};

    if (!hasInitialSync) {
      await _saveSeen(preferences, {...seen, ...currentKeys});
      await preferences.setBool(_hasInitialSyncKey, true);
      return NotificationSyncResult(
        notifications: sorted,
        newlyDelivered: 0,
        establishedBaseline: true,
      );
    }

    final unseen = sorted
        .where((notification) => !seen.contains(notification.syncKey))
        .toList();

    if (showLocalAlerts) {
      final service = NotificationService();
      for (final notification in unseen.reversed) {
        await service.showNotification(
          id: _localNotificationId(notification),
          title: notification.title.isEmpty ? 'YHA Computer' : notification.title,
          message: notification.message.isEmpty
              ? 'You have a new update from YHA Computer.'
              : notification.message,
        );
      }
    }

    await _saveSeen(preferences, {...seen, ...currentKeys});
    return NotificationSyncResult(
      notifications: sorted,
      newlyDelivered: unseen.length,
      establishedBaseline: false,
    );
  }

  Future<Set<String>> readKeys() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getStringList(_readIdsKey)?.toSet() ?? <String>{};
  }

  Future<void> markRead(NotificationModel notification) async {
    final preferences = await SharedPreferences.getInstance();
    final read = preferences.getStringList(_readIdsKey)?.toSet() ?? <String>{};
    read.add(notification.syncKey);
    await _saveIds(preferences, _readIdsKey, read);
  }

  Future<void> markAllRead(Iterable<NotificationModel> notifications) async {
    final preferences = await SharedPreferences.getInstance();
    final read = preferences.getStringList(_readIdsKey)?.toSet() ?? <String>{};
    read.addAll(notifications.map((notification) => notification.syncKey));
    await _saveIds(preferences, _readIdsKey, read);
  }

  Future<void> _saveSeen(SharedPreferences preferences, Set<String> ids) {
    return _saveIds(preferences, _seenIdsKey, ids);
  }

  Future<void> _saveIds(
    SharedPreferences preferences,
    String key,
    Set<String> ids,
  ) {
    final ordered = ids.toList()..sort();
    final retained = ordered.length <= _maxStoredIds
        ? ordered
        : ordered.sublist(ordered.length - _maxStoredIds);
    return preferences.setStringList(key, retained);
  }

  int _localNotificationId(NotificationModel notification) {
    if (notification.id != null) return notification.id!.abs() % 2147483647;
    var hash = 17;
    for (final codeUnit in notification.syncKey.codeUnits) {
      hash = (hash * 31 + codeUnit) & 0x7fffffff;
    }
    return hash;
  }

  int _sortValue(NotificationModel notification) {
    final createdAt = DateTime.tryParse(notification.createdAt ?? '');
    return createdAt?.millisecondsSinceEpoch ?? notification.id ?? 0;
  }
}

class NotificationSyncResult {
  final List<NotificationModel> notifications;
  final int newlyDelivered;
  final bool establishedBaseline;

  const NotificationSyncResult({
    required this.notifications,
    required this.newlyDelivered,
    required this.establishedBaseline,
  });
}
