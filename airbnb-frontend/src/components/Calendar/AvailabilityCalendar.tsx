import { addMonths, eachDayOfInterval, endOfMonth, format, isBefore, startOfDay, startOfMonth, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import type { AvailabilityRange } from '../../types';

type AvailabilityCalendarProps = {
  blockedRanges: AvailabilityRange[];
  monthsToShow?: number;
};

function isBlocked(day: Date, ranges: AvailabilityRange[]) {
  return ranges.some((range) => {
    const start = startOfDay(new Date(range.checkIn));
    const end = startOfDay(new Date(range.checkOut));
    return day >= start && day < end;
  });
}

function MonthGrid({ month, blockedRanges }: { month: Date; blockedRanges: AvailabilityRange[] }) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });
  const today = startOfDay(new Date());

  return (
    <div>
      <p className="mb-3 text-center font-semibold text-gray-900">{format(month, 'MMMM yyyy')}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
          <div key={`${label}-${index}`} className="py-1 font-medium">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const blocked = isBlocked(day, blockedRanges);
          const past = isBefore(day, today);
          const outsideMonth = !isSameMonth(day, month);
          return (
            <div
              key={day.toISOString()}
              className={[
                'rounded-md py-1.5',
                outsideMonth ? 'text-gray-300' : '',
                blocked && !outsideMonth ? 'bg-red-100 text-red-500 line-through' : '',
                !blocked && past && !outsideMonth ? 'text-gray-300' : '',
                !blocked && !past && !outsideMonth ? 'text-gray-700' : '',
              ].join(' ')}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AvailabilityCalendar({ blockedRanges, monthsToShow = 2 }: AvailabilityCalendarProps) {
  const months = Array.from({ length: monthsToShow }, (_, index) => addMonths(startOfMonth(new Date()), index));

  return (
    <div>
      <div className="grid gap-8 sm:grid-cols-2">
        {months.map((month) => (
          <MonthGrid key={month.toISOString()} month={month} blockedRanges={blockedRanges} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
        <span className="inline-block h-3 w-3 rounded bg-red-100" />
        <span>Already booked</span>
      </div>
    </div>
  );
}
