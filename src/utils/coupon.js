// utils/coupon.js
export function resolveCouponMetadata(couponUuid, coupons) {
    if (!couponUuid || !coupons) return { code: null, name: null };
    
    // customerCoupons와 hotelCoupons가 모두 포함된 coupons 배열에서 조회
    const sel = coupons.find((c) => c.couponUuid === couponUuid || c.uuid === couponUuid) || {};
    const code = sel.code || null;
    const name = sel.name || sel.code || `쿠폰-${couponUuid.slice(0, 8)}`;
  
    console.log('[resolveCouponMetadata] Resolved coupon:', {
      couponUuid,
      code,
      name,
      sel,
    });
  
    return {
      code,
      name,
    };
  }
  
  export function filterCoupons({
    hotelCoupons = [],
    customerCoupons = [],
    roomInfo,
    hotelId,
    todayStr,
  }) {
    const normalizedRoomInfo = roomInfo?.toLowerCase() || '';
  
    // 호텔 쿠폰 필터링
    const filteredHotelCoupons = hotelCoupons.filter((coupon) => {
      const typeKey = coupon.applicableRoomType?.toLowerCase() || '';
      const isRoomMatch = typeKey === 'all' || typeKey === normalizedRoomInfo;
      const isActive = coupon.isActive;
      const hasUsesLeft = coupon.maxUses - coupon.usedCount > 0;
      const isDateValid = coupon.startDate <= todayStr && coupon.endDate >= todayStr;
  
      return isActive && hasUsesLeft && isDateValid && isRoomMatch;
    });
  
    // 고객 쿠폰 필터링
    const filteredCustomerCoupons = customerCoupons.filter((coupon) => {
      const typeKey = coupon.applicableRoomType?.toLowerCase() || '';
      const isRoomMatch = !coupon.applicableRoomType || typeKey === 'all' || typeKey === normalizedRoomInfo;
      const isHotelMatch = coupon.hotelId === hotelId;
      const isNotUsed = !coupon.used;
      const isDateValid = coupon.endDate >= todayStr && coupon.startDate <= todayStr;
  
      return isRoomMatch && isHotelMatch && isNotUsed && isDateValid;
    });
  
    return { filteredHotelCoupons, filteredCustomerCoupons };
  }
  
  export function pickBestCoupon(hotelCoupons, customerCoupons, roomPrice, numDays) {
    const allCoupons = [...customerCoupons, ...hotelCoupons];
    const uniqueCoupons = Array.from(new Map(allCoupons.map((coupon) => [coupon.couponUuid, coupon])).values());
  
    return uniqueCoupons
      .map((coupon) => {
        let discountValue = 0;
        const totalPriceForCalc = roomPrice * numDays;
        const validatedDiscountValue =
          coupon.discountType === 'percentage'
            ? Math.min(Number(coupon.discountValue) || 0, 100)
            : Number(coupon.discountValue) || 0;
  
        if (coupon.discountType === 'percentage') {
          discountValue = totalPriceForCalc * (validatedDiscountValue / 100);
        } else if (coupon.discountType === 'fixed') {
          discountValue = validatedDiscountValue * numDays;
        }
        return { ...coupon, discountValue, validatedDiscountValue };
      })
      .sort((a, b) => b.discountValue - a.discountValue)[0] || null;
  }
  
  export function applyDiscounts(roomPrice, eventDiscount, bestCoupon, numDays) {
    let finalPrice = roomPrice * numDays;
    let originalPrice = finalPrice;
    let couponMeta = {
      couponDiscount: 0,
      couponFixedDiscount: 0,
      couponDiscountType: null,
      couponDiscountValue: 0,
      couponCode: null,
      couponUuid: null,
    };
  
    // 이벤트 할인 적용
    if (eventDiscount.discountType === 'fixed' && eventDiscount.totalFixedDiscount > 0) {
      finalPrice = Math.max(0, finalPrice - eventDiscount.totalFixedDiscount);
    } else if (eventDiscount.discountType === 'percentage' && eventDiscount.discount > 0) {
      finalPrice = Math.round(finalPrice * (1 - eventDiscount.discount / 100));
    }
  
    // 이벤트 할인이 없으면 쿠폰 할인 적용
    if (bestCoupon && !(eventDiscount.discount > 0 || eventDiscount.fixedDiscount > 0)) {
      if (bestCoupon.discountType === 'percentage') {
        couponMeta.couponDiscount = bestCoupon.validatedDiscountValue;
        couponMeta.couponDiscountType = 'percentage';
        couponMeta.couponDiscountValue = bestCoupon.validatedDiscountValue;
        finalPrice = Math.round(finalPrice * (1 - couponMeta.couponDiscount / 100));
      } else if (bestCoupon.discountType === 'fixed') {
        couponMeta.couponFixedDiscount = bestCoupon.validatedDiscountValue * numDays;
        couponMeta.couponDiscountType = 'fixed';
        couponMeta.couponDiscountValue = bestCoupon.validatedDiscountValue * numDays;
        finalPrice = Math.max(0, finalPrice - couponMeta.couponFixedDiscount);
      }
      couponMeta.couponCode = bestCoupon.code;
      couponMeta.couponUuid = bestCoupon.couponUuid;
    }
  
    return { finalPrice, originalPrice, couponMeta };
  }