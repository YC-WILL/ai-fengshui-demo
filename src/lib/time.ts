const DEFAULT_TIME_ZONE = "Asia/Shanghai";

/** 返回指定时区的本地日期，避免服务器 UTC 在北京时间凌晨前后差一天。 */
export function dateKeyInTimeZone(date = new Date(), timeZone = DEFAULT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDaysToDateKey(dateKey: string, days: number, timeZone = DEFAULT_TIME_ZONE): string {
  const date = new Date(`${dateKey}T12:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKeyInTimeZone(date, timeZone);
}
