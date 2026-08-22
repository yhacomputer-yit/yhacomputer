import 'package:flutter/material.dart';

import '../services/student_auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/nav_bar.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('More'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.sm,
          AppSpacing.md,
          AppSpacing.xl,
        ),
        children: [
          const _LearningHubCard(),
          const SizedBox(height: AppSpacing.lg),
          Text('Your account', style: AppTextStyles.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          ValueListenableBuilder(
            valueListenable: StudentAuthService.instance.session,
            builder: (context, session, _) => _MenuCard(
              children: [
                _MenuItem(
                  icon: session == null ? Icons.login_rounded : Icons.auto_stories_rounded,
                  title: session == null ? 'Student login' : 'My Learning',
                  subtitle: session == null
                      ? 'Sign in to track course requests and class information.'
                      : 'Open your courses, enrollment status, and learner profile.',
                  onTap: () => Navigator.pushNamed(
                    context,
                    session == null ? '/student-login' : '/my-learning',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Discover', style: AppTextStyles.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          _MenuCard(
            children: [
              _MenuItem(
                icon: Icons.event_available_outlined,
                title: 'Events & workshops',
                subtitle: 'Find upcoming classes, labs and community events.',
                onTap: () => Navigator.pushNamed(context, '/events'),
              ),
              _MenuItem(
                icon: Icons.forum_outlined,
                title: 'Student stories',
                subtitle: 'Read feedback from the YHA learning community.',
                onTap: () => Navigator.pushNamed(context, '/reviews'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Help & information', style: AppTextStyles.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          _MenuCard(
            children: [
              _MenuItem(
                icon: Icons.support_agent_outlined,
                title: 'Talk to admissions',
                subtitle: 'Ask a question about a course or enrollment.',
                onTap: () => Navigator.pushNamed(context, '/contact'),
              ),
              _MenuItem(
                icon: Icons.school_outlined,
                title: 'About YHA Computer',
                subtitle: 'Learn about our teaching approach and community.',
                onTap: () => Navigator.pushNamed(context, '/about-us'),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: const NavBar(),
    );
  }
}

class _LearningHubCard extends StatelessWidget {
  const _LearningHubCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.primary,
      border: BorderSide.none,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.auto_stories_rounded, color: Colors.white, size: 30),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Your learning space',
            style: AppTextStyles.titleLarge.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 6),
          Text(
            'Explore courses, save your time with updates, and get help whenever you need it.',
            style: AppTextStyles.bodyMedium.copyWith(
              color: Colors.white.withValues(alpha: 0.86),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          FilledButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/courses'),
            icon: const Icon(Icons.auto_stories_outlined),
            label: const Text('Browse courses'),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final List<Widget> children;
  const _MenuCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(children: children),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      leading: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: AppColors.primaryContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: AppColors.primary),
      ),
      title: Text(title, style: AppTextStyles.titleMedium),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 3),
        child: Text(subtitle, style: AppTextStyles.bodySmall),
      ),
      trailing: const Icon(
        Icons.chevron_right_rounded,
        color: AppColors.onSurfaceVariant,
      ),
    );
  }
}
