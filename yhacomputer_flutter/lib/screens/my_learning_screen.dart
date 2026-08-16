import 'package:flutter/material.dart';

import '../models/student.dart';
import '../services/student_auth_service.dart';
import '../theme/app_theme.dart';
import '../utils/course_formatters.dart';
import '../widgets/nav_bar.dart';

class MyLearningScreen extends StatefulWidget {
  const MyLearningScreen({super.key});

  @override
  State<MyLearningScreen> createState() => _MyLearningScreenState();
}

class _MyLearningScreenState extends State<MyLearningScreen> {
  StudentLearningBundle? _learning;
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _learning = StudentAuthService.instance.currentSession?.learning;
    _refresh(showLoading: _learning == null);
  }

  Future<void> _refresh({bool showLoading = true}) async {
    if (!StudentAuthService.instance.isSignedIn) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    if (showLoading) setState(() => _loading = true);
    try {
      final learning = await StudentAuthService.instance.refresh();
      if (!mounted) return;
      setState(() {
        _learning = learning;
        _error = '';
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted && showLoading) setState(() => _loading = false);
    }
  }

  Future<void> _cancel(Enrollment enrollment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel request?'),
        content: Text('Your pending request for ${enrollment.course.title} will be cancelled.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep request')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Cancel request')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      final learning = await StudentAuthService.instance.cancelEnrollment(enrollment.id);
      if (!mounted) return;
      setState(() => _learning = learning);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enrollment request cancelled.')));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Future<void> _editProfile() async {
    final learning = _learning;
    if (learning == null) return;
    final profile = learning.student;
    final name = TextEditingController(text: profile.name);
    final phone = TextEditingController(text: profile.phone);
    final viber = TextEditingController(text: profile.viberPhone);
    final city = TextEditingController(text: profile.city);
    final township = TextEditingController(text: profile.township);
    final education = TextEditingController(text: profile.education);
    final formKey = GlobalKey<FormState>();
    try {
      final saved = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        builder: (context) => Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 24),
          child: SafeArea(
            top: false,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Edit profile', style: AppTextStyles.titleLarge),
                    const SizedBox(height: AppSpacing.md),
                    TextFormField(controller: name, decoration: const InputDecoration(labelText: 'Full name'), validator: (value) => value == null || value.trim().isEmpty ? 'Name is required.' : null),
                    const SizedBox(height: AppSpacing.sm),
                    TextFormField(controller: phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone'), validator: (value) => value == null || value.trim().isEmpty ? 'Phone is required.' : null),
                    const SizedBox(height: AppSpacing.sm),
                    TextFormField(controller: viber, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Viber phone (optional)')),
                    const SizedBox(height: AppSpacing.sm),
                    TextFormField(controller: city, decoration: const InputDecoration(labelText: 'City (optional)')),
                    const SizedBox(height: AppSpacing.sm),
                    TextFormField(controller: township, decoration: const InputDecoration(labelText: 'Township (optional)')),
                    const SizedBox(height: AppSpacing.sm),
                    TextFormField(controller: education, decoration: const InputDecoration(labelText: 'Education (optional)')),
                    const SizedBox(height: AppSpacing.lg),
                    FilledButton(
                      onPressed: () {
                        if (formKey.currentState!.validate()) Navigator.pop(context, true);
                      },
                      child: const Text('Save profile'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      if (saved != true) return;
      final updated = await StudentAuthService.instance.updateProfile(
        name: name.text,
        phone: phone.text,
        viberPhone: viber.text,
        city: city.text,
        township: township.text,
        education: education.text,
      );
      if (!mounted) return;
      setState(() => _learning = updated);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated.')));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      name.dispose();
      phone.dispose();
      viber.dispose();
      city.dispose();
      township.dispose();
      education.dispose();
    }
  }

  Future<void> _changePassword() async {
    final current = TextEditingController();
    final next = TextEditingController();
    final confirm = TextEditingController();
    final formKey = GlobalKey<FormState>();
    try {
      final saved = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        builder: (context) => Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 24),
          child: SafeArea(
            top: false,
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Change password', style: AppTextStyles.titleLarge),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(controller: current, obscureText: true, decoration: const InputDecoration(labelText: 'Current password'), validator: (value) => value == null || value.isEmpty ? 'Current password is required.' : null),
                  const SizedBox(height: AppSpacing.sm),
                  TextFormField(controller: next, obscureText: true, decoration: const InputDecoration(labelText: 'New password', helperText: 'Use at least 8 characters.'), validator: (value) => value != null && value.length >= 8 ? null : 'Use at least 8 characters.'),
                  const SizedBox(height: AppSpacing.sm),
                  TextFormField(controller: confirm, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm new password'), validator: (value) => value == next.text ? null : 'Passwords do not match.'),
                  const SizedBox(height: AppSpacing.lg),
                  FilledButton(onPressed: () { if (formKey.currentState!.validate()) Navigator.pop(context, true); }, child: const Text('Update password')),
                ],
              ),
            ),
          ),
        ),
      );
      if (saved != true) return;
      final message = await StudentAuthService.instance.changePassword(currentPassword: current.text, newPassword: next.text);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      current.dispose();
      next.dispose();
      confirm.dispose();
    }
  }

  Future<void> _signOut() async {
    await StudentAuthService.instance.signOut();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, '/more', (route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    if (!StudentAuthService.instance.isSignedIn) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Learning')),
        body: AppEmptyState(
          title: 'Sign in to start learning',
          subtitle: 'View your enrollment requests, approved courses, and class information in one place.',
          icon: Icons.lock_outline_rounded,
          actionLabel: 'Student login',
          onAction: () => Navigator.pushNamed(context, '/student-login'),
        ),
        bottomNavigationBar: const NavBar(),
      );
    }

    final learning = _learning;
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Learning'),
        actions: [
          IconButton(onPressed: () => _refresh(showLoading: false), tooltip: 'Refresh', icon: const Icon(Icons.refresh_rounded)),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'profile') _editProfile();
              if (value == 'password') _changePassword();
              if (value == 'signout') _signOut();
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'profile', child: Text('Edit profile')),
              PopupMenuItem(value: 'password', child: Text('Change password')),
              PopupMenuDivider(),
              PopupMenuItem(value: 'signout', child: Text('Sign out')),
            ],
          ),
        ],
      ),
      body: _loading && learning == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xl),
                children: [
                  if (learning != null) _profileHeader(learning.student),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.md),
                    AppErrorState(_error, title: 'Showing your saved learning records', onRetry: _refresh),
                  ],
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Your courses', style: AppTextStyles.titleLarge),
                      TextButton.icon(onPressed: () => Navigator.pushNamed(context, '/courses'), icon: const Icon(Icons.add_rounded, size: 18), label: const Text('Find a course')),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  if (learning == null || learning.enrollments.isEmpty)
                    AppEmptyState(
                      title: 'No course requests yet',
                      subtitle: 'Browse the catalog and send an enrollment request when you find the right course.',
                      icon: Icons.auto_stories_outlined,
                      actionLabel: 'Browse courses',
                      onAction: () => Navigator.pushNamed(context, '/courses'),
                    )
                  else
                    ...learning.enrollments.map(_enrollmentCard),
                ],
              ),
            ),
      bottomNavigationBar: const NavBar(),
    );
  }

  Widget _profileHeader(StudentProfile profile) {
    final enrolled = _learning?.enrollments.where((item) => item.status == 'approved').length ?? 0;
    final pending = _learning?.enrollments.where((item) => item.status == 'pending').length ?? 0;
    return AppCard(
      backgroundColor: AppColors.primary,
      border: BorderSide.none,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Welcome, ${profile.name}', style: AppTextStyles.titleLarge.copyWith(color: Colors.white)),
          const SizedBox(height: 4),
          Text(profile.studentId, style: AppTextStyles.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.8))),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              _metric('$enrolled', 'Active courses'),
              const SizedBox(width: AppSpacing.lg),
              _metric('$pending', 'Awaiting review'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metric(String value, String label) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(value, style: AppTextStyles.titleLarge.copyWith(color: Colors.white)),
      Text(label, style: AppTextStyles.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.78))),
    ],
  );

  Widget _enrollmentCard(Enrollment enrollment) {
    final course = enrollment.course;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        child: InkWell(
          onTap: course.id == null ? null : () => Navigator.pushNamed(context, '/courses/:id', arguments: {'id': course.id}),
          borderRadius: BorderRadius.circular(AppDimens.cardRadius),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: Text(course.title, style: AppTextStyles.titleMedium)),
                    _statusBadge(enrollment.status),
                  ],
                ),
                if (course.badgeList.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: course.badgeList.map((badge) => AppBadge(text: badge)).toList()),
                ],
                if (enrollment.sessionName.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Row(children: [const Icon(Icons.schedule_outlined, size: 17, color: AppColors.onSurfaceVariant), const SizedBox(width: 6), Expanded(child: Text('${enrollment.sessionName}${enrollment.sessionStartTime.isNotEmpty ? ' · ${enrollment.sessionStartTime}–${enrollment.sessionEndTime}' : ''}', style: AppTextStyles.bodySmall))]),
                ],
                const SizedBox(height: 10),
                Text(formatCourseFee(course.price), style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w800, color: AppColors.primary)),
                if (enrollment.adminNote.isNotEmpty || enrollment.studentNote.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(enrollment.adminNote.isNotEmpty ? enrollment.adminNote : enrollment.studentNote, style: AppTextStyles.bodySmall),
                ],
                if (enrollment.status == 'pending') ...[
                  const SizedBox(height: AppSpacing.sm),
                  TextButton.icon(onPressed: () => _cancel(enrollment), icon: const Icon(Icons.close_rounded, size: 18), label: const Text('Cancel request')),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _statusBadge(String status) {
    final normalized = status.toLowerCase();
    final (label, color, background) = switch (normalized) {
      'approved' => ('ENROLLED', AppColors.success, const Color(0xFFECFDF5)),
      'completed' => ('COMPLETED', AppColors.primary, AppColors.primaryContainer),
      'rejected' => ('NOT APPROVED', AppColors.error, AppColors.errorContainer),
      'cancelled' => ('CANCELLED', AppColors.onSurfaceVariant, AppColors.background),
      _ => ('PENDING', AppColors.accent, AppColors.accentContainer),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: AppTextStyles.labelMedium.copyWith(color: color, fontSize: 10, fontWeight: FontWeight.w800)),
    );
  }
}
