import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  bool authenticated = false;
  String password = '';
  String passwordError = '';
  String activeTable = 'courses';
  bool loading = false;
  List<dynamic> rows = [];
  int currentPage = 1;

  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _imageController = TextEditingController();
  final _subjectController = TextEditingController();
  final _levelController = TextEditingController();
  final _durationController = TextEditingController();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();
  final _venueController = TextEditingController();
  final _categoryController = TextEditingController();
  final _eventTypeController = TextEditingController();
  final _eventDateController = TextEditingController();
  final _courseNameController = TextEditingController();
  final _notifTitleController = TextEditingController();
  final _notifMessageController = TextEditingController();
  final _notifCourseIdController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    if (!authenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin')),
        body: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: AppCard(
                backgroundColor: AppColors.surface,
                padding: const EdgeInsets.all(AppSpacing.xl),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Administrator access',
                        style: AppTextStyles.displayMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Enter the admin password to open the content workspace.',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      TextFormField(
                        controller: TextEditingController(text: password),
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Admin password',
                          prefixIcon: const Icon(Icons.lock_outline),
                        ),
                        onChanged: (v) => password = v,
                      ),
                      if (passwordError.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          passwordError,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.error,
                          ),
                        ),
                      ],
                      const SizedBox(height: AppSpacing.md),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _login,
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                  AppDimens.buttonRadius),
                            ),
                          ),
                          child: const Text('Open workspace'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.onSurface,
        actions: [
          TextButton(
            onPressed: _logout,
            child: const Text('Log out',
                style: TextStyle(color: AppColors.primary)),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(kToolbarHeight),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
            color: AppColors.surface,
              child: Row(
              children: ['courses', 'events', 'reviews', 'contacts', 'notifications']
                  .map((table) {
                final selected = activeTable == table;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
                    child: InkWell(
                      onTap: () => setState(() {
                        activeTable = table;
                        currentPage = 1;
                        _loadList();
                      }),
                      borderRadius: BorderRadius.circular(11),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.primary
                              : AppColors.background,
                          borderRadius: BorderRadius.circular(11),
                          border: Border.all(
                            color: selected
                                ? AppColors.primary
                                : AppColors.border,
                          ),
                        ),
                        child: Text(
                          table == 'notifications'
                              ? 'Noti'
                              : table[0].toUpperCase() + table.substring(1),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: selected
                                ? Colors.white
                                : AppColors.onSurfaceVariant,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(child: _buildContent()),
        ],
      ),
      floatingActionButton: activeTable != 'contacts'
          ? FloatingActionButton(
              onPressed: _showForm,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildContent() {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (rows.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          AppEmptyState(
            title: 'No records yet.',
            subtitle: 'No data in this table.',
            icon: Icons.inbox_outlined,
          ),
        ],
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: rows.length,
      separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (context, i) {
        final row = rows[i];
        return AppCard(
          backgroundColor: AppColors.surface,
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      row['title'] ?? row['name'] ?? 'Untitled',
                      style: AppTextStyles.titleMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Row(
                    children: [
                      if (activeTable != 'contacts') ...[
                        IconButton(
                          onPressed: () => _editRow(row),
                          icon: const Icon(Icons.edit_outlined,
                              color: AppColors.primary, size: 20),
                        ),
                        IconButton(
                          onPressed: () => _deleteRow(row['id']),
                          icon: const Icon(Icons.delete_outline,
                              color: AppColors.error, size: 20),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              if (row['course_name'] != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    row['course_name'],
                    style: AppTextStyles.bodySmall,
                  ),
                ),
              if (row['description'] != null && row['description'].isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    row['description'],
                    style: AppTextStyles.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              if (row['email'] != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    row['email'],
                    style: AppTextStyles.bodySmall,
                  ),
                ),
              if (row['created_at'] != null)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    row['created_at'],
                    style: AppTextStyles.bodySmall.copyWith(fontSize: 11),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _login() async {
    setState(() {
      passwordError = '';
    });
    try {
      await ApiService.adminRequest('list', 'courses', password: password);
      setState(() {
        authenticated = true;
      });
      _loadList();
    } catch (e) {
      setState(() {
        passwordError = 'Invalid password.';
      });
    }
  }

  void _logout() {
    setState(() {
      authenticated = false;
      password = '';
      passwordError = '';
      rows = [];
    });
  }

  Future<void> _loadList() async {
    setState(() {
      loading = true;
    });
    try {
      final result = await ApiService.adminRequest(
        'list',
        activeTable,
        password: password,
      );
      setState(() {
        rows = result['rows'] ?? [];
        loading = false;
      });
    } catch (e) {
      setState(() {
        loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _showForm({Map<String, dynamic>? row}) {
    final isEdit = row != null;
    if (!isEdit) {
      _titleController.clear();
      _descriptionController.clear();
      _priceController.clear();
      _imageController.clear();
      _subjectController.clear();
      _levelController.clear();
      _durationController.clear();
      _nameController.clear();
      _emailController.clear();
      _messageController.clear();
      _venueController.clear();
      _categoryController.clear();
      _eventTypeController.clear();
      _eventDateController.clear();
      _courseNameController.clear();
      _notifTitleController.clear();
      _notifMessageController.clear();
      _notifCourseIdController.clear();
    } else {
      _titleController.text = row['title'] ?? '';
      _descriptionController.text = row['description'] ?? '';
      _priceController.text = row['price'] ?? '';
      _imageController.text = row['image'] ?? '';
      _subjectController.text = row['subject'] ?? '';
      _levelController.text = row['level'] ?? '';
      _durationController.text = row['duration'] ?? '';
      _nameController.text = row['name'] ?? '';
      _emailController.text = row['email'] ?? '';
      _messageController.text = row['message'] ?? '';
      _venueController.text = row['venue'] ?? '';
      _categoryController.text = row['category'] ?? '';
      _eventTypeController.text = row['event_type'] ?? '';
      _eventDateController.text = row['date'] ?? '';
      _courseNameController.text = row['course_name'] ?? '';
      _notifTitleController.text = row['title'] ?? '';
      _notifMessageController.text = row['message'] ?? '';
      _notifCourseIdController.text =
          row['course_id'] != null ? '${row['course_id']}' : '';
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppDimens.cardRadius),
        ),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          MediaQuery.of(context).viewInsets.bottom + AppSpacing.md,
        ),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  isEdit
                      ? 'Edit ${activeTable.capitalize()}'
                      : 'Add ${activeTable.capitalize()}',
                  style: AppTextStyles.titleLarge,
                ),
                const SizedBox(height: AppSpacing.md),
                ..._getFormFields(),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => _submitForm(isEdit, row),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(AppDimens.buttonRadius),
                      ),
                    ),
                    child: Text(isEdit ? 'Save changes' : 'Add'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _getFormFields() {
    switch (activeTable) {
      case 'courses':
        return [
          _textField(_titleController, 'Title', required: true),
          _textField(_descriptionController, 'Description', maxLines: 3),
          _textField(_priceController, 'Price'),
          _textField(_imageController, 'Image URL'),
          _textField(_subjectController, 'Subject'),
          _textField(_levelController, 'Level'),
          _textField(_durationController, 'Duration'),
        ];
      case 'events':
        return [
          _textField(_titleController, 'Title', required: true),
          _textField(_descriptionController, 'Description', maxLines: 3),
          _textField(_eventDateController, 'Date'),
          _textField(_venueController, 'Venue'),
          _textField(_categoryController, 'Category'),
          _textField(_eventTypeController, 'Event type'),
          _textField(_durationController, 'Duration'),
          _textField(_imageController, 'Image URLs (pipe separated)'),
        ];
      case 'reviews':
        return [
          _textField(_nameController, 'Student name', required: true),
          _textField(_courseNameController, 'Course name'),
          _textField(_messageController, 'Message', maxLines: 3, required: true),
        ];
      case 'contacts':
        return [
          _textField(_nameController, 'Name', required: true),
          _textField(_emailController, 'Email', required: true),
          _textField(_messageController, 'Message', maxLines: 3, required: true),
        ];
      case 'notifications':
        return [
          _textField(_notifTitleController, 'Title', required: true),
          _textField(_notifMessageController, 'Message', maxLines: 3, required: true),
          _textField(_notifCourseIdController, 'Course ID (optional)'),
        ];
      default:
        return [_textField(_titleController, 'Title')];
    }
  }

  Widget _textField(
    TextEditingController controller,
    String label, {
    int maxLines = 1,
    bool required = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.text_format_outlined),
        ),
        validator: (v) => required && (v == null || v.trim().isEmpty)
            ? '$label is required'
            : null,
      ),
    );
  }

  Future<void> _submitForm(bool isEdit, Map<String, dynamic>? row) async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      loading = true;
    });
    try {
      final values = _collectValues();
      if (isEdit) {
        await ApiService.adminRequest(
          'update',
          activeTable,
          values: values,
          id: row?['id'],
          password: password,
        );
      } else {
        await ApiService.adminRequest(
          'create',
          activeTable,
          values: values,
          password: password,
        );
      }
      if (mounted) Navigator.pop(context);
      _loadList();
    } catch (e) {
      setState(() {
        loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Map<String, dynamic> _collectValues() {
    switch (activeTable) {
      case 'courses':
        return {
          'title': _titleController.text,
          'description': _descriptionController.text,
          'price': _priceController.text,
          'image': _imageController.text,
          'subject': _subjectController.text,
          'level': _levelController.text,
          'duration': _durationController.text,
        };
      case 'events':
        return {
          'title': _titleController.text,
          'description': _descriptionController.text,
          'date': _eventDateController.text,
          'venue': _venueController.text,
          'category': _categoryController.text,
          'event_type': _eventTypeController.text,
          'duration': _durationController.text,
          'image': _imageController.text,
        };
      case 'reviews':
        return {
          'name': _nameController.text,
          'course_name': _courseNameController.text,
          'message': _messageController.text,
        };
      case 'contacts':
        return {
          'name': _nameController.text,
          'email': _emailController.text,
          'message': _messageController.text,
        };
      case 'notifications':
        return {
          'title': _notifTitleController.text,
          'message': _notifMessageController.text,
          'course_id': _notifCourseIdController.text.isNotEmpty
              ? int.tryParse(_notifCourseIdController.text)
              : null,
          'is_read': 0,
        };
      default:
        return {'title': _titleController.text};
    }
  }

  Future<void> _deleteRow(dynamic id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete'),
        content: const Text('Delete this record?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() {
      loading = true;
    });
    try {
      await ApiService.adminRequest(
        'delete',
        activeTable,
        id: id,
        password: password,
      );
      _loadList();
    } catch (e) {
      setState(() {
        loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _editRow(Map<String, dynamic> row) {
    _showForm(row: row);
  }
}

extension _Capitalize on String {
  String capitalize() =>
      isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}
