import 'package:flutter/material.dart';

import '../services/student_auth_service.dart';
import '../theme/app_theme.dart';

class StudentAccountScreen extends StatefulWidget {
  final int? requestedCourseId;

  const StudentAccountScreen({super.key, this.requestedCourseId});

  @override
  State<StudentAccountScreen> createState() => _StudentAccountScreenState();
}

class _StudentAccountScreenState extends State<StudentAccountScreen> {
  final _loginKey = GlobalKey<FormState>();
  final _registerKey = GlobalKey<FormState>();
  final _helpKey = GlobalKey<FormState>();
  final _studentId = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _note = TextEditingController();
  final _helpStudentId = TextEditingController();
  final _helpEmail = TextEditingController();

  int _tab = 0;
  bool _busy = false;
  bool _obscureLogin = true;
  bool _obscureRegister = true;
  String _message = '';
  bool _isError = false;

  @override
  void dispose() {
    for (final controller in [
      _studentId,
      _password,
      _name,
      _email,
      _phone,
      _newPassword,
      _confirmPassword,
      _note,
      _helpStudentId,
      _helpEmail,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  void _showMessage(String message, {bool error = false}) {
    if (!mounted) return;
    setState(() {
      _message = message;
      _isError = error;
    });
  }

  Future<void> _signIn() async {
    if (!_loginKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await StudentAuthService.instance.signIn(
        studentId: _studentId.text,
        password: _password.text,
      );
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(context, '/my-learning', (route) => route.isFirst);
    } catch (error) {
      _showMessage(error.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _register() async {
    if (!_registerKey.currentState!.validate()) return;
    if (_newPassword.text != _confirmPassword.text) {
      _showMessage('The password confirmation does not match.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      final message = await StudentAuthService.instance.register(
        name: _name.text,
        email: _email.text,
        phone: _phone.text,
        password: _newPassword.text,
        courseId: widget.requestedCourseId,
        studentNote: _note.text,
      );
      _showMessage(message);
      setState(() => _tab = 0);
    } catch (error) {
      _showMessage(error.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _requestHelp() async {
    if (!_helpKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      final message = await StudentAuthService.instance.requestPasswordHelp(
        studentId: _helpStudentId.text,
        email: _helpEmail.text,
      );
      _showMessage(message);
    } catch (error) {
      _showMessage(error.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _required(String? value, String label) {
    if (value == null || value.trim().isEmpty) return '$label is required.';
    return null;
  }

  String? _emailValidator(String? value) {
    final required = _required(value, 'Email');
    if (required != null) return required;
    if (!RegExp(r'^\S+@\S+\.\S+$').hasMatch(value!.trim())) {
      return 'Enter a valid email address.';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final hasCourseRequest = widget.requestedCourseId != null;
    return Scaffold(
      appBar: AppBar(title: const Text('Student account')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.md,
            AppSpacing.md,
            AppSpacing.md,
            AppSpacing.xl,
          ),
          children: [
            AppCard(
              backgroundColor: AppColors.primaryContainer,
              border: BorderSide.none,
              child: Row(
                children: [
                  const Icon(Icons.school_rounded, color: AppColors.primary),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      hasCourseRequest
                          ? 'Create an account to send your course enrollment request.'
                          : 'Sign in to view your courses, requests, and class information.',
                      style: AppTextStyles.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('Sign in'), icon: Icon(Icons.login_rounded)),
                ButtonSegment(value: 1, label: Text('Register'), icon: Icon(Icons.person_add_alt_1_rounded)),
                ButtonSegment(value: 2, label: Text('Password help'), icon: Icon(Icons.key_outlined)),
              ],
              selected: {_tab},
              onSelectionChanged: _busy ? null : (selection) => setState(() => _tab = selection.first),
              showSelectedIcon: false,
            ),
            const SizedBox(height: AppSpacing.lg),
            if (_message.isNotEmpty)
              AppCard(
                backgroundColor: _isError ? AppColors.errorContainer : AppColors.primaryContainer,
                border: BorderSide.none,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      _isError ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
                      color: _isError ? AppColors.error : AppColors.success,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(child: Text(_message, style: AppTextStyles.bodyMedium)),
                  ],
                ),
              ),
            if (_message.isNotEmpty) const SizedBox(height: AppSpacing.md),
            if (_tab == 0) _buildLoginForm() else if (_tab == 1) _buildRegisterForm() else _buildHelpForm(),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Form(
      key: _loginKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Welcome back', style: AppTextStyles.displayMedium),
          const SizedBox(height: 6),
          Text('Use the Student ID and password shared by YHA.', style: AppTextStyles.bodyMedium),
          const SizedBox(height: AppSpacing.lg),
          TextFormField(
            controller: _studentId,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'Student ID', hintText: 'YHA0001', prefixIcon: Icon(Icons.badge_outlined)),
            validator: (value) => _required(value, 'Student ID'),
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _password,
            obscureText: _obscureLogin,
            decoration: InputDecoration(
              labelText: 'Password',
              prefixIcon: const Icon(Icons.lock_outline_rounded),
              suffixIcon: IconButton(
                tooltip: _obscureLogin ? 'Show password' : 'Hide password',
                onPressed: () => setState(() => _obscureLogin = !_obscureLogin),
                icon: Icon(_obscureLogin ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              ),
            ),
            validator: (value) => _required(value, 'Password'),
          ),
          const SizedBox(height: AppSpacing.lg),
          FilledButton.icon(
            onPressed: _busy ? null : _signIn,
            icon: _busy ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.login_rounded),
            label: Text(_busy ? 'Signing in…' : 'Sign in'),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterForm() {
    return Form(
      key: _registerKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Create your student account', style: AppTextStyles.displayMedium),
          const SizedBox(height: 6),
          Text('YHA will review and activate your account before your first sign-in.', style: AppTextStyles.bodyMedium),
          const SizedBox(height: AppSpacing.lg),
          TextFormField(controller: _name, decoration: const InputDecoration(labelText: 'Full name', prefixIcon: Icon(Icons.person_outline_rounded)), validator: (value) => _required(value, 'Full name')),
          const SizedBox(height: AppSpacing.md),
          TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined)), validator: _emailValidator),
          const SizedBox(height: AppSpacing.md),
          TextFormField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined)), validator: (value) => _required(value, 'Phone')),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _newPassword,
            obscureText: _obscureRegister,
            decoration: InputDecoration(
              labelText: 'Choose a password',
              helperText: 'Use at least 8 characters.',
              prefixIcon: const Icon(Icons.lock_outline_rounded),
              suffixIcon: IconButton(
                tooltip: _obscureRegister ? 'Show password' : 'Hide password',
                onPressed: () => setState(() => _obscureRegister = !_obscureRegister),
                icon: Icon(_obscureRegister ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              ),
            ),
            validator: (value) {
              final required = _required(value, 'Password');
              if (required != null) return required;
              return value!.length >= 8 ? null : 'Use at least 8 characters.';
            },
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(controller: _confirmPassword, obscureText: _obscureRegister, decoration: const InputDecoration(labelText: 'Confirm password', prefixIcon: Icon(Icons.lock_reset_outlined)), validator: (value) => _required(value, 'Password confirmation')),
          if (hasCourseRequest) ...[
            const SizedBox(height: AppSpacing.md),
            TextFormField(controller: _note, maxLines: 3, maxLength: 1000, decoration: const InputDecoration(labelText: 'Note for admissions (optional)', hintText: 'Preferred class time or a question')),
          ],
          const SizedBox(height: AppSpacing.lg),
          FilledButton.icon(
            onPressed: _busy ? null : _register,
            icon: _busy ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send_rounded),
            label: Text(_busy ? 'Sending request…' : hasCourseRequest ? 'Create account & request enrollment' : 'Create account'),
          ),
        ],
      ),
    );
  }

  bool get hasCourseRequest => widget.requestedCourseId != null;

  Widget _buildHelpForm() {
    return Form(
      key: _helpKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Password help', style: AppTextStyles.displayMedium),
          const SizedBox(height: 6),
          Text('Confirm your Student ID and account email. YHA will verify your identity before issuing a new password.', style: AppTextStyles.bodyMedium),
          const SizedBox(height: AppSpacing.lg),
          TextFormField(controller: _helpStudentId, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Student ID', hintText: 'YHA0001', prefixIcon: Icon(Icons.badge_outlined)), validator: (value) => _required(value, 'Student ID')),
          const SizedBox(height: AppSpacing.md),
          TextFormField(controller: _helpEmail, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Account email', prefixIcon: Icon(Icons.email_outlined)), validator: _emailValidator),
          const SizedBox(height: AppSpacing.lg),
          FilledButton.icon(
            onPressed: _busy ? null : _requestHelp,
            icon: _busy ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.support_agent_rounded),
            label: Text(_busy ? 'Sending…' : 'Request password help'),
          ),
        ],
      ),
    );
  }
}
