class Course {
  final int? id;
  final String title;
  final String? description;
  final String? price;
  final String? image;
  final String? subject;
  final String? level;
  final String? duration;

  Course({
    this.id,
    required this.title,
    this.description,
    this.price,
    this.image,
    this.subject,
    this.level,
    this.duration,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    int? parseInt(dynamic value) => int.tryParse(value?.toString() ?? '');
    String? asString(dynamic value) => value?.toString();

    return Course(
      id: parseInt(json['id']),
      title: json['title']?.toString() ?? '',
      description: asString(json['description']),
      price: asString(json['price']),
      image: asString(json['image']),
      subject: asString(json['subject']),
      level: asString(json['level']),
      duration: asString(json['duration']),
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
    };
  }

  List<String> get badgeList {
    return [subject, level, duration].where((v) => v != null && v.isNotEmpty).cast<String>().toList();
  }
}