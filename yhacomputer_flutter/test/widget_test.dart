import 'package:flutter_test/flutter_test.dart';
import 'package:yhacomputer_flutter/models/course.dart';
import 'package:yhacomputer_flutter/models/event.dart';
import 'package:yhacomputer_flutter/models/notification_model.dart';
import 'package:yhacomputer_flutter/models/review.dart';
import 'package:yhacomputer_flutter/models/student.dart';
import 'package:yhacomputer_flutter/utils/course_formatters.dart';

void main() {
  group('Turso API model parsing', () {
    test('converts course IDs returned as strings', () {
      final course = Course.fromJson({
        'id': '12',
        'title': 'Web Design',
        'subject': 'Web Development',
        'featured': '1',
        'sort_order': '3',
        'enrollment_open': '0',
      });

      expect(course.id, 12);
      expect(course.subject, 'Web Development');
      expect(course.featured, isTrue);
      expect(course.sortOrder, 3);
      expect(course.enrollmentOpen, isFalse);
    });

    test('converts event IDs returned as strings', () {
      final event = Event.fromJson({
        'id': '8',
        'title': 'Career workshop',
        'event_type': 'Workshop',
      });

      expect(event.id, 8);
      expect(event.eventType, 'Workshop');
    });

    test('converts review IDs returned as strings', () {
      final review = Review.fromJson({
        'id': '5',
        'name': 'Aye Aye',
        'message': 'Helpful practical lessons.',
      });

      expect(review.id, 5);
      expect(review.name, 'Aye Aye');
    });

    test('parses a student learning bundle with course and session details', () {
      final learning = StudentLearningBundle.fromJson({
        'student': {
          'id': '9',
          'student_id': 'YHA0009',
          'name': 'Ko Min',
          'email': 'min@example.com',
          'phone': '0912345678',
          'status': 'active',
        },
        'enrollments': [
          {
            'id': '31',
            'status': 'approved',
            'course_id': '12',
            'course_title': 'Python Programming',
            'course_price': '300000',
            'session_id': '4',
            'session_name': 'Weekend group',
            'session_start_time': '10:00',
            'session_end_time': '12:00',
          },
        ],
      });

      expect(learning.student.id, 9);
      expect(learning.student.studentId, 'YHA0009');
      expect(learning.enrollments.single.id, 31);
      expect(learning.enrollments.single.status, 'approved');
      expect(learning.enrollments.single.course.id, 12);
      expect(learning.enrollments.single.sessionName, 'Weekend group');
    });

    test(
      'converts notification and related course IDs returned as strings',
      () {
        final notification = NotificationModel.fromJson({
          'id': '21',
          'course_id': '12',
          'title': 'New class schedule',
          'message': 'The updated schedule is available.',
          'is_read': '1',
          'priority': 'urgent',
          'action_url': '/courses/12',
          'publish_at': '2026-08-15T00:00:00.000Z',
        });

        expect(notification.id, 21);
        expect(notification.courseId, 12);
        expect(notification.isRead, isTrue);
        expect(notification.syncKey, '21');
        expect(notification.priority, 'urgent');
        expect(notification.actionUrl, '/courses/12');
      },
    );

    test('preserves learner notification actions and parses attendance history', () {
      final learning = StudentLearningBundle.fromJson({
        'student': {'id': 1, 'student_id': 'YHA0001', 'name': 'Learner', 'email': 'learner@example.com', 'phone': '0900000000', 'status': 'active'},
        'enrollments': const [],
        'notifications': [
          {'id': '41', 'title': 'Payment reminder', 'message': 'Your balance is due.', 'course_id': '12', 'action_url': 'https://www.yha-edu.tech/courses/12', 'created_at': '2026-08-22T00:00:00.000Z'},
        ],
      });
      final cached = StudentLearningBundle.fromJson(learning.toJson());
      final attendance = StudentAttendanceRecord.fromJson({'id': '3', 'course_id': '12', 'course_title': 'Python', 'attendance_date': '2026-08-20', 'status': 'present', 'note': 'On time'});

      expect(cached.notifications.single.courseId, 12);
      expect(cached.notifications.single.actionUrl, 'https://www.yha-edu.tech/courses/12');
      expect(attendance.status, 'present');
      expect(attendance.courseTitle, 'Python');
    });
  });

  group('Course fee formatting', () {
    test('formats a positive Turso fee as MMK with digit grouping', () {
      expect(formatCourseFee('400000'), 'MMK 400,000');
      expect(hasConfirmedFee('400000'), isTrue);
    });

    test('treats empty and zero fee placeholders as pending', () {
      expect(formatCourseFee('0'), 'Fee: pending');
      expect(formatCourseFee(null), 'Fee: pending');
      expect(hasConfirmedFee('0'), isFalse);
    });
  });
}
