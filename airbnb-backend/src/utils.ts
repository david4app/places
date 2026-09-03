// MySQL/MariaDB TIMESTAMP columns reject ISO 8601 strings; convert to 'YYYY-MM-DD HH:MM:SS'.
export function toMysqlDatetime(isoString: string): string {
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
}
