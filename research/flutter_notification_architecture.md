# Flutter Turso Notification Architecture Notes

The current Flutter application already includes `flutter_local_notifications` but only initializes and displays local notifications while the app is running. Its Android manifest has internet and notification permission only; it has no background worker configuration.

The Flutter Workmanager package documents support for background Dart work on Android and iOS through the operating systems' native background-task facilities. It explicitly positions data synchronization and checking for new messages as use cases. Android background tasks are best-effort and depend on the operating system; iOS scheduling is controlled by the system and cannot guarantee immediate or continuous execution when the app is terminated.

The Flutter local notifications package can display locally scheduled or immediate notifications but does not independently fetch data. Its documentation states that Android device vendors can restrict background execution, so scheduled notifications cannot be guaranteed on every device.

## Viable non-Firebase approaches

| Approach | Delivery behavior | Strengths | Limitation |
|---|---|---|---|
| API synchronization on app launch, resume, and pull-to-refresh | Always when a user opens or returns to the app | Simple, fully Turso/API based, reliable for in-app inbox | No alert while app is terminated |
| Android best-effort background polling plus local notifications | Periodic, system-scheduled checks of `/api/data` and local alerts for unseen Turso notifications | No Firebase and no additional notification provider | Not instant; device/OS battery policies can delay or stop work; iOS timing is not guaranteed |
| A true remote push provider | Immediate system-delivered alert when app is terminated | Meets real-time expectation | Requires a push delivery provider; cannot be achieved by Turso alone |

Sources: https://pub.dev/packages/workmanager and https://pub.dev/packages/flutter_local_notifications
