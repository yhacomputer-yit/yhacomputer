import 'dart:io';

import 'package:flutter/material.dart';
import 'package:workmanager/workmanager.dart';

import 'app.dart';
import 'services/notification_service.dart';
import 'services/notification_sync_service.dart';

const _notificationSyncTaskName = 'yha.turso.notification_sync';
const _notificationSyncWorkId = 'yha_turso_notification_sync_periodic';

/// This entry point runs in a Workmanager-owned Flutter isolate on Android.
/// Keep it top-level and avoid UI work so it can execute while the app is closed.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    WidgetsFlutterBinding.ensureInitialized();
    try {
      await NotificationService().initialize();
      await NotificationSyncService().sync(showLocalAlerts: true);
      return true;
    } catch (_) {
      // Returning false lets Android retry according to WorkManager policy.
      return false;
    }
  });
}

Future<void> _registerBackgroundNotificationSync() async {
  if (!Platform.isAndroid) return;

  await Workmanager().initialize(callbackDispatcher);
  await Workmanager().registerPeriodicTask(
    _notificationSyncWorkId,
    _notificationSyncTaskName,
    frequency: const Duration(minutes: 15),
    existingWorkPolicy: ExistingPeriodicWorkPolicy.update,
    constraints: Constraints(networkType: NetworkType.connected),
  );
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService().initialize(requestPermission: true);
  await _registerBackgroundNotificationSync();

  // Establish the device-local baseline without surfacing historical
  // notifications as fresh alerts the first time the app launches.
  try {
    await NotificationSyncService().sync(showLocalAlerts: false);
  } catch (_) {
    // The screens retain their own retry/error states when the API is offline.
  }

  runApp(const YHAComputerApp());
}
