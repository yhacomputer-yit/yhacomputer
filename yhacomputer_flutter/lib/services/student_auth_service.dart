import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/student.dart';
import 'api_service.dart';

class StudentSession {
  final String token;
  final StudentLearningBundle learning;

  const StudentSession({required this.token, required this.learning});

  factory StudentSession.fromJson(Map<String, dynamic> json) {
    return StudentSession(
      token: json['token']?.toString() ?? '',
      learning: StudentLearningBundle.fromJson(
        Map<String, dynamic>.from(json['learning'] as Map? ?? const {}),
      ),
    );
  }

  Map<String, dynamic> toJson() => {
    'token': token,
    'learning': learning.toJson(),
  };
}

/// Owns the signed student session for the mobile app. The token stays in the
/// platform keychain/keystore; the lightweight learner bundle is persisted only
/// to avoid a blank account screen while the app refreshes from Turso.
class StudentAuthService {
  StudentAuthService._();

  static final StudentAuthService instance = StudentAuthService._();
  static const _sessionKey = 'yha_student_session';
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  final ValueNotifier<StudentSession?> session = ValueNotifier<StudentSession?>(
    null,
  );
  bool _restored = false;

  bool get isSignedIn => session.value != null;
  StudentSession? get currentSession => session.value;

  Future<void> restoreSession() async {
    if (_restored) return;
    _restored = true;
    try {
      final stored = await _storage.read(key: _sessionKey);
      if (stored == null || stored.isEmpty) return;
      final decoded = json.decode(stored);
      if (decoded is! Map) return;
      final restored = StudentSession.fromJson(Map<String, dynamic>.from(decoded));
      if (restored.token.isEmpty || restored.learning.student.id < 1) return;
      session.value = restored;
    } catch (_) {
      await _storage.delete(key: _sessionKey);
    }
  }

  Future<void> _persist(StudentSession? next) async {
    session.value = next;
    if (next == null) {
      await _storage.delete(key: _sessionKey);
      return;
    }
    await _storage.write(key: _sessionKey, value: json.encode(next.toJson()));
  }

  Future<void> signOut() => _persist(null);

  Future<void> signIn({
    required String studentId,
    required String password,
  }) async {
    final payload = await ApiService.studentRequest(
      'login',
      values: {'student_id': studentId.trim().toUpperCase(), 'password': password},
    );
    final token = payload['token']?.toString() ?? '';
    if (token.isEmpty) throw Exception('The server did not return a sign-in session.');
    final learning = StudentLearningBundle.fromJson(payload);
    await _persist(StudentSession(token: token, learning: learning));
  }

