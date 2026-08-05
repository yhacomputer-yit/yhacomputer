class NotificationModel {
  final int? id;
  final String title;
  final String message;
  final int? courseId;
  final bool isRead;
  final String? createdAt;

  NotificationModel({
    this.id,
    required this.title,
    required this.message,
    this.courseId,
    this.isRead = false,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] is int ? json['id'] : null,
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      courseId: json['course_id'] is int ? json['course_id'] : null,
      isRead: json['is_read'] == 1 || json['is_read'] == true,
      createdAt: json['created_at'],
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
    };
  }
}