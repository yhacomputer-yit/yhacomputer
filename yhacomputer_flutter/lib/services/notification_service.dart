import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static const _channelId = 'yha_notifications';
  static const _channelName = 'YHA Computer Notifications';
  static bool _initialized = false;

  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin plugin = FlutterLocalNotificationsPlugin();

  /// Safe to call from both the main Flutter isolate and a Workmanager isolate.
  Future<void> initialize({bool requestPermission = false}) async {
    if (!_initialized) {
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings();
      const settings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );
      await plugin.initialize(settings);
      _initialized = true;
    }

    if (requestPermission) await this.requestPermission();
  }

  Future<bool> requestPermission() async {
    final androidGranted = await plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    final iosGranted = await plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(alert: true, badge: true, sound: true);
    return androidGranted ?? iosGranted ?? false;
  }

  Future<void> showNotification({
    required int id,
    required String title,
    required String message,
  }) async {
    await initialize();
    const androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: 'Important updates sent from YHA Computer',
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const details = NotificationDetails(android: androidDetails, iOS: iosDetails);
    await plugin.show(id, title, message, details);
  }
}
