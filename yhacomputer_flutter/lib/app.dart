import 'package:flutter/material.dart';

import 'screens/about_us_screen.dart';
import 'screens/contact_screen.dart';
import 'screens/course_detail_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/event_detail_screen.dart';
import 'screens/events_screen.dart';
import 'screens/home_screen.dart';
import 'screens/more_screen.dart';
import 'screens/my_learning_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/student_account_screen.dart';
import 'screens/reviews_screen.dart';
import 'services/notification_sync_service.dart';
import 'theme/app_theme.dart';

class YHAComputerApp extends StatefulWidget {
  const YHAComputerApp({super.key});

  @override
  State<YHAComputerApp> createState() => _YHAComputerAppState();
}

class _YHAComputerAppState extends State<YHAComputerApp>
    with WidgetsBindingObserver {
  final NotificationSyncService _notificationSync = NotificationSyncService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _syncNotificationsAfterResume();
    }
  }

  Future<void> _syncNotificationsAfterResume() async {
    try {
      await _notificationSync.sync(showLocalAlerts: true);
    } catch (_) {
      // API errors are surfaced by the inbox screen when the user opens it.
    }
  }

  int? _routeId(dynamic value) => value is int ? value : int.tryParse('$value');

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'YHA Computer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/courses': (context) => const CoursesScreen(),
        '/courses/:id': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map?;
          return CourseDetailScreen(courseId: _routeId(args?['id']));
        },
        '/events': (context) => const EventsScreen(),
        '/events/:id': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map?;
          return EventDetailScreen(eventId: _routeId(args?['id']));
        },
        '/reviews': (context) => const ReviewsScreen(),
        '/about-us': (context) => const AboutUsScreen(),
        '/contact': (context) => const ContactScreen(),
        '/notifications': (context) => const NotificationsScreen(),
        '/student-login': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map?;
          return StudentAccountScreen(requestedCourseId: _routeId(args?['course_id']));
        },
        '/my-learning': (context) => const MyLearningScreen(),
        '/more': (context) => const MoreScreen(),
      },
    );
  }
}
