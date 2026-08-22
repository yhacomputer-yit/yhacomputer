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
    int? parseInt(dynamic value) => int.tryParse(value?.toString() ?? '');
    String? asString(dynamic value) => value?.toString();

    return Review(
      id: parseInt(json['id']),
      name: json['name']?.toString().trim() ?? '',
      courseName: asString(json['course_name']),
      message: json['message']?.toString().trim() ?? '',
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