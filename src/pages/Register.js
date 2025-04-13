import React from 'react';
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';

const Register = () => {
  return (
    <Box minH="100vh" bg="gray.50" py={10}>
      <Container maxW="container.sm">
        <VStack spacing={8} align="stretch">
          <VStack spacing={2}>
            <Heading size="lg">이용약관</Heading>
            <Text color="gray.600">단잠 서비스 이용약관</Text>
          </VStack>

          <Box bg="white" p={8} borderRadius="lg" boxShadow="base">
            <VStack spacing={6} align="stretch">
              <Text>
                단잠 서비스 이용약관
              </Text>
              <Text>
                제1조 (목적)
                본 약관은 단잠(이하 "회사")이 제공하는 서비스(이하 "서비스")의 이용조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </Text>
              <Text>
                제2조 (약관의 효력 및 변경)
                1. 본 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.
                2. 회사는 약관의 규제에 관한 법률 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
              </Text>
              <Text>
                제3조 (서비스의 내용)
                회사가 제공하는 서비스는 다음과 같습니다:
                1. 호텔 예약 서비스
                2. 기타 회사가 추가 개발하거나 제휴를 통해 회원에게 제공하는 일체의 서비스
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Register;
