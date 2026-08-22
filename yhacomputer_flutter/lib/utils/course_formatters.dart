double? parseConfirmedFee(String? value) {
  final normalized = (value ?? '').replaceAll(RegExp(r'[^0-9.]'), '');
  final numeric = double.tryParse(normalized);
  if (numeric == null || !numeric.isFinite || numeric <= 0) return null;
  return numeric;
}

bool hasConfirmedFee(String? value) => parseConfirmedFee(value) != null;

String formatCourseFee(String? value) {
  final fee = parseConfirmedFee(value);
  if (fee == null) return 'Fee: pending';

  final display = fee == fee.roundToDouble()
      ? fee.toInt().toString()
      : fee
            .toStringAsFixed(2)
            .replaceFirst(RegExp(r'0+$'), '')
            .replaceFirst(RegExp(r'\.$'), '');
  final grouped = display.replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
  return 'MMK $grouped';
}
