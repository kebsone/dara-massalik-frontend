import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const phoneNumberValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value?.toString().trim() ?? '';

  if (!value) {
    return null;
  }

  // Remove spaces and common formatting characters
  const normalized = value.replace(/[\s().-]/g, '');

  // International phone number: + followed by 8 to 15 digits
  const isValid = /^\+[1-9]\d{7,14}$/.test(normalized);

  return isValid ? null : { invalidPhoneNumber: true };
};