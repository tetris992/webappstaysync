// app/utils/dateParser.js
// 프론트엔드, 백엔드 공용 모듈로, 항상 KST(Asia/Seoul) 기준으로 날짜 파싱/포맷

import { parse, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ko, enUS } from 'date-fns/locale';

// 캐시: 동일 문자열 중복 파싱 방지
const parsedDateCache = {};

/**
 * 입력 문자열에서 불필요한 부분 정리
 * @param {string} str
 * @returns {string}
 */
function cleanString(str) {
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/\([^)]*\)/g, '')   // 괄호 안 제거
    .replace(/[-]+$/g, '')         // 끝의 '-' 제거
    .replace(/\s+/g, ' ')         // 다중 공백 단일화
    .replace(/\n/g, ' ')          // 개행 제거
    .replace(/미리예약/g, '')      // 불필요 텍스트 제거
    .trim();                       // 앞뒤 공백 제거
}

/**
 * 다양한 형식의 날짜 문자열을 파싱하여 Date 객체로 반환
 * 시간 정보가 없으면 hotelSettings의 기본 체크인/체크아웃 시간을 적용
 *
 * @param {string} dateString        - 파싱할 날짜 문자열
 * @param {{ checkInTime?: string, checkOutTime?: string }|null} hotelSettings
 * @param {boolean} [isCheckIn=true]  - 체크인(true) / 체크아웃(false)
 * @returns {Date|null}
 */
export function parseDate(dateString, hotelSettings = null, isCheckIn = true) {
  if (!dateString) return null;
  if (parsedDateCache[dateString] !== undefined) {
    return parsedDateCache[dateString];
  }

  const s = cleanString(dateString);
  const formats = [
    "yyyy-MM-dd'T'HH:mm:ss.SSS",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm",
    'yyyy년 M월 d일 HH:mm',
    'yyyy년 MM월 dd일 HH:mm',
    'yyyy년 M월 d일',
    'yyyy년 MM월 dd일',
    'yyyy.MM.dd HH:mm',
    'yyyy.MM.dd',
    'yyyy.MM.dd HH:mm:ss',
    'dd MMM yyyy HH:mm',
    'dd MMM yyyy',
    'MMM dd, yyyy HH:mm',
    'MMM dd, yyyy',
    'MMM dd yyyy',
    'MMMM dd, yyyy',
    'd MMM yyyy',
    'd MMM yyyy HH:mm',
    'd MMM yyyy HH:mm:ss',
    'MMM d, yyyy',
    'MMM d, yyyy HH:mm',
    'yyyy-MM-dd HH:mm',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd',
    'yyyy/MM/dd HH:mm',
    'yyyy/MM/dd HH:mm:ss',
    'yyyy/MM/dd',
    'dd-MM-yyyy HH:mm',
    'dd-MM-yyyy',
    'dd.MM.yyyy HH:mm',
    'dd.MM.yyyy',
    'dd/MM/yyyy HH:mm',
    'dd/MM/yyyy',
  ];
  const locales = [ko, enUS];
  const defaultIn = '16:00';
  const defaultOut = '11:00';

  for (const locale of locales) {
    for (const fmt of formats) {
      const dt = parse(s, fmt, new Date(), { locale });
      if (isValid(dt)) {
        const hasTime = fmt.includes('HH') || fmt.includes('mm');
        if (!hasTime && hotelSettings) {
          const time = isCheckIn
            ? hotelSettings.checkInTime || defaultIn
            : hotelSettings.checkOutTime || defaultOut;
          const [h, m] = time.split(':');
          dt.setHours(+h, +m, 0, 0);
        }
        parsedDateCache[dateString] = dt;
        return dt;
      }
    }
  }

  // 마지막으로 JS Date 직접 파싱 시도
  try {
    const dt = new Date(s);
    if (isValid(dt)) {
      if (hotelSettings) {
        const hasTime = /\d{2}:\d{2}/.test(s);
        if (!hasTime) {
          const time = isCheckIn
            ? hotelSettings.checkInTime || defaultIn
            : hotelSettings.checkOutTime || defaultOut;
          const [h, m] = time.split(':');
          dt.setHours(+h, +m, 0, 0);
        }
      }
      parsedDateCache[dateString] = dt;
      return dt;
    }
  } catch {}

  parsedDateCache[dateString] = null;
  return null;
}

/**
 * Date 또는 ISO 문자열을 KST(Asia/Seoul) 기준으로 지정된 포맷의 문자열로 반환
 * @param {Date|string} date
 * @param {string} [fmt='yyyy-MM-dd HH:mm:ss']
 * @returns {string}
 */
export function formatDate(date, fmt = 'yyyy-MM-dd HH:mm:ss') {
  const dt = date instanceof Date ? date : new Date(date);
  if (!isValid(dt)) return '정보 없음';
  return formatInTimeZone(dt, 'Asia/Seoul', fmt);
}