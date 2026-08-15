class NotificationModel {
  final int? id;
  final String title;
  final String message;
  final int? courseId;
  final bool isRead;
  final String? createdAt;
  final String priority;
  final String? actionUrl;
  final String? publishAt;
  final String? expiresAt;

  NotificationModel({
    this.id,
    required this.title,
    required this.message,
    this.courseId,
    this.isRead = false,
    this.createdAt,
    this.priority = 'normal',
    this.actionUrl,
    this.publishAt,
    this.expiresAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    int? parseInt(dynamic value) => int.tryParse(value?.toString() ?? '');

    return NotificationModel(
      id: parseInt(json['id']),
      title: json['title']?.toString().trim() ?? '',
      message: json['message']?.toString().trim() ?? '',
      courseId: parseInt(json['course_id']),
      isRead:
          json['is_read'] == 1 ||
          json['is_read'] == true ||
          json['is_read'] == '1',
      createdAt: json['created_at']?.toString(),
      priority: _parsePriority(json['priority']),
      actionUrl: json['action_url']?.toString().trim(),
      publishAt: json['publish_at']?.toString(),
      expiresAt: json['expires_at']?.toString(),
    );
  }

  static String _parsePriority(dynamic value) {
    final priority = value?.toString().trim().toLowerCase();
    return {'normal', 'high', 'urgent'}.contains(priority)
        ? priority!
        : 'normal';
  }

  String get syncKey => id?.toString() ?? '${createdAt ?? ''}|$title|$message';

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      title: title,
      message: message,
      courseId: courseId,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
      priority: priority,
      actionUrl: actionUrl,
      publishAt: publishAt,
      expiresAt: expiresAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'course_id': courseId,
      'is_read': isRead,
      'created_at': createdAt,
      'priority': priority,
      'action_url': actionUrl,
      'publish_at': publishAt,
      'expires_at': expiresAt,
    };
  }
}
