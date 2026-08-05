class Review {
  final int? id;
  final String name;
  final String? courseName;
  final String message;

  Review({
    this.id,
    required this.name,
    this.courseName,
    required this.message,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] is int ? json['id'] : null,
      name: json['name'] ?? '',
      courseName: json['course_name'],
      message: json['message'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'course_name': courseName,
      'message': message,
    };
  }
}