type ClassValue = string | number | null | boolean | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const flatten = (input: ClassValue) => {
    if (!input) return;
    if (Array.isArray(input)) {
      input.forEach(flatten);
      return;
    }
    classes.push(String(input));
  };

  inputs.forEach(flatten);
  return classes.join(" ");
}
