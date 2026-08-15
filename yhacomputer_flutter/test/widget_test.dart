import 'package:flutter_test/flutter_test.dart';
import 'package:yhacomputer_flutter/models/course.dart';
import 'package:yhacomputer_flutter/models/event.dart';
import 'package:yhacomputer_flutter/models/notification_model.dart';
import 'package:yhacomputer_flutter/models/review.dart';
import 'package:yhacomputer_flutter/utils/course_formatters.dart';

void main() {
  group('Turso API model parsing', () {
    test('converts course IDs returned as strings', () {
      final course = Course.fromJson({
        'id': '12',
        'title': 'Web Design',
        'subject': 'Web Development',
      });

      expect(course.id, 12);
      expect(course.subject, 'Web Development');
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

    test(
      'converts notification and related course IDs returned as strings',
      () {
        final notification = NotificationModel.fromJson({
          'id': '21',
          'course_id': '12',
          'title': 'New class schedule',
          'message': 'The updated schedule is available.',
          'is_read': '1',
        });

        expect(notification.id, 21);
        expect(notification.courseId, 12);
        expect(notification.isRead, isTrue);
        expect(notification.syncKey, '21');
      },
    );
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
