import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Checkbox,
  Container,
  Heading,
  useToast,
} from '@chakra-ui/react';

const Consent = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isAllAgreed, setIsAllAgreed] = useState(false);

  const handleAllAgree = (e) => {
    const checked = e.target.checked;
    setIsAllAgreed(checked);
    
    if (checked) {
      toast({
        title: "동의되었습니다",
        status: "success",
        duration: 1000,
        isClosable: false,
      });
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    }
  };

  return (
    <Container maxW="container.sm" py={4}>
      <VStack spacing={3} align="stretch">
        <Heading size="lg" textAlign="center" mb={2}>이용약관 및 개인정보처리방침</Heading>
        
        <Box bg="gray.50" p={3} borderRadius="md" h="180px" overflowY="auto">
          <Heading size="sm" mb={2}>서비스 이용약관</Heading>
          <Text fontSize="sm">
            제1조 (목적)
            이 약관은 단잠(이하 "회사")이 제공하는 숙박예약 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            {/* 나머지 이용약관 내용 */}
          </Text>
        </Box>

        <Box bg="gray.50" p={3} borderRadius="md" h="180px" overflowY="auto" mb={2}>
          <Heading size="sm" mb={2}>개인정보처리방침</Heading>
          <Text fontSize="sm">
            1. 개인정보의 수집 및 이용 목적
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            {/* 나머지 개인정보처리방침 내용 */}
          </Text>
        </Box>

        <Checkbox 
          size="lg" 
          colorScheme="blue"
          isChecked={isAllAgreed}
          onChange={handleAllAgree}
          mt={0}
        >
          위 약관에 모두 동의합니다
        </Checkbox>
      </VStack>
    </Container>
  );
};

export default Consent; 