import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/course.dart';
import '../models/subject.dart';
import '../models/event.dart';
import '../models/review.dart';
import '../models/notification_model.dart';

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://www.yha-edu.tech',
  );
  static const Duration _timeout = Duration(seconds: 15);

  static Future<Map<String, dynamic>> _fetchJson(
    Uri url, {
    Map<String, String>? headers,
  }) async {
    try {
      final response = await http.get(url, headers: headers).timeout(_timeout);
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded is Map<String, dynamic>) return decoded;
        throw _ApiException('Received invalid data from the server.');
      }
      throw _ApiException(
        'Server returned status ${response.statusCode}. Please try again later.',
      );
    } on http.ClientException {
      throw _ApiException(
        'Unable to reach the server. Please check your internet connection and try again.',
      );
    } on FormatException {
      throw _ApiException('Received invalid data from the server.');
    } on _ApiException {
      rethrow;
    } catch (e) {
      throw _ApiException(
        'Something went wrong while loading data. Please try again later.',
      );
    }
  }

  static Future<Map<String, dynamic>> _postJson(
    Uri url,
    Map<String, dynamic> body, {
    String? token,
  }) async {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    try {
      final response = await http
          .post(url, headers: headers, body: json.encode(body))
          .timeout(_timeout);
      final decoded = json.decode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (decoded is Map<String, dynamic>) return decoded;
        throw _ApiException('Received invalid data from the server.');
      }
      throw _ApiException(
        decoded is Map
            ? (decoded['error']?.toString() ?? 'Request failed.')
            : 'Request failed.',
      );
    } on _ApiException {
      rethrow;
    } on http.ClientException {
      throw _ApiException(
        'Unable to reach the server. Please check your internet connection and try again.',
      );
    } on FormatException {
      throw _ApiException('Received invalid data from the server.');
    } catch (_) {
      throw _ApiException('Something went wrong. Please try again later.');
    }
  }

  static Future<Map<String, dynamic>> fetchData() {
    return _fetchJson(Uri.parse('$baseUrl/api/data'));
  }

  static Future<Map<String, dynamic>> fetchCollection(
    String collection, {
    Map<String, String>? queryParameters,
  }) {
    return _fetchJson(
      Uri.parse('$baseUrl/api/data').replace(
        queryParameters: {'collection': collection, ...?queryParameters},
      ),
    );
  }

  static List<dynamic> _collectionRows(
    Map<String, dynamic> payload,
    String legacyKey,
  ) {
    final rows = payload['data'] ?? payload[legacyKey] ?? const [];
    return rows is List ? rows : const [];
  }

  static Future<List<Course>> fetchCourses({
    String? search,
    String? subject,
    String? level,
    int limit = 100,
  }) async {
    final data = await fetchCollection(
      'courses',
      queryParameters: {
        'limit': '$limit',
        if (search != null && search.trim().isNotEmpty) 'q': search.trim(),
        if (subject != null && subject.trim().isNotEmpty)
          'subject': subject.trim(),
        if (level != null && level.trim().isNotEmpty) 'level': level.trim(),
      },
    );
    return _collectionRows(
      data,
      'courses',
    ).map((json) => Course.fromJson(json as Map<String, dynamic>)).toList();
  }

  static Future<Map<String, dynamic>?> fetchCourseDetail(int courseId) async {
    final payload = await fetchCollection(
      'course',
      queryParameters: {'id': '$courseId'},
    );
    final courseData = payload['data'];
    if (courseData is Map<String, dynamic>) return payload;

    // A short-lived fallback keeps older deployed API versions compatible while
    // a client update is rolling out.
    final legacyCourses = payload['courses'] as List? ?? const [];
    final legacyCourse = legacyCourses.cast<Map>().where(
      (course) => int.tryParse('${course['id']}') == courseId,
    );
    if (legacyCourse.isEmpty) return null;
    final id = '$courseId';
    final legacySubjects = (payload['subjects'] as List? ?? const [])
        .cast<Map>()
        .where((subject) => '${subject['course_id']}' == id)
        .toList();
    return {
      'data': Map<String, dynamic>.from(legacyCourse.first),
      'related': {
        'subjects': legacySubjects,
        'sessions': const [],
        'teachers': const [],
      },
      'meta': {'found': true},
    };
  }

  static Future<List<Event>> fetchEvents() async {
    final data = await fetchData();
    final events = data['events'] as List? ?? [];
    return events.map((json) => Event.fromJson(json)).toList();
  }

  static Future<List<Review>> fetchReviews() async {
    final data = await fetchData();
    final reviews = data['reviews'] as List? ?? [];
    return reviews.map((json) => Review.fromJson(json)).toList();
  }

  static Future<Map<String, dynamic>> fetchAll() async {
    final data = await fetchData();
    final courses = (data['courses'] as List? ?? [])
        .map((json) => Course.fromJson(json))
        .toList();
    final subjects = (data['subjects'] as List? ?? [])
        .map((json) => Subject.fromJson(json))
        .toList();
    final events = (data['events'] as List? ?? [])
        .map((json) => Event.fromJson(json))
        .toList();
    final reviews = (data['reviews'] as List? ?? [])
        .map((json) => Review.fromJson(json))
        .toList();
    final notifications = (data['notifications'] as List? ?? [])
        .map((json) => NotificationModel.fromJson(json))
        .toList();
    return {
      'courses': courses,
      'subjects': subjects,
      'events': events,
      'reviews': reviews,
      'notifications': notifications,
    };
  }

  static Future<List<NotificationModel>> fetchNotifications({
    int? sinceId,
    int limit = 100,
  }) async {
    final data = await fetchCollection(
      'notifications',
      queryParameters: {
        'limit': '$limit',
        if (sinceId != null && sinceId > 0) 'since_id': '$sinceId',
      },
    );
    return _collectionRows(data, 'notifications')
        .map((json) => NotificationModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  static Future<Map<String, dynamic>> studentRequest(
    String action, {
    Map<String, dynamic>? values,
    String? token,
  }) {
    return _postJson(
      Uri.parse('$baseUrl/api/student'),
      <String, dynamic>{'action': action, ...?values},
      token: token,
    );
  }

  static Future<Map<String, dynamic>> fetchStudentLearning(String token) {
    return _fetchJson(
      Uri.parse('$baseUrl/api/student').replace(queryParameters: {'action': 'me'}),
      headers: {'Authorization': 'Bearer $token'},
    );
  }

  static Future<Map<String, dynamic>> adminRequest(
    String action,
    String table, {
    Map<String, dynamic>? values,
    int? id,
    String? password,
  }) async {
    final url = Uri.parse('$baseUrl/api/admin');
    final body = <String, dynamic>{'action': action, 'table': table};
    if (id != null) body['id'] = id;
    if (values != null) body['values'] = values;

    final headers = <String, String>{'Content-Type': 'application/json'};
    if (password != null && password.isNotEmpty) {
      headers['x-admin-password'] = password;
    }

    try {
      final response = await http
          .post(url, headers: headers, body: json.encode(body))
          .timeout(_timeout);
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      final errorBody = json.decode(response.body);
      throw _ApiException(errorBody['error'] ?? 'Request failed');
    } on _ApiException {
      rethrow;
    } on http.ClientException {
      throw _ApiException(
        'Unable to reach the server. Please check your internet connection.',
      );
    } catch (e) {
      throw _ApiException('Something went wrong. Please try again later.');
    }
  }

  static Future<Map<String, dynamic>> submitContact({
    required String name,
    required String email,
    required String message,
  }) async {
    final url = Uri.parse('$baseUrl/api/contact');
    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: json.encode({
              'name': name,
              'email': email,
              'message': message,
            }),
          )
          .timeout(_timeout);
      if (response.statusCode == 201) {
        return {'ok': true};
      }
      final errorBody = json.decode(response.body);
      throw _ApiException(errorBody['error'] ?? 'Failed to send message');
    } on _ApiException {
      rethrow;
    } on http.ClientException {
      throw _ApiException(
        'Unable to reach the server. Please check your internet connection and try again.',
      );
    } catch (e) {
      throw _ApiException(
        'Something went wrong while sending your message. Please try again later.',
      );
    }
  }

  static Future<Map<String, dynamic>> createNotification({
    required String title,
    required String message,
    int? courseId,
    String priority = 'normal',
    String? actionUrl,
    DateTime? publishAt,
    DateTime? expiresAt,
    String? password,
  }) async {
    final url = Uri.parse('$baseUrl/api/admin');
    final body = <String, dynamic>{
      'action': 'create',
      'table': 'notifications',
      'values': {
        'title': title,
        'message': message,
        'course_id': courseId,
        'priority': priority,
        'action_url': actionUrl,
        'publish_at': publishAt?.toUtc().toIso8601String(),
        'expires_at': expiresAt?.toUtc().toIso8601String(),
      },
    };

    final headers = <String, String>{'Content-Type': 'application/json'};
    if (password != null && password.isNotEmpty) {
      headers['x-admin-password'] = password;
    }

    try {
      final response = await http
          .post(url, headers: headers, body: json.encode(body))
          .timeout(_timeout);
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      final errorBody = json.decode(response.body);
      throw _ApiException(errorBody['error'] ?? 'Request failed');
    } on _ApiException {
      rethrow;
    } on http.ClientException {
      throw _ApiException(
        'Unable to reach the server. Please check your internet connection.',
      );
    } catch (e) {
      throw _ApiException('Something went wrong. Please try again later.');
    }
  }
}

class _ApiException implements Exception {
  final String message;
  const _ApiException(this.message);

  @override
  String toString() => message;
}
