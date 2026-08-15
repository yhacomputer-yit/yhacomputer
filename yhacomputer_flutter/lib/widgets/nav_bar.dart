import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Keeps the primary learning flow focused. Events, reviews, support and
/// institute information remain available from the More hub rather than
/// competing for space in the bottom navigation.
class NavBar extends StatelessWidget {
  const NavBar({super.key});

  static const _routes = <String>['/', '/courses', '/notifications', '/more'];

  @override
  Widget build(BuildContext context) {
    final currentRoute = ModalRoute.of(context)?.settings.name ?? '/';

    return NavigationBar(
      selectedIndex: _currentIndex(currentRoute),
      onDestinationSelected: (index) {
        final destination = _routes[index];
        if (destination == currentRoute) return;
        Navigator.pushNamedAndRemoveUntil(
          context,
          destination,
          (route) => route.isFirst,
        );
      },
      height: 68,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.primaryContainer,
      elevation: 8,
      shadowColor: AppColors.shadow,
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded, color: AppColors.primary),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.auto_stories_outlined),
          selectedIcon: Icon(
            Icons.auto_stories_rounded,
            color: AppColors.primary,
          ),
          label: 'Learn',
        ),
        NavigationDestination(
          icon: Icon(Icons.notifications_outlined),
          selectedIcon: Icon(
            Icons.notifications_rounded,
            color: AppColors.primary,
          ),
          label: 'Updates',
        ),
        NavigationDestination(
          icon: Icon(Icons.grid_view_rounded),
          selectedIcon: Icon(Icons.grid_view_rounded, color: AppColors.primary),
          label: 'More',
        ),
      ],
    );
  }

  int _currentIndex(String route) {
    if (route == '/courses') return 1;
    if (route == '/notifications') return 2;
    if (route == '/more' ||
        route == '/events' ||
        route == '/reviews' ||
        route == '/about-us' ||
        route == '/contact') {
      return 3;
    }
    return 0;
  }
}
