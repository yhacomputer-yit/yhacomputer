class Subject {
  final int? id;
  final int? courseId;
  final String name;
  final String? description;

  const Subject({
    this.id,
    this.courseId,
    required this.name,
    this.description,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    int? parseInt(dynamic value) => value is int ? value : int.tryParse('$value');

    return Subject(
      id: parseInt(json['id']),
      courseId: parseInt(json['course_id']),
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
    );
  }
}
