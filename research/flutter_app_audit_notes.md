# Flutter Application Audit Notes

## Verified implementation status

The Flutter source passes static analysis and its model parsing regression tests. The Courses, Events, Reviews, Notifications, Course Detail, and Home screens all obtain catalog content through the public `/api/data` endpoint. The Android background synchronization implementation uses WorkManager with a network constraint and device-local storage to prevent duplicate alerts, so it remains Turso/API-only and does not add Firebase.

## Confirmed improvements to make

The API service converts meaningful `_ApiException` messages into generic fallback text because each request method throws the specific exception and then immediately catches it in a catch-all clause. This prevents users from seeing validation and server error messages that the API has already supplied.

Course fees are still displayed as raw values in Flutter course-detail price cards. A Turso placeholder such as `"0"` is considered non-empty and appears as a real price. The display should use the same normalization rule as the web card: confirmed positive numbers should be formatted as MMK amounts, while empty/zero values should be labelled as pending.

The production API currently returns zero subjects and zero sessions for the six live course records. The Flutter detail screen is therefore correctly empty for curriculum data, but app users will not see the intended Turso Subjects section until production data/deployment is aligned with the maintained branch.

## Release and platform readiness

The Android release build currently uses the debug signing configuration. This is safe only for local development and means the project is not ready for a proper Play Store release or a stable update path. A user-owned release keystore and non-committed signing configuration are required before publishing a release APK/AAB.

The sandbox does not include the Android SDK, so an APK build could not be executed here. Flutter static analysis and tests remain the available validation in this environment.

## Background-sync constraint

The background task is best-effort and device/OS scheduled. The API's 5-minute shared cache plus the WorkManager 15-minute minimum periodic interval means an admin-created Turso notification can appear later than its database insertion time. This is expected for the chosen no-Firebase polling architecture and should be described to users as non-real-time delivery.

## Local browser reproduction attempt

The user-local `localhost:60981` server is not reachable from the sandbox browser, because it runs in the user's local browser environment rather than the sandbox network namespace. A sandbox Flutter web server was started separately for reproduction. Its first browser capture showed only Flutter's loading progress bar, so the API failure cannot yet be classified from that capture alone.
A follow-up browser console capture showed that the Flutter web entry point started and did not report a Dart or JavaScript exception in the observed console window. The empty sandbox capture is therefore not sufficient evidence of a runtime crash; it may be specific to the debug web-server/browser integration.
