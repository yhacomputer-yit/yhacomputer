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
  final Course course;
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
  final String title;
  final String resourceType;
  final String url;
  final String note;
  const CourseResource({required this.id, required this.courseId, required this.courseTitle, required this.title, required this.resourceType, required this.url, required this.note});
  factory CourseResource.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) => int.tryParse('${value ?? ''}') ?? 0;
    String parseText(dynamic value) => value?.toString() ?? '';
    return CourseResource(id: parseInt(json['id']), courseId: parseInt(json['course_id']), courseTitle: parseText(json['course_title']), title: parseText(json['title']), resourceType: parseText(json['resource_type']), url: parseText(json['url']), note: parseText(json['note']));
  }
  Map<String, dynamic> toJson() => {'id': id, 'course_id': courseId, 'course_title': courseTitle, 'title': title, 'resource_type': resourceType, 'url': url, 'note': note};
}

class StudentLearningBundle {
  final StudentProfile student;
  final List<Enrollment> enrollments;
  final List<CourseResource> resources;

  const StudentLearningBundle({required this.student, required this.enrollments, this.resources = const []});

  factory StudentLearningBundle.fromJson(Map<String, dynamic> json) {
    final rows = json['enrollments'] as List? ?? const [];
    final resourceRows = json['resources'] as List? ?? const [];
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
    );
  }

  Map<String, dynamic> toJson() => {
    'student': student.toJson(),
    'enrollments': enrollments.map((row) => row.toJson()).toList(),
    'resources': resources.map((row) => row.toJson()).toList(),
  };
}
