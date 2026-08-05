class Event {
  final int? id;
  final String title;
  final String? description;
  final String? date;
  final String? venue;
  final String? category;
  final String? eventType;
  final String? duration;
  final String? image;

  Event({
    this.id,
    required this.title,
    this.description,
    this.date,
    this.venue,
    this.category,
    this.eventType,
    this.duration,
    this.image,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] is int ? json['id'] : null,
      title: json['title'] ?? '',
      description: json['description'],
      date: json['date'],
      venue: json['venue'],
      category: json['category'],
      eventType: json['event_type'],
      duration: json['duration'],
      image: json['image'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'date': date,
      'venue': venue,
      'category': category,
      'event_type': eventType,
      'duration': duration,
      'image': image,
    };
  }

  List<String> get imageList {
    if (image == null || image!.isEmpty) return [];
    return image!.split('|').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  List<Map<String, String>> get factList {
    final facts = <Map<String, String>>[];
    if (date != null && date!.isNotEmpty) facts.add({'label': 'Date', 'value': date!});
    if (venue != null && venue!.isNotEmpty) facts.add({'label': 'Venue', 'value': venue!});
    if (duration != null && duration!.isNotEmpty) facts.add({'label': 'Duration', 'value': duration!});
    if (imageList.isNotEmpty) facts.add({'label': 'Photos', 'value': imageList.length.toString()});
    return facts;
  }

  List<String> get tagList {
    return [category, eventType].where((v) => v != null && v.isNotEmpty).cast<String>().toList();
  }
}