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
    int? parseInt(dynamic value) => int.tryParse(value?.toString() ?? '');
    String? asString(dynamic value) => value?.toString();

    return Event(
      id: parseInt(json['id']),
      title: json['title']?.toString().trim() ?? '',
      description: asString(json['description']),
      date: asString(json['date']),
      venue: asString(json['venue']),
      category: asString(json['category']),
      eventType: asString(json['event_type']),
      duration: asString(json['duration']),
      image: asString(json['image']),
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
    return image!.split('|').map((item) => item.trim()).where((item) => item.isNotEmpty).toList();
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
    return [category, eventType].where((value) => value != null && value.isNotEmpty).cast<String>().toList();
  }
}