import 'course.dart';

class StudentProfile {
  final int id;
  final String studentId;
  final String name;
  final String email;
  final String phone;
  final String viberPhone;
  final String city;
  final String township;
  final String birthday;
  final String gender;
  final String education;
  final String image;
  final String status;

  String get statusLabel {
    final normalized = status.trim().toLowerCase();
    if (normalized == '1' || normalized == 'true' || normalized == 'active') return 'Active';
    if (normalized == '0' || normalized == 'false' || normalized == 'inactive') return 'Inactive';
    if (normalized.isEmpty) return 'Not provided';
    return normalized.replaceAll('_', ' ').split(' ').map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}').join(' ');
  }

  const StudentProfile({
    required this.id,
    required this.studentId,
    required this.name,
    required this.email,
    required this.phone,
    this.viberPhone = '',
    this.city = '',
    this.township = '',
    this.birthday = '',
    this.gender = '',
    this.education = '',
    this.image = '',
    required this.status,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) => int.tryParse('${value ?? ''}') ?? 0;
    String parseText(dynamic value) => value?.toString() ?? '';
    return StudentProfile(
      id: parseInt(json['id']),
      studentId: parseText(json['student_id']),
      name: parseText(json['name']),
      email: parseText(json['email']),
      phone: parseText(json['phone']),
      viberPhone: parseText(json['viber_phone']),
      city: parseText(json['city']),
      township: parseText(json['township']),
      birthday: parseText(json['birthday']),
      gender: parseText(json['gender']),
      education: parseText(json['education']),
      image: parseText(json['image']),
      status: parseText(json['status']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'student_id': studentId,
    'name': name,
    'email': email,
    'phone': phone,
    'viber_phone': viberPhone,
    'city': city,
    'township': township,
    'birthday': birthday,
    'gender': gender,
    'education': education,
    'image': image,
    'status': status,
  };
}

class Enrollment {
  final int id;
  final String status;
  final String studentNote;
  final String adminNote;
  final String requestedAt;
  final String reviewedAt;
  final String updatedAt;
  final String paymentStatus;
  final int paymentDue;
  final int paymentPaid;
  final String paymentMethod;
  final String paymentReference;
  final String paymentDate;
  final String paymentDueDate;
  final String paymentPaidDate;
  final String paymentNote;
  final Course course;

  String get paymentStatusLabel {
    final normalized = paymentStatus.trim().toLowerCase();
    if (normalized == '1' || normalized == 'true' || normalized == 'active') return 'Active';
    if (normalized == '0' || normalized == 'false' || normalized == 'inactive') return 'Inactive';
    if (normalized.isEmpty) return 'Unpaid';
    return normalized.replaceAll('_', ' ').split(' ').map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}').join(' ');
  }
  final int? sessionId;
  final String sessionName;
  final String sessionStartTime;
  final String sessionEndTime;

  const Enrollment({
    required this.id,
    required this.status,
    required this.studentNote,
    required this.adminNote,
    required this.requestedAt,
    required this.reviewedAt,
    required this.updatedAt,
    this.paymentStatus = 'unpaid',
    this.paymentDue = 0,
    this.paymentPaid = 0,
    this.paymentMethod = '',
    this.paymentReference = '',
    this.paymentDate = '',
    this.paymentDueDate = '',
    this.paymentPaidDate = '',
    this.paymentNote = '',
    required this.course,
    this.sessionId,
    this.sessionName = '',
    this.sessionStartTime = '',
    this.sessionEndTime = '',
  });

  factory Enrollment.fromJson(Map<String, dynamic> json) {
    int? parseNullableInt(dynamic value) => int.tryParse('${value ?? ''}');
    String parseText(dynamic value) => value?.toString() ?? '';
    return Enrollment(
      id: parseNullableInt(json['id']) ?? 0,
      status: parseText(json['status']).toLowerCase(),
      studentNote: parseText(json['student_note']),
      adminNote: parseText(json['admin_note']),
      requestedAt: parseText(json['requested_at']),
      reviewedAt: parseText(json['reviewed_at']),
      updatedAt: parseText(json['updated_at']),
      paymentStatus: parseText(json['payment_status']).isEmpty ? 'unpaid' : parseText(json['payment_status']).toLowerCase(),
      paymentDue: int.tryParse('${json['payment_due'] ?? 0}') ?? 0,
      paymentPaid: int.tryParse('${json['payment_paid'] ?? 0}') ?? 0,
      paymentMethod: parseText(json['payment_method']),
      paymentReference: parseText(json['payment_reference']),
      paymentDate: parseText(json['payment_date']),
      paymentDueDate: parseText(json['payment_due_date']),
      paymentPaidDate: parseText(json['payment_paid_date']),
      paymentNote: parseText(json['payment_note']),
      course: Course.fromJson({
        'id': json['course_id'],
        'title': json['course_title'],
        'image': json['course_image'],
        'subject': json['course_subject'],
        'level': json['course_level'],
        'duration': json['course_duration'],
        'price': json['course_price'],
      }),
      sessionId: parseNullableInt(json['session_id']),
      sessionName: parseText(json['session_name']),
      sessionStartTime: parseText(json['session_start_time']),
      sessionEndTime: parseText(json['session_end_time']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'status': status,
    'student_note': studentNote,
    'admin_note': adminNote,
    'requested_at': requestedAt,
    'reviewed_at': reviewedAt,
    'updated_at': updatedAt,
    'payment_status': paymentStatus,
    'payment_due': paymentDue,
    'payment_paid': paymentPaid,
    'payment_method': paymentMethod,
    'payment_reference': paymentReference,
    'payment_date': paymentDate,
    'payment_due_date': paymentDueDate,
    'payment_paid_date': paymentPaidDate,
    'payment_note': paymentNote,
    'course_id': course.id,
    'course_title': course.title,
    'course_image': course.image,
    'course_subject': course.subject,
    'course_level': course.level,
    'course_duration': course.duration,
    'course_price': course.price,
    'session_id': sessionId,
    'session_name': sessionName,
    'session_start_time': sessionStartTime,
    'session_end_time': sessionEndTime,
  };
}

class CourseResource {
  final int id;
  final int courseId;
  final String courseTitle;
  final String courseSubject;
  final String title;
  final String resourceType;
  final String url;
  final String note;
  final String lesson;
  final int week;
  final int fileSize;
  final int downloadCount;
  const CourseResource({required this.id, required this.courseId, required this.courseTitle, this.courseSubject = '', required this.title, required this.resourceType, required this.url, required this.note, this.lesson = '', this.week = 0, this.fileSize = 0, this.downloadCount = 0});
  factory CourseResource.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) => int.tryParse('${value ?? ''}') ?? 0;
    String parseText(dynamic value) => value?.toString() ?? '';
    return CourseResource(id: parseInt(json['id']), courseId: parseInt(json['course_id']), courseTitle: parseText(json['course_title']), courseSubject: parseText(json['course_subject']), title: parseText(json['title']), resourceType: parseText(json['resource_type']), url: parseText(json['url']), note: parseText(json['note']), lesson: parseText(json['lesson']), week: parseInt(json['week']), fileSize: parseInt(json['file_size']), downloadCount: parseInt(json['download_count']));
  }
  Map<String, dynamic> toJson() => {'id': id, 'course_id': courseId, 'course_title': courseTitle, 'course_subject': courseSubject, 'title': title, 'resource_type': resourceType, 'url': url, 'note': note, 'lesson': lesson, 'week': week, 'file_size': fileSize, 'download_count': downloadCount};
}

