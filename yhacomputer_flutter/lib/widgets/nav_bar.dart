import 'package:flutter/material.dart';

import '../services/notification_sync_service.dart';
import '../theme/app_theme.dart';

/// Keeps the primary learning flow focused. Events, reviews, support and
/// institute information remain available from the More hub rather than
/// competing for space in the bottom navigation.
class NavBar extends StatefulWidget {
  const NavBar({super.key});

  @override
  State<NavBar> createState() => _NavBarState();
}

class _NavBarState extends State<NavBar> {
  static const _routes = <String>['/', '/courses', '/notifications', '/more'];
  final NotificationSyncService _notificationSync = NotificationSyncService();
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _refreshUnreadCount();
  }

  Future<void> _refreshUnreadCount() async {
    try {
      final result = await _notificationSync.sync(showLocalAlerts: false);
      final readKeys = await _notificationSync.readKeys();
      final unread = result.notifications
          .where((notification) => !readKeys.contains(notification.syncKey))
          .length;
      if (!mounted) return;
      setState(() => _unreadCount = unread);
    } catch (_) {
      // The Updates inbox retains its own error state; navigation must stay
      // responsive even when the device is offline.
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentRoute = ModalRoute.of(context)?.settings.name ?? '/';

    return NavigationBar(
      selectedIndex: _currentIndex(currentRoute),
      onDestinationSelected: (index) {
        final destination = _routes[index];
        if (destination == currentRoute) {
          if (destination == '/notifications') _refreshUnreadCount();
          return;
        }
        Navigator.pushNamedAndRemoveUntil(
          context,
          destination,
          (route) => route.isFirst,
        );
      },
      height: 70,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.primaryContainer,
      elevation: 8,
      shadowColor: AppColors.shadow,
      destinations: [
        const NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded, color: AppColors.primary),
          label: 'Home',
        ),
        const NavigationDestination(
          icon: Icon(Icons.auto_stories_outlined),
          selectedIcon: Icon(
            Icons.auto_stories_rounded,
            color: AppColors.primary,
          ),
          label: 'Learn',
        ),
        NavigationDestination(
          icon: _UpdatesIcon(unreadCount: _unreadCount),
          selectedIcon: _UpdatesIcon(unreadCount: _unreadCount, selected: true),
          label: 'Updates',
        ),
        const NavigationDestination(
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

class _UpdatesIcon extends StatelessWidget {
  final int unreadCount;
  final bool selected;

  const _UpdatesIcon({required this.unreadCount, this.selected = false});

  @override
  Widget build(BuildContext context) {
    return Badge(
      isLabelVisible: unreadCount > 0,
      label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
      backgroundColor: AppColors.error,
      child: Icon(
        selected ? Icons.notifications_rounded : Icons.notifications_outlined,
        color: selected ? AppColors.primary : null,
      ),
    );
  }
}
