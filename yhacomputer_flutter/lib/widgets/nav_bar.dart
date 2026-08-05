import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class NavBar extends StatelessWidget {
  const NavBar({super.key});

  @override
  Widget build(BuildContext context) {
    final currentRoute = ModalRoute.of(context)?.settings.name ?? '/';
    final routes = [
      '/',
      '/courses',
      '/events',
      '/reviews',
      '/about-us',
      '/contact',
    ];
    return NavigationBar(
      selectedIndex: _currentIndex(currentRoute),
      onDestinationSelected: (index) {
        if (index < routes.length) {
          Navigator.pushNamedAndRemoveUntil(
            context,
            routes[index],
            (route) => route.isFirst,
          );
        }
      },
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.primaryContainer,
      elevation: 8,
      shadowColor: AppColors.shadow,
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home, color: AppColors.primary),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.school_outlined),
          selectedIcon: Icon(Icons.school, color: AppColors.primary),
          label: 'Courses',
        ),
        NavigationDestination(
          icon: Icon(Icons.event_outlined),
          selectedIcon: Icon(Icons.event, color: AppColors.primary),
          label: 'Events',
        ),
        NavigationDestination(
          icon: Icon(Icons.star_outline),
          selectedIcon: Icon(Icons.star, color: AppColors.primary),
          label: 'Reviews',
        ),
        NavigationDestination(
          icon: Icon(Icons.info_outline),
          selectedIcon: Icon(Icons.info, color: AppColors.primary),
          label: 'About',
        ),
        NavigationDestination(
          icon: Icon(Icons.contact_mail_outlined),
          selectedIcon: Icon(Icons.contact_mail, color: AppColors.primary),
          label: 'Contact',
        ),
      ],
    );
  }

  int _currentIndex(String route) {
    switch (route) {
      case '/courses':
        return 1;
      case '/events':
        return 2;
      case '/reviews':
        return 3;
      case '/about-us':
        return 4;
      case '/contact':
        return 5;
      default:
        return 0;
    }
  }
}
