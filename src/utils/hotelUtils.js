// src/utils/hotelUtils.js
/**
 * Extract active amenities for a given room key.
 * @param {Array} roomTypes - List of roomType objects from hotelSettings.
 * @param {string} roomKey - Lowercased roomInfo key.
 */
export function getActiveAmenities(roomTypes, roomKey) {
    if (!Array.isArray(roomTypes) || !roomKey) return [];
    const rt = roomTypes.find((r) => r.roomInfo?.toLowerCase() === roomKey);
    if (!rt?.roomAmenities) return [];
    return rt.roomAmenities
      .filter((a) => a.isActive && a.nameKor && a.icon)
      .map((a) => ({ nameKor: a.nameKor, nameEng: a.nameEng || a.nameKor, icon: a.icon }));
  }