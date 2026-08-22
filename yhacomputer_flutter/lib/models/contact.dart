class Contact {
  final int? id;
  final String name;
  final String email;
  final String message;

  Contact({
    this.id,
    required this.name,
    required this.email,
    required this.message,
  });

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      id: json['id'] is int ? json['id'] : null,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      message: json['message'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'message': message,
    };
  }
}