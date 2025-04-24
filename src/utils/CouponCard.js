import React from 'react';
import {
  Box,
  Text,
  Button,
} from '@chakra-ui/react';

const CouponCard = ({
  name,
  discountType,
  discountValue,
  endDate,
  applicableRoomType,
  couponCode,
  onApply,
}) => {
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      w="100%"
      bg="white"
      boxShadow="sm"
    >
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="#3182CE"
        mb={2}
      >
        {discountType === 'percentage'
          ? `${discountValue}% 할인`
          : `${discountValue?.toLocaleString() || 0}원 할인`}
      </Text>

      <Text
        fontSize="md"
        fontWeight="semibold"
        color="gray.800"
        mb={1}
      >
        {name}
      </Text>

      <Text fontSize="sm" color="gray.600">
        쿠폰 코드: {couponCode || '코드 없음'}
      </Text>
      <Text fontSize="sm" color="gray.600">
        적용 객실: {applicableRoomType === 'all' ? '모든 객실' : applicableRoomType}
      </Text>
      <Text fontSize="sm" color="gray.600">
        유효 기간: {endDate || '제한 없음'}까지
      </Text>

      <Button
        mt={4}
        bg="blue.500"
        color="white"
        size="md"
        onClick={onApply}
        width="100%"
        borderRadius="md"
        _hover={{ bg: 'blue.600' }}
      >
        사용 가능
      </Button>
    </Box>
  );
};

export default CouponCard;