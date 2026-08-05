class Course {
  final int? id;
  final String title;
  final String? description;
  final String? price;
  final String? image;
  final String? subject;
  final String? level;
  final String? duration;
  final String? highlights;

  Course({
    this.id,
    required this.title,
    this.description,
    this.price,
    this.image,
    this.subject,
    this.level,
    this.duration,
    this.highlights,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] is int ? json['id'] : null,
      title: json['title'] ?? '',
      description: json['description'],
      price: json['price'],
      image: json['image'],
      subject: json['subject'],
      level: json['level'],
      duration: json['duration'],
      highlights: json['highlights'],
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
      'highlights': highlights,
    };
  }

  List<String> get badgeList {
    return [subject, level, duration].where((v) => v != null && v.isNotEmpty).cast<String>().toList();
  }

  List<String> get highlightList {
    if (highlights == null || highlights!.isEmpty) return [];
    return highlights!.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }
}