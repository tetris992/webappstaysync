// webapp/src/components/AmenityIcons.js
import React from 'react';
import { Flex, Tooltip, Icon, Box } from '@chakra-ui/react';
import { FaQuestionCircle } from 'react-icons/fa'; // 대체 아이콘 추가
import iconMap from '../utils/iconMap';

const AmenityIcons = ({ activeAmenities = [] }) => {
  if (!activeAmenities.length) return null;

  return (
    <Flex wrap="wrap" gap={2}>
      {activeAmenities.map((amenity, idx) => {
        const IconComponent = iconMap[amenity.icon] || FaQuestionCircle; // 대체 아이콘 사용
        return (
          <Tooltip key={idx} label={amenity.nameKor} placement="top" hasArrow>
            <Box>
              <Icon as={IconComponent} boxSize={5} color="teal.500" />
            </Box>
          </Tooltip>
        );
      })}
    </Flex>
  );
};

export default AmenityIcons;
