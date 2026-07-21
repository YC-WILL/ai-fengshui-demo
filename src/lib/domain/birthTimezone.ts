export const DEFAULT_BIRTH_TIMEZONE = "Asia/Shanghai";

export interface BirthTimezoneOption {
  value: string;
  label: string;
}

export const BIRTH_TIMEZONE_OPTIONS: BirthTimezoneOption[] = [
  { value: "Asia/Shanghai", label: "中国大陆（UTC+8）" },
  { value: "Asia/Hong_Kong", label: "中国香港（UTC+8）" },
  { value: "Asia/Macau", label: "中国澳门（UTC+8）" },
  { value: "Asia/Taipei", label: "中国台湾（UTC+8）" },
  { value: "Asia/Tokyo", label: "日本（UTC+9）" },
  { value: "Asia/Seoul", label: "韩国（UTC+9）" },
  { value: "Asia/Singapore", label: "新加坡（UTC+8）" },
  { value: "Asia/Bangkok", label: "泰国（UTC+7）" },
  { value: "Asia/Kolkata", label: "印度（UTC+5:30）" },
  { value: "Europe/London", label: "英国（含夏令时）" },
  { value: "Europe/Paris", label: "欧洲中部（含夏令时）" },
  { value: "America/New_York", label: "北美东部（含夏令时）" },
  { value: "America/Chicago", label: "北美中部（含夏令时）" },
  { value: "America/Denver", label: "北美山地（含夏令时）" },
  { value: "America/Los_Angeles", label: "北美西部（含夏令时）" },
  { value: "Australia/Sydney", label: "澳大利亚东部（含夏令时）" },
  { value: "Pacific/Auckland", label: "新西兰（含夏令时）" }
];

const LOCATION_TIMEZONE: Record<string, string> = {
  香港: "Asia/Hong_Kong",
  澳门: "Asia/Macau",
  台湾: "Asia/Taipei"
};

export function defaultBirthTimezoneForLocation(location?: string | null): string {
  return location ? LOCATION_TIMEZONE[location] ?? DEFAULT_BIRTH_TIMEZONE : DEFAULT_BIRTH_TIMEZONE;
}

export function isSupportedBirthTimezone(value: string): boolean {
  return BIRTH_TIMEZONE_OPTIONS.some(option => option.value === value);
}
