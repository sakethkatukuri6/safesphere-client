export interface ContactValidationErrors {
  name?: string;
  relationship?: string;
  phone?: string;
}

export function validateContact(
  name: string,
  relationship: string,
  phone: string
): ContactValidationErrors {
  const errors: ContactValidationErrors = {};

  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = 'Name is required.';
  } else if (trimmedName.length > 60) {
    errors.name = 'Name must be 60 characters or fewer.';
  }

  const trimmedRel = relationship.trim();
  if (!trimmedRel) {
    errors.relationship = 'Relationship is required.';
  } else if (trimmedRel.length > 30) {
    errors.relationship = 'Relationship must be 30 characters or fewer.';
  }

  const trimmedPhone = phone.trim();
  if (!trimmedPhone) {
    errors.phone = 'Phone number is required.';
  } else if (trimmedPhone.length > 20) {
    errors.phone = 'Phone number must be 20 characters or fewer.';
  } else if (!/^[0-9+\s\-().]+$/.test(trimmedPhone)) {
    errors.phone = 'Phone number contains invalid characters.';
  }

  return errors;
}