class StudentNotification {
  final int id;
  final String title;
  final String message;
  final String priority;
  final bool isRead;
  final int? courseId;
  final String actionUrl;
  final String createdAt;
  const StudentNotification({required this.id, required this.title, required this.message, this.priority = 'normal', this.isRead = false, this.courseId, this.actionUrl = '', this.createdAt = ''});
  factory StudentNotification.fromJson(Map<String, dynamic> json) => StudentNotification(id: int.tryParse('${json['id'] ?? 0}') ?? 0, title: json['title']?.toString() ?? '', message: json['message']?.toString() ?? '', priority: json['priority']?.toString() ?? 'normal', isRead: '${json['is_read'] ?? 0}' == '1' || '${json['is_read'] ?? 0}'.toLowerCase() == 'true', courseId: json['course_id'] == null ? null : int.tryParse('${json['course_id']}'), actionUrl: json['action_url']?.toString() ?? '', createdAt: json['created_at']?.toString() ?? '');
  Map<String, dynamic> toJson() => {'id': id, 'title': title, 'message': message, 'priority': priority, 'is_read': isRead ? 1 : 0, 'course_id': courseId, 'action_url': actionUrl, 'created_at': createdAt};
}

class AttendanceSummary {
  final int courseId;
  final int total;
  final int attended;
  const AttendanceSummary({required this.courseId, this.total = 0, this.attended = 0});
  double get percentage => total == 0 ? 0 : attended * 100 / total;
  factory AttendanceSummary.fromJson(Map<String, dynamic> json) => AttendanceSummary(courseId: int.tryParse('${json['course_id'] ?? 0}') ?? 0, total: int.tryParse('${json['total'] ?? 0}') ?? 0, attended: int.tryParse('${json['attended'] ?? 0}') ?? 0);
}

