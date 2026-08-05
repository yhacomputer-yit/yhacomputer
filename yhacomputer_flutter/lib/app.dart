import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/course_detail_screen.dart';
import 'screens/events_screen.dart';
import 'screens/event_detail_screen.dart';
import 'screens/reviews_screen.dart';
import 'screens/about_us_screen.dart';
import 'screens/contact_screen.dart';
import 'screens/notifications_screen.dart';
import 'theme/app_theme.dart';

class YHAComputerApp extends StatelessWidget {
  const YHAComputerApp({super.key});

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
          return CourseDetailScreen(courseId: args?['id'] as int?);
        },
        '/events': (context) => const EventsScreen(),
        '/events/:id': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map?;
          return EventDetailScreen(eventId: args?['id'] as int?);
        },
        '/reviews': (context) => const ReviewsScreen(),
        '/about-us': (context) => const AboutUsScreen(),
        '/contact': (context) => const ContactScreen(),
        '/notifications': (context) => const NotificationsScreen(),
      },
    );
  }
}
