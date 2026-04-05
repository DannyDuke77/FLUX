import re
from rest_framework import serializers

def normalize_kenyan_phone(value: str) -> str:
    if not value:
        return value

    # Remove common separators
    value = re.sub(r"[^\d+]", "", value)

    if value.startswith("+254"):
        normalized = value
    elif value.startswith("254"):
        normalized = f"+{value}"
    elif value.startswith("0"):
        normalized = f"+254{value[1:]}"
    else:
        raise serializers.ValidationError("Invalid Kenyan phone number format.")

    if not re.match(r'^\+254[17]\d{8}$', normalized):
        raise serializers.ValidationError("Invalid Kenyan mobile number.")

    return normalized