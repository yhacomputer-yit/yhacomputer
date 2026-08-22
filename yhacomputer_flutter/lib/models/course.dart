class Course {
  final int? id;
  final String title;
  final String? description;
  final String? price;
  final String? image;
  final String? subject;
  final String? level;
  final String? duration;
  final bool isPublished;
  final bool featured;
  final int sortOrder;
  final bool enrollmentOpen;

  Course({
    this.id,
    required this.title,
    this.description,
    this.price,
    this.image,
    this.subject,
    this.level,
    this.duration,
    this.isPublished = true,
    this.featured = false,
    this.sortOrder = 0,
    this.enrollmentOpen = true,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    int? parseInt(dynamic value) => int.tryParse(value?.toString() ?? '');
    String? asString(dynamic value) => value?.toString();
    bool asBool(dynamic value, bool fallback) {
      if (value == null || value == '') return fallback;
      return value == true || value == 1 || value == '1' || value == 'true';
    }

    return Course(
      id: parseInt(json['id']),
      title: json['title']?.toString() ?? '',
      description: asString(json['description']),
      price: asString(json['price']),
      image: asString(json['image']),
      subject: asString(json['subject']),
      level: asString(json['level']),
      duration: asString(json['duration']),
      isPublished: asBool(json['is_published'], true),
      featured: asBool(json['featured'], false),
      sortOrder: parseInt(json['sort_order']) ?? 0,
      enrollmentOpen: asBool(json['enrollment_open'], true),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'price': price,
      'image': image,
      'subject': subject,
      'level': level,
      'duration': duration,
      'is_published': isPublished,
      'featured': featured,
      'sort_order': sortOrder,
      'enrollment_open': enrollmentOpen,
    };
  }

  List<String> get badgeList {
    return [
      subject,
      level,
      duration,
    ].where((v) => v != null && v.isNotEmpty).cast<String>().toList();
  }
}