class StudentAttendanceRecord {
  final int id;
  final int courseId;
  final String courseTitle;
  final String attendanceDate;
  final String status;
  final String note;
  const StudentAttendanceRecord({required this.id, required this.courseId, required this.courseTitle, required this.attendanceDate, required this.status, this.note = ''});
  factory StudentAttendanceRecord.fromJson(Map<String, dynamic> json) => StudentAttendanceRecord(id: int.tryParse('${json['id'] ?? 0}') ?? 0, courseId: int.tryParse('${json['course_id'] ?? 0}') ?? 0, courseTitle: json['course_title']?.toString() ?? '', attendanceDate: json['attendance_date']?.toString() ?? '', status: json['status']?.toString().toLowerCase() ?? '', note: json['note']?.toString() ?? '');
}

class StudentAssignment {
  final int id;
  final int courseId;
  final String courseTitle;
  final String title;
  final String description;
  final String dueDate;
  final int maxScore;
  final String submissionUrl;
  final String submissionNote;
  final String submissionStatus;
  final int? score;
  final String feedback;
  const StudentAssignment({required this.id, required this.courseId, required this.courseTitle, required this.title, this.description = '', this.dueDate = '', this.maxScore = 100, this.submissionUrl = '', this.submissionNote = '', this.submissionStatus = '', this.score, this.feedback = ''});
  factory StudentAssignment.fromJson(Map<String, dynamic> json) => StudentAssignment(id: int.tryParse('${json['id'] ?? 0}') ?? 0, courseId: int.tryParse('${json['course_id'] ?? 0}') ?? 0, courseTitle: json['course_title']?.toString() ?? '', title: json['title']?.toString() ?? '', description: json['description']?.toString() ?? '', dueDate: json['due_date']?.toString() ?? '', maxScore: int.tryParse('${json['max_score'] ?? 100}') ?? 100, submissionUrl: json['submission_url']?.toString() ?? '', submissionNote: json['submission_note']?.toString() ?? '', submissionStatus: json['submission_status']?.toString() ?? '', score: json['score'] == null ? null : int.tryParse('${json['score']}'), feedback: json['feedback']?.toString() ?? '');
}

class StudentLearningBundle {
  final StudentProfile student;
  final List<Enrollment> enrollments;
  final List<CourseResource> resources;
  final List<StudentNotification> notifications;
  final List<AttendanceSummary> attendanceSummary;
  final List<StudentAssignment> assignments;

  const StudentLearningBundle({required this.student, required this.enrollments, this.resources = const [], this.notifications = const [], this.attendanceSummary = const [], this.assignments = const []});

  factory StudentLearningBundle.fromJson(Map<String, dynamic> json) {
    final rows = json['enrollments'] as List? ?? const [];
    final resourceRows = json['resources'] as List? ?? const [];
    final notificationRows = json['notifications'] as List? ?? const [];
    final attendanceRows = json['attendance_summary'] as List? ?? const [];
    final assignmentRows = json['assignments'] as List? ?? const [];
    return StudentLearningBundle(
      student: StudentProfile.fromJson(
        Map<String, dynamic>.from(json['student'] as Map? ?? const {}),
      ),
      enrollments: rows
          .map((row) => Enrollment.fromJson(Map<String, dynamic>.from(row as Map)))
          .toList(),
      resources: resourceRows
          .map((row) => CourseResource.fromJson(Map<String, dynamic>.from(row as Map)))
          .toList(),
      notifications: notificationRows.map((row) => StudentNotification.fromJson(Map<String, dynamic>.from(row as Map))).toList(),
      attendanceSummary: attendanceRows.map((row) => AttendanceSummary.fromJson(Map<String, dynamic>.from(row as Map))).toList(),
      assignments: assignmentRows.map((row) => StudentAssignment.fromJson(Map<String, dynamic>.from(row as Map))).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'student': student.toJson(),
    'enrollments': enrollments.map((row) => row.toJson()).toList(),
    'resources': resources.map((row) => row.toJson()).toList(),
    'notifications': notifications.map((row) => row.toJson()).toList(),
    'attendance_summary': attendanceSummary.map((row) => {'course_id': row.courseId, 'total': row.total, 'attended': row.attended}).toList(),
    'assignments': assignments.map((row) => {'id': row.id, 'course_id': row.courseId, 'course_title': row.courseTitle, 'title': row.title, 'description': row.description, 'due_date': row.dueDate, 'max_score': row.maxScore, 'submission_url': row.submissionUrl, 'submission_note': row.submissionNote, 'submission_status': row.submissionStatus, 'score': row.score, 'feedback': row.feedback}).toList(),
  };
}
