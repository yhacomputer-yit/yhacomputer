import 'package:flutter/material.dart';
import '../widgets/nav_bar.dart';
import '../theme/app_theme.dart';

class AboutUsScreen extends StatelessWidget {
  const AboutUsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About YHA'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
      ),
      body: RefreshIndicator(
        onRefresh: () async {},
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md,
                  AppSpacing.xl,
                  AppSpacing.md,
                  AppSpacing.lg,
                ),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary, AppColors.primaryLight],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Building skills that move\nfutures forward.',
                      style: AppTextStyles.displayMedium.copyWith(
                        color: Colors.white,
                        fontSize: 30,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'YHA Computer Training gives learners in Myanmar practical, job-ready IT education through guided lessons, real projects, and a supportive community.',
                      style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _ValuesGrid(),
                    const SizedBox(height: AppSpacing.xl),
                    _TeamSection(),
                    const SizedBox(height: AppSpacing.xl),
                    AppCard(
                      backgroundColor: AppColors.primaryContainer,
                      border: BorderSide.none,
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ready to start learning?',
                            style: AppTextStyles.displayMedium.copyWith(
                              color: AppColors.primary,
                              fontSize: 24,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Explore our course catalog and find the path that fits your goals.',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 20),
                          FilledButton(
                            onPressed: () =>
                                Navigator.pushNamed(context, '/courses'),
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  AppDimens.buttonRadius,
                                ),
                              ),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('Explore courses'),
                                SizedBox(width: 6),
                                Icon(Icons.arrow_forward, size: 18),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const NavBar(),
    );
  }
}

class _ValuesGrid extends StatelessWidget {
  const _ValuesGrid();

  static final _items = [
    _ValueItem(
      icon: Icons.track_changes,
      title: 'Mission',
      description:
          'Make practical technology education accessible to everyone who wants to build, create, and grow.',
    ),
    _ValueItem(
      icon: Icons.visibility,
      title: 'Vision',
      description:
          'A Myanmar workforce confident in modern IT, design, and programming skills.',
    ),
    _ValueItem(
      icon: Icons.favorite,
      title: 'Values',
      description:
          'Clear instruction, project-first learning, mentor support, and community-driven progress.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(label: 'Our story', title: 'What we believe'),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: AppSpacing.sm,
            mainAxisSpacing: AppSpacing.sm,
            childAspectRatio: 0.9,
          ),
          itemCount: _items.length,
          itemBuilder: (context, i) => _ValueCard(item: _items[i]),
        ),
      ],
    );
  }
}

class _ValueItem {
  final IconData icon;
  final String title;
  final String description;
  const _ValueItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}

class _ValueCard extends StatelessWidget {
  final _ValueItem item;
  const _ValueCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primaryContainer,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(item.icon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(height: 10),
          Text(item.title, style: AppTextStyles.titleMedium),
          const SizedBox(height: 6),
          Text(
            item.description,
            style: AppTextStyles.bodySmall,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _TeamSection extends StatelessWidget {
  const _TeamSection();

  static final _members = [
    _TeamMember('Aung Aung', 'Lead Instructor'),
    _TeamMember('Maya Soe', 'Curriculum Designer'),
    _TeamMember('Soe Moe', 'Community Manager'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(label: 'Our team', title: 'Meet the people'),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _members.asMap().entries.map((entry) {
              final i = entry.key;
              final member = entry.value;
              return Padding(
                padding: EdgeInsets.only(
                  right: i < _members.length - 1 ? AppSpacing.md : 0,
                ),
                child: _TeamMemberCard(member: member),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _TeamMember {
  final String name;
  final String role;
  const _TeamMember(this.name, this.role);
}

class _TeamMemberCard extends StatelessWidget {
  final _TeamMember member;
  const _TeamMemberCard({required this.member});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.primary,
            child: Text(
              member.name.isNotEmpty ? member.name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 24,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            member.name,
            style: AppTextStyles.titleMedium,
          ),
          const SizedBox(height: 2),
          Text(
            member.role,
            style: AppTextStyles.bodySmall,
          ),
        ],
      ),
    );
  }
}
