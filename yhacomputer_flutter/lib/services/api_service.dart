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

  static Future<Map<String, dynamic>> fetchData() async {
    final url = Uri.parse('$baseUrl/api/data');
    try {
      final response = await http.get(url).timeout(_timeout);
      if (response.statusCode == 200) {
        return json.decode(response.body);
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

  static Future<List<Course>> fetchCourses() async {
    final data = await fetchData();
    final courses = data['courses'] as List? ?? [];
    return courses.map((json) => Course.fromJson(json)).toList();
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

  static Future<List<NotificationModel>> fetchNotifications() async {
    final data = await fetchData();
    final notifications = (data['notifications'] as List? ?? [])
        .map((json) => NotificationModel.fromJson(json))
        .toList();
    return notifications;
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
        'is_read': 0,
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
