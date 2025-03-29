// webapp/src/components/PrivacyConsentModal.js
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Box,
  Checkbox,
} from '@chakra-ui/react';

const PrivacyConsentModal = ({ isOpen, onClose, onConsentComplete }) => {
  const [checked, setChecked] = useState(false);

  const handleAgree = () => {
    if (!checked) {
      alert('약관에 동의하려면 체크박스를 선택해주세요.');
      return;
    }
    // 부모에게 동의 완료를 알리고 모달을 닫음
    onConsentComplete();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>개인정보 이용 및 서비스 약관</ModalHeader>
        <ModalBody>
          <Box maxH="400px" overflowY="auto" mb={4}>
            <Text fontSize="sm" mb={2} fontWeight="bold">
              ㈜제로투원
            </Text>
            <Text fontSize="sm" mb={2}>
              제 1 장 총 칙
            </Text>
            <Text fontSize="sm" mb={2}>
              제 1 조 목적: 본 약관은 서비스 이용자가 주식회사 제로투원(이하 “회사”)이 제공하는
              온라인상의 숙박 예약관리 인터넷 서비스인 “Staysync”를 이용함에 있어 회사와
              회원(약관에 동의하고 회원등록을 완료한 이용자)의 권리∙의무 및 책임사항을 규정함을
              목적으로 합니다.
            </Text>
            {/* 아래에 나머지 약관 전문을 붙여넣으세요. */}
            <Text fontSize="sm" mb={2}>
              {/* ...중략 (전체 조항) ... */}
            </Text>
          </Box>
          <Checkbox
            isChecked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            colorScheme="teal"
          >
            위 약관에 동의합니다
          </Checkbox>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            닫기
          </Button>
          <Button colorScheme="teal" onClick={handleAgree}>
            동의하기
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PrivacyConsentModal;
