import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/nav_bar.dart';
import '../theme/app_theme.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();
  String statusType = 'idle';
  String statusMessage = '';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      statusType = 'loading';
      statusMessage = 'Sending your message\u2026';
    });
    try {
      await ApiService.submitContact(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        message: _messageController.text.trim(),
      );
      _nameController.clear();
      _emailController.clear();
      _messageController.clear();
      setState(() {
        statusType = 'success';
        statusMessage =
            'Message received. Our team will get back to you soon.';
      });
    } catch (e) {
      setState(() {
        statusType = 'error';
        statusMessage = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact'),
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
                      "Let's find the right next step.",
                      style: AppTextStyles.displayMedium.copyWith(
                        color: Colors.white,
                        fontSize: 30,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Send your question to the YHA team. Your message is stored in Turso and reviewed by our admissions advisors.',
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
                    _ContactInfoCard(),
                    const SizedBox(height: AppSpacing.xl),
                    _ContactForm(
                      formKey: _formKey,
                      nameController: _nameController,
                      emailController: _emailController,
                      messageController: _messageController,
                      statusType: statusType,
                      statusMessage: statusMessage,
                      onSubmit: _submit,
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

class _ContactInfoCard extends StatelessWidget {
  const _ContactInfoCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Contact information',
            style: AppTextStyles.titleMedium,
          ),
          const SizedBox(height: 16),
          _InfoRow(Icons.location_on_outlined, 'Address',
              'No.29, 6th Floor, Insein Rd, Yangon 11041, Myanmar'),
          const SizedBox(height: 12),
          _InfoRow(Icons.phone_outlined, 'Phone', '+95 9 882 328992'),
          const SizedBox(height: 12),
          _InfoRow(Icons.email_outlined, 'Email', 'yhacomputer@gmail.com'),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ContactForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController messageController;
  final String statusType;
  final String statusMessage;
  final Future<void> Function() onSubmit;

  const _ContactForm({
    required this.formKey,
    required this.nameController,
    required this.emailController,
    required this.messageController,
    required this.statusType,
    required this.statusMessage,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      backgroundColor: AppColors.surface,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Send us a message',
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: nameController,
              decoration: InputDecoration(
                labelText: 'Name',
                prefixIcon: const Icon(Icons.person_outlined),
              ),
              validator: (v) => v == null || v.trim().isEmpty
                  ? 'Name is required'
                  : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                prefixIcon: const Icon(Icons.email_outlined),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Email is required';
                if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(v.trim())) {
                  return 'Enter a valid email';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: messageController,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: 'Message',
                prefixIcon: const Icon(Icons.message_outlined),
              ),
              validator: (v) => v == null || v.trim().isEmpty
                  ? 'Message is required'
                  : null,
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton(
                onPressed: statusType == 'loading' ? null : onSubmit,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppDimens.buttonRadius),
                  ),
                ),
                child: statusType == 'loading'
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 12),
                          Text('Sending\u2026'),
                        ],
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Send message'),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward, size: 18),
                        ],
                      ),
              ),
            ),
            if (statusType != 'idle') ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: statusType == 'success'
                      ? const Color(0xFFECFAF5)
                      : statusType == 'error'
                          ? AppColors.errorContainer
                          : AppColors.background,
                ),
                child: Text(
                  statusMessage,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: statusType == 'success'
                        ? AppColors.success
                        : statusType == 'error'
                            ? AppColors.error
                            : AppColors.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
