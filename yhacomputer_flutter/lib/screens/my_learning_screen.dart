import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
  String _resourceQuery = '';
  int _resourceCourseId = -1;

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
    final filteredResources = _filteredResources(learning?.resources ?? const <CourseResource>[]);
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
                  const SizedBox(height: AppSpacing.lg),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Course resources', style: AppTextStyles.titleLarge), if (learning != null) Text('${filteredResources.length} result${filteredResources.length == 1 ? '' : 's'}', style: AppTextStyles.bodySmall)]),
                  const SizedBox(height: AppSpacing.sm),
                  if (learning != null && learning.resources.isNotEmpty) ...[
                    TextField(decoration: const InputDecoration(prefixIcon: Icon(Icons.search_rounded), hintText: 'Search title, note, or type'), onChanged: (value) => setState(() => _resourceQuery = value)),
                    const SizedBox(height: AppSpacing.sm),
                    DropdownButtonFormField<int>(value: _resourceCourseId, decoration: const InputDecoration(prefixIcon: Icon(Icons.filter_list_rounded), labelText: 'Filter by course or subject'), items: [const DropdownMenuItem<int>(value: -1, child: Text('All courses and subjects')), ..._resourceCourseItems(learning.resources)], onChanged: (value) => setState(() => _resourceCourseId = value ?? -1)),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  if (learning == null || learning.resources.isEmpty)
                    AppEmptyState(
                      title: 'No resources yet',
                      subtitle: 'Files, PDFs, videos, ZIP archives, and notes will appear after your course is approved.',
                      icon: Icons.folder_open_outlined,
                    )
                  else if (filteredResources.isEmpty)
                    AppEmptyState(title: 'No matching resources', subtitle: 'Try another search word or choose a different course or subject.', icon: Icons.search_off_rounded)
                  else
                    ..._resourceGroups(filteredResources),
                ],
              ),
            ),
      bottomNavigationBar: const NavBar(),
    );
  }

  List<CourseResource> _filteredResources(List<CourseResource> resources) {
    final query = _resourceQuery.trim().toLowerCase();
    return resources.where((resource) {
      final matchesCourse = _resourceCourseId == -1 || resource.courseId == _resourceCourseId;
      final haystack = '${resource.title} ${resource.note} ${resource.resourceType} ${resource.courseTitle} ${resource.courseSubject}'.toLowerCase();
      return matchesCourse && (query.isEmpty || haystack.contains(query));
    }).toList();
  }

  List<DropdownMenuItem<int>> _resourceCourseItems(List<CourseResource> resources) {
    final courses = <int, String>{};
    for (final resource in resources) {
      courses[resource.courseId] = '${resource.courseTitle.isEmpty ? 'Course resources' : resource.courseTitle}${resource.courseSubject.isEmpty ? '' : ' · ${resource.courseSubject}'}';
    }
    return courses.entries.map((entry) => DropdownMenuItem<int>(value: entry.key, child: Text(entry.value, overflow: TextOverflow.ellipsis))).toList();
  }

  List<Widget> _resourceGroups(List<CourseResource> resources) {
    final groups = <String, List<CourseResource>>{};
    for (final resource in resources) {
      groups.putIfAbsent(resource.courseTitle.isEmpty ? 'Course resources' : resource.courseTitle, () => []).add(resource);
    }
    return groups.entries.map((entry) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(entry.key, style: AppTextStyles.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          ...entry.value.map(_resourceCard),
        ]),
      ),
    )).toList();
  }

  Widget _resourceCard(CourseResource resource) {
    final resourceType = resource.resourceType.trim().toLowerCase();
    final isVideo = resourceType == 'youtube';
    final isPdf = resourceType == 'pdf';
    final isNote = resourceType == 'note';
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: CircleAvatar(
          backgroundColor: isVideo ? AppColors.errorContainer : isPdf ? AppColors.primaryContainer : AppColors.primaryContainer,
          child: Icon(isVideo ? Icons.play_arrow_rounded : isPdf ? Icons.picture_as_pdf_rounded : isNote ? Icons.edit_note_rounded : Icons.download_rounded, color: AppColors.primary),
        ),
        title: Text(resource.title, style: AppTextStyles.titleMedium),
        subtitle: resource.note.isEmpty ? Text(resource.resourceType.toUpperCase()) : Text('${resource.resourceType.toUpperCase()} · ${resource.note}'),
        trailing: resource.url.isEmpty ? null : IconButton(
          tooltip: isVideo ? 'Watch video' : isPdf ? 'Download PDF' : 'Download resource',
          icon: Icon(isVideo ? Icons.play_circle_outline_rounded : Icons.download_rounded, color: AppColors.primary),
          onPressed: () => isVideo ? _showResourceViewer(resource) : _openResource(resource.url),
        ),
      ),
    );
  }

  String _youtubeEmbedUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null) return value;
    final id = uri.host.contains('youtu.be') ? (uri.pathSegments.isNotEmpty ? uri.pathSegments.first : null) : uri.queryParameters['v'] ?? (uri.pathSegments.isNotEmpty ? uri.pathSegments.last : null);
    return id == null || id.isEmpty ? value : 'https://www.youtube-nocookie.com/embed/$id?rel=0';
  }

  Future<void> _showResourceViewer(CourseResource resource) async {
    final resourceType = resource.resourceType.trim().toLowerCase();
    final isVideo = resourceType == 'youtube';
    final source = isVideo ? _youtubeEmbedUrl(resource.url) : 'https://docs.google.com/gview?embedded=1&url=${Uri.encodeComponent(resource.url)}';
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(onWebResourceError: (_) {}))
      ..loadRequest(Uri.parse(source));
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        child: SizedBox(
          width: double.infinity,
          height: MediaQuery.of(dialogContext).size.height * .78,
          child: Column(
            children: [
              ListTile(
                title: Text(resource.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                subtitle: Text(isVideo ? 'Video lesson' : 'PDF preview'),
                trailing: Row(mainAxisSize: MainAxisSize.min, children: [IconButton(tooltip: 'Open externally', icon: const Icon(Icons.open_in_new_rounded), onPressed: () => _openResource(resource.url)), IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(dialogContext).pop())]),
              ),
              const Divider(height: 1),
              Expanded(child: WebViewWidget(controller: controller)),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openResource(String value) async {
    final uri = Uri.tryParse(value);
    if (uri == null || !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unable to open this resource.')));
    }
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
          const SizedBox(height: 4),
          Text('Account: ${profile.statusLabel}', style: AppTextStyles.bodySmall.copyWith(color: Colors.white.withValues(alpha: 0.86), fontWeight: FontWeight.w700)),
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
                const SizedBox(height: 8),
                Row(children: [const Icon(Icons.payments_outlined, size: 17, color: AppColors.onSurfaceVariant), const SizedBox(width: 6), Expanded(child: Text('Payment: ${enrollment.paymentStatusLabel} · Total ${enrollment.paymentDue} · Paid ${enrollment.paymentPaid} · Balance ${(enrollment.paymentDue - enrollment.paymentPaid).clamp(0, enrollment.paymentDue)}', style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w700, color: enrollment.paymentStatus == 'paid' || enrollment.paymentStatus == 'waived' ? AppColors.success : AppColors.onSurfaceVariant))) ]),
                if (enrollment.paymentMethod.isNotEmpty || enrollment.paymentReference.isNotEmpty || enrollment.paymentDueDate.isNotEmpty || enrollment.paymentPaidDate.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text('${enrollment.paymentMethod}${enrollment.paymentReference.isNotEmpty ? ' · ${enrollment.paymentReference}' : ''}${enrollment.paymentDueDate.isNotEmpty ? ' · Due date: ${enrollment.paymentDueDate.substring(0, enrollment.paymentDueDate.length > 10 ? 10 : enrollment.paymentDueDate.length)}' : ''}${enrollment.paymentPaidDate.isNotEmpty ? ' · Paid date: ${enrollment.paymentPaidDate.substring(0, enrollment.paymentPaidDate.length > 10 ? 10 : enrollment.paymentPaidDate.length)}' : ''}', style: AppTextStyles.bodySmall),
                ],
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
    final normalized = status.trim().toLowerCase();
    final (label, color, background) = switch (normalized) {
      '1' || 'true' || 'active' => ('ACTIVE', AppColors.success, const Color(0xFFECFDF5)),
      '0' || 'false' || 'inactive' => ('INACTIVE', AppColors.onSurfaceVariant, AppColors.background),
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