  Future<String> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    int? courseId,
    int? sessionId,
    String? studentNote,
    String? viberPhone,
    String? city,
    String? township,
    String? birthday,
    String? gender,
    String? education,
  }) async {
    final values = <String, dynamic>{
      'name': name.trim(),
      'email': email.trim(),
      'phone': phone.trim(),
      'password': password,
    };
    if (courseId != null) values['course_id'] = courseId;
    if (sessionId != null) values['session_id'] = sessionId;
    if (studentNote != null && studentNote.trim().isNotEmpty) values['student_note'] = studentNote.trim();
    if (viberPhone != null && viberPhone.trim().isNotEmpty) values['viber_phone'] = viberPhone.trim();
    if (city != null && city.trim().isNotEmpty) values['city'] = city.trim();
    if (township != null && township.trim().isNotEmpty) values['township'] = township.trim();
    if (birthday != null && birthday.trim().isNotEmpty) values['birthday'] = birthday.trim();
    if (gender != null && gender.trim().isNotEmpty) values['gender'] = gender.trim();
    if (education != null && education.trim().isNotEmpty) values['education'] = education.trim();
    final payload = await ApiService.studentRequest('register', values: values);
    return payload['message']?.toString() ?? 'Registration request sent.';
  }

  Future<StudentLearningBundle> refresh() async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    try {
      final payload = await ApiService.fetchStudentLearning(current.token);
      final learning = StudentLearningBundle.fromJson(payload);
      await _persist(StudentSession(token: current.token, learning: learning));
      return learning;
    } catch (_) {
      // Retain the cached learning bundle during an offline or temporary server
      // failure so My Learning is still informative. Authentication errors are
      // handled by logout only if the caller chooses to prompt for sign-in.
      rethrow;
    }
  }

  Future<StudentLearningBundle> enroll({
    required int courseId,
    int? sessionId,
    String? note,
  }) async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in before requesting enrollment.');
    final values = <String, dynamic>{'course_id': courseId};
    if (sessionId != null) values['session_id'] = sessionId;
    if (note != null && note.trim().isNotEmpty) values['student_note'] = note.trim();
    final payload = await ApiService.studentRequest(
      'enroll',
      token: current.token,
      values: values,
    );
    final learning = StudentLearningBundle.fromJson(payload);
    await _persist(StudentSession(token: current.token, learning: learning));
    return learning;
  }

  Future<StudentLearningBundle> cancelEnrollment(int enrollmentId) async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    final payload = await ApiService.studentRequest(
      'cancel_enrollment',
      token: current.token,
      values: {'enrollment_id': enrollmentId},
    );
    final learning = StudentLearningBundle.fromJson(payload);
    await _persist(StudentSession(token: current.token, learning: learning));
    return learning;
  }

  Future<StudentLearningBundle> updateProfile({
    required String name,
    required String phone,
    String? viberPhone,
    String? city,
    String? township,
    String? birthday,
    String? gender,
    String? education,
  }) async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    final payload = await ApiService.studentRequest(
      'update_profile',
      token: current.token,
      values: {
        'name': name.trim(),
        'phone': phone.trim(),
        'viber_phone': viberPhone?.trim() ?? '',
        'city': city?.trim() ?? '',
        'township': township?.trim() ?? '',
        'birthday': birthday?.trim() ?? '',
        'gender': gender?.trim() ?? '',
        'education': education?.trim() ?? '',
      },
    );
    final learning = StudentLearningBundle.fromJson(payload);
    await _persist(StudentSession(token: current.token, learning: learning));
    return learning;
  }

  Future<void> markNotificationRead(int notificationId) async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    final payload = await ApiService.studentRequest('mark_notification_read', token: current.token, values: {'notification_id': notificationId});
    final learning = StudentLearningBundle.fromJson(payload);
    await _persist(StudentSession(token: current.token, learning: learning));
  }

  Future<List<StudentAttendanceRecord>> fetchAttendanceHistory() async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    final payload = await ApiService.studentRequest('attendance', token: current.token);
    final rows = payload['attendance'] as List? ?? const [];
    return rows.map((row) => StudentAttendanceRecord.fromJson(Map<String, dynamic>.from(row as Map))).toList();
  }

  Future<String> downloadResource(int resourceId) async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    final payload = await ApiService.studentRequest('download_resource', token: current.token, values: {'resource_id': resourceId});
    return payload['url']?.toString() ?? '';
  }

  Future<StudentLearningBundle> submitAssignment({required int assignmentId, String? submissionUrl, String? submissionNote}) async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    final payload = await ApiService.studentRequest('submit_assignment', token: current.token, values: {'assignment_id': assignmentId, 'submission_url': submissionUrl ?? '', 'submission_note': submissionNote ?? ''});
    final learning = StudentLearningBundle.fromJson(payload);
    await _persist(StudentSession(token: current.token, learning: learning));
    return learning;
  }

  Future<String> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final current = session.value;
    if (current == null) throw Exception('Please sign in to continue.');
    final payload = await ApiService.studentRequest(
      'change_password',
      token: current.token,
      values: {
        'current_password': currentPassword,
        'new_password': newPassword,
      },
    );
    return payload['message']?.toString() ?? 'Your password was updated.';
  }

  Future<String> requestPasswordHelp({
    required String studentId,
    required String email,
  }) async {
    final payload = await ApiService.studentRequest(
      'request_password_help',
      values: {'student_id': studentId.trim().toUpperCase(), 'email': email.trim()},
    );
    return payload['message']?.toString() ?? 'Password-help request sent.';
  }
}
