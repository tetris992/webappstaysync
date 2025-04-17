// src/utils/availability.js
import { format, startOfDay, addDays } from 'date-fns';

/**
 * getDetailedAvailabilityMessage
 * 선택한 날짜 범위 내에, 각 날짜별 사용 가능한 객실 번호(잔여 객실)를 메시지로 생성합니다.
 */
export function getDetailedAvailabilityMessage(
  rangeStart,
  rangeEnd,
  roomTypeKey,
  availabilityByDate
) {
  let msg =
    '예약이 불가능합니다.\n선택한 날짜 범위에서 날짜별 사용 가능한 객실번호는 다음과 같습니다:\n';
  let cursor = startOfDay(rangeStart);
  while (cursor < startOfDay(rangeEnd)) {
    const ds = format(cursor, 'yyyy-MM-dd');
    const freeRooms =
      availabilityByDate[ds]?.[roomTypeKey.toLowerCase()]?.leftoverRooms || [];
    msg += `${ds}: ${freeRooms.length > 0 ? freeRooms.join(', ') : '없음'}\n`;
    cursor = addDays(cursor, 1);
  }
  msg += '\n(다른 날짜를 선택해주세요.)';
  return msg;
}