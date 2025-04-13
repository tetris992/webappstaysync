import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Text,
  Button,
  Box,
  Checkbox,
  Heading,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';

const PrivacyConsentPage = () => {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [allAgreed, setAllAgreed] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bottomRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleAgreementChange = (key) => (e) => {
    const updatedAgreements = {
      ...agreements,
      [key]: e.target.checked,
    };
    setAgreements(updatedAgreements);
    setAllAgreed(updatedAgreements.terms && updatedAgreements.privacy);
  };

  const handleAllAgree = (e) => {
    const checked = e.target.checked;
    setAllAgreed(checked);
    setAgreements({
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
    
    if (checked) {
      // 동의 메시지 표시
      toast({
        title: "동의되었습니다",
        status: "success",
        duration: 1000,
        isClosable: false,
      });
      
      // 1초 후 로그인 페이지로 자동 이동
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    }
  };

  const handleAgree = async () => {
    if (!agreements.terms || !agreements.privacy) {
      toast({
        title: '동의 필요',
        description: '필수 약관에 동의해야 서비스 이용이 가능합니다.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 카카오 로그인은 별도의 계정 활성화 과정이 필요 없음
      toast({
        title: '약관 동의 완료',
        description: '약관 동의가 완료되었습니다. 로그인 페이지로 이동합니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '오류 발생',
        description: '처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      maxW="container.md"
      py={6}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={6} align="stretch" flex="1">
        <Box
          w="full"
          p={{ base: 4, md: 6 }}
          bg={cardBg}
          borderRadius="lg"
          boxShadow="md"
          flex="1"
        >
          <VStack spacing={8} align="stretch">
            <Heading
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="bold"
              textAlign="center"
              color="teal.500"
            >
              단잠 서비스 약관 및 개인정보처리방침
            </Heading>

            {/* 상단 전체 동의 체크박스 */}
            <Checkbox
              isChecked={allAgreed}
              onChange={handleAllAgree}
              colorScheme="teal"
              size="lg"
              fontWeight="bold"
              mb={4}
            >
              전체 동의
            </Checkbox>

            <Box
              maxH="60vh"
              overflowY="auto"
              px={2}
              py={4}
              borderWidth="1px"
              borderRadius="md"
            >
              <VStack spacing={6} align="stretch">
                {/* 회사 정보 */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    ㈜제로투원 (단잠 서비스)
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    본 약관은 단잠 서비스 이용자가 주식회사 제로투원(이하
                    "회사"라 함)이 제공하는 온라인 숙박 예약관리 인터넷 서비스인
                    "단잠" (이하 "서비스"라 함)을 이용함에 있어 회사와 이용자의
                    권리, 의무 및 책임사항을 규정합니다.
                  </Text>
                </Box>

                {/* 제1장 총칙 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제1장 총칙
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제1조 (목적)
                    </Text>
                    <Text fontSize="sm">
                      (주)제로투원은 이용자의 개인정보를 소중하게 생각하며, 이를
                      보호하기 위해 항상 최선을 다하고 있습니다. 회사는
                      「개인정보보호법」, 「위치정보의 보호 및 이용 등에 관한
                      법률」을 비롯한 모든 개인정보보호 관련 법률규정을 준수하고
                      있으며, 관련 법령에 의거한 개인정보처리방침을 정하여
                      이용자 권익 보호에 최선을 다하고 있습니다. 본
                      「개인정보처리방침」은 단잠 서비스를 이용하는 모든
                      이용자에게 적용되며, 이를 인터넷사이트 및 모바일
                      애플리케이션에 공개하여 이용자가 언제나 용이하게 열람할 수
                      있도록 하고 있습니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제2조 (정의)
                    </Text>
                    <Text fontSize="sm">
                      1. <strong>이용자</strong>: 단잠 서비스에 접속하여 단잠
                      서비스 이용약관에 따라 회사가 제공하는 서비스를 이용하는
                      자를 말하며, 회원과 비회원을 포함합니다.
                      <br />
                      2. <strong>서비스</strong>: 구현되는 단말기(PC, 모바일,
                      태블릿 PC 등의 각종 유무선 장치를 포함)와 상관없이
                      이용자가 이용할 수 있는 단잠 서비스를 의미합니다.
                      <br />
                      3. <strong>회원</strong>: 회사에 개인정보를 제공하여
                      회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며,
                      회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를
                      말합니다.
                      <br />
                      4. <strong>비회원</strong>: 회원등록 없이 서비스를
                      이용하는 자로서, 회사가 제공하는 일부 서비스 이용에 제한을
                      받을 수 있습니다.
                      <br />
                      5. <strong>콘텐츠공급자</strong>: 다양한 콘텐츠, 광고 등
                      서비스에 게재될 수 있도록 단잠에 정보를 제공하는 주체로써
                      사람이나 기관을 의미합니다. 대표적으로 이용자 및
                      숙박제공사 등이 있습니다.
                      <br />
                      6. <strong>자료</strong>: 콘텐츠공급자가 제공한 각종 정보,
                      콘텐츠로써 서비스 상에 게시된 부호, 문자, 음성, 음향,
                      화상, 동영상 등의 정보 형태의 글, 사진, 동영상 및 각종
                      파일, 링크, 다운로드, 광고 등을 포함하여 본 서비스에
                      게시물 형태로 포함되어 있거나, 본 서비스를 통해 배포,
                      전송되거나, 본 서비스로부터 접근되는 정보를 의미합니다.
                      <br />
                      7. <strong>아이디(ID)</strong>: 회원의 식별과 서비스
                      이용을 위하여 회원이 설정하고 회사가 승인한 회원 본인의
                      문자와 숫자의 조합을 의미하며, 회원이 설정한 이메일 주소
                      등이 포함됩니다.
                      <br />
                      8. <strong>비밀번호</strong>: 회원의 동일성 확인과
                      회원정보의 보호를 위하여 회원이 설정하고 회사가 승인한
                      문자나 숫자의 조합을 말합니다.
                      <br />
                      9. <strong>유료서비스</strong>: 단잠 서비스를 통해 유료로
                      이용 가능한 회사가 제공하는 각종 온라인 디지털 콘텐츠 및
                      제반 서비스를 말합니다. 정보 및 광고 게시 서비스 등이
                      포함됩니다.
                      <br />
                      10.{' '}
                      <strong>
                        IMEI(International Mobile Equipment Identity)
                      </strong>
                      : 휴대용 모바일 단말기에 내장되어 있는 15자리 숫자로 된
                      번호이며 단말기 고유의 일련번호를 말합니다. (암호화하여
                      안전하게 보호하고 있습니다.)
                      <br />
                      11. <strong>부정이용</strong>: 회원탈퇴 후 재가입, 온라인
                      숙박예약 후 취소 등을 반복적으로 행하는 등 회사가 제공하는
                      단잠 서비스 이용약관 등에서 금지하고 있는 행위, 명의도용
                      등의 불·편법행위 등을 말합니다.
                      <br />
                      12. <strong>숙박제공사</strong>: 단잠 서비스를 통해 숙박
                      관련 서비스를 제공하는 회원 또는 제3자를 의미합니다.
                    </Text>
                  </Box>
                </Box>

                {/* 제2장 개인정보의 처리 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제2장 개인정보의 처리
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제3조 (이용자 정보 처리)
                    </Text>
                    <Text fontSize="sm">
                      1. <strong>이용자 정보의 이용 목적</strong>
                      <br />
                      회사는 다음과 같은 목적으로 이용자 정보를 이용합니다:
                      <br />
                      - 회원식별 및 가입의사 확인, 본인·연령확인, 부정이용 방지
                      <br />
                      - 신규서비스 개발, 다양한 서비스 제공, 문의사항 또는
                      불만·분쟁처리, 공지사항 전달
                      <br />
                      - 이벤트 행사 시 정보 전달, 마케팅 및 광고 등에 활용
                      <br />
                      - 서비스 이용 기록, 접속 빈도 및 서비스 이용에 대한 통계,
                      맞춤형 서비스 제공, 서비스 개선에 활용
                      <br />
                      - 부정 이용 행위를 포함하여 서비스의 원활한 운영에 지장을
                      주는 행위에 대한 방지 및 제재, 계정도용 및 부정거래 방지
                      <br />- <strong>호텔 예약 서비스 제공</strong>: 숙박 예약
                      접수, 예약 확인 및 취소, 예약 관련 알림 제공, 예약 관련
                      고객 문의 처리, 예약 관련 통계 분석 및 서비스 개선
                      <br />
                      <br />
                      2. <strong>회사가 처리하는 이용자의 개인정보</strong>
                      <br />
                      회사는 다음과 같은 개인정보를 처리합니다:
                      <br />
                    </Text>
                    <Box overflowX="auto">
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px',
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#f1f1f1' }}>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              정보주체
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              수집 목적
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              수집 항목
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              보유 및 이용 기간
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                              rowSpan="6"
                            >
                              회원(개인)
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              Apple 계정으로 회원가입 시
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              (필수) 이름, SNS 로그인 정보 식별 값, 단말기 정보,
                              IP 정보
                              <br />
                              (선택) 이름, 이메일, 휴대폰 번호
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 제공 목적 달성 시까지 또는 회원탈퇴 시 즉시
                              삭제
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              Facebook 계정으로 회원가입 시
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              (필수) 이름, SNS 로그인 정보 식별 값, 단말기 정보,
                              IP 정보
                              <br />
                              (선택) 이메일, 연락처
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 제공 목적 달성 시까지 또는 회원탈퇴 시 즉시
                              삭제
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              Google 계정으로 회원가입 시
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              (필수) 이메일, 이름, SNS 로그인 정보 식별 값,
                              단말기 정보, IP 정보
                              <br />
                              (선택) 휴대폰 번호
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 제공 목적 달성 시까지 또는 회원탈퇴 시 즉시
                              삭제
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              이메일 계정으로 회원가입 시
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              (필수) 이메일, 단말기 정보, IP 정보
                              <br />
                              (선택) 휴대폰 번호
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 제공 목적 달성 시까지 또는 회원탈퇴 시 즉시
                              삭제
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              카카오 계정으로 회원가입 시
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              (필수) 닉네임, 단말기 정보, IP 정보
                              <br />
                              (선택) 카카오계정(이메일 또는 휴대폰번호), 연령대,
                              이름
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 제공 목적 달성 시까지 또는 회원탈퇴 시 즉시
                              삭제
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              호텔 예약 서비스 제공
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              (필수) 이름, 휴대폰 번호, 예약 정보(예약 날짜,
                              객실 정보, 결제 정보)
                              <br />
                              (선택) 이메일, 특별 요청 사항
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              예약 서비스 제공 완료 후 5년 또는 회원탈퇴 시 즉시
                              삭제 (단, 법령에 따라 보존 필요 시 해당 기간까지)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              회원(숙박제공사)
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              회원 식별, 서비스 제공, 프로모션 및 마케팅
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              (필수) 이름, 이메일, 휴대폰 번호, 사업자 번호,
                              숙박서비스 관련 정보(숙박시설명, 주소, 객실 정보
                              등)
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 제공 목적 달성 시까지 또는 회원탈퇴 시 즉시
                              삭제
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제4조 (아동의 서비스 이용 제한)
                    </Text>
                    <Text fontSize="sm">
                      1. 만 14세 미만 아동의 개인정보보호를 위하여 회원가입은 만
                      14세 이상만 허용합니다. 호텔 예약 서비스 이용 시에도 만
                      14세 미만 아동의 예약은 보호자의 동의를 받아야 하며,
                      보호자가 예약을 대행하는 경우 보호자의 개인정보를 수집할
                      수 있습니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제5조 (개인정보의 수집 방법)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 다음과 같은 방법으로 개인정보를 수집합니다:
                      <br />
                      - 모바일 애플리케이션, 웹 페이지, 서면 양식, 팩스,
                      고객센터를 통한 전화와 온라인 상담, 이벤트 응모
                      <br />
                      - 호텔 예약 시 이용자가 입력한 정보(예약 양식, 결제 정보
                      등)
                      <br />- 서비스 이용 과정에서 자동으로 생성되는 정보(접속
                      로그, 쿠키 등)
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제6조 (쿠키 활용)
                    </Text>
                    <Text fontSize="sm">
                      1. 인터넷 서비스 이용 과정에서 IP 주소, 쿠키, 서비스 이용
                      기록이 생성되어 수집될 수 있습니다. 회사는 쿠키 정보를
                      수집하여 이용자들의 방문한 단잠 각 서비스 접속 여부, 호텔
                      예약 및 검색 기록, 이용자 문의에 대한 확인 및 안내 등에
                      사용됩니다.
                      <br />
                      2. 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다.
                      따라서 이용자는 웹브라우저에서 옵션을 설정함으로써 모든
                      쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나,
                      아니면 모든 쿠키의 저장을 거부할 수도 있습니다. 다만,
                      쿠키의 저장을 거부할 경우에는 로그인이 필요한 단잠 일부
                      서비스(예: 호텔 예약, 예약 내역 조회 등)는 이용에 어려움이
                      있을 수 있습니다.
                      <br />
                      3. <strong>쿠키 설정 방법 예</strong>:<br />-{' '}
                      <strong>Microsoft Edge</strong>: 웹 브라우저 상단의 설정 →
                      사이트 사용 권한 → 쿠키 및 사이트 데이터
                      <br />- <strong>Chrome</strong>: 웹 브라우저 우측의 설정
                      메뉴 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터
                    </Text>
                  </Box>
                </Box>

                {/* 제3장 개인정보의 이용목적 외 제3자 제공 및 개인정보 위탁처리 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제3장 개인정보의 이용목적 외 제3자 제공 및 개인정보 위탁처리
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제7조 (이용자 정보의 제3자 제공)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 이용자의 사전 동의 또는 법령상의 근거 없이
                      이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만,
                      회사가 특정 서비스 제공(예: 호텔 예약 서비스)을 위해
                      이용자의 개인정보를 제휴사 등 제3자에게 제공하는 경우에는
                      사전에 이용자에게 제공받는 자, 제공되는 개인정보 항목,
                      제공 목적, 보유 및 이용기간 등에 대해서 고지하고 이용자의
                      동의를 구합니다.
                      <br />
                      2. 이용자의 동의가 있는 경우, 회사는 이용자의 개인정보를
                      아래와 같이 제3자에게 제공합니다:
                      <br />
                    </Text>
                    <Box overflowX="auto">
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px',
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#f1f1f1' }}>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              정보주체
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              제공받는 자
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              이용 목적
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              제공 항목(필수)
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              보유 및 이용기간
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              회원(개인)
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              숙박제공사
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              온라인 예약 관련 서비스 제공
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              이름, 휴대폰 번호, 예약 정보(예약 날짜, 객실 정보,
                              결제 정보)
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 목적 달성 시까지 또는 예약 취소 시 즉시
                              삭제
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                    <Text fontSize="sm" mt={2}>
                      3. 이용자는 개인정보의 제3자 제공에 동의하지 않을 수
                      있으며, 이 경우 호텔 예약 서비스 이용이 제한될 수
                      있습니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제8조 (개인정보의 위탁처리)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 향상된 서비스를 제공하기 위해 개인정보 처리를
                      위탁하여 처리할 수 있습니다. 위탁업무를 하는 경우에는
                      다음의 내용을 이용자에게 알리고 동의를 받으며, 어느 하나의
                      사항이 변경된 경우에도 동일합니다.
                      <br />
                      2. 회사는 정보통신서비스의 제공에 관한 계약을 이행하고
                      이용자의 편의 증진 등을 위하여 필요한 경우에 한하여
                      개인정보처리방침 제8조 2항을 공개함으로써 이용자께 고지
                      또는 동의 절차 없이 개인정보 수탁업체에게 처리를 위탁할 수
                      있습니다.
                      <br />
                      3. <strong>국내 위탁 업체</strong>:<br />
                    </Text>
                    <Box overflowX="auto">
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px',
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#f1f1f1' }}>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              수탁업체
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              위탁 업무
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              위탁 정보
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              보유기간
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              카카오(주)
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              SMS, LMS, 알림톡 발송, 메일 발송
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              휴대폰 번호
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              이용 목적 달성 시까지
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                    <Text fontSize="sm" mt={2}>
                      4. <strong>국외 위탁 업체</strong>:<br />
                      회사는 서비스 제공의 안정성과 최신 기술을 이용자에게
                      제공하기 위해 국외에 개인정보를 위탁하고 있으며,
                      이용자로부터 취득 또는 생성한 개인정보를 AWS (Amazon Web
                      Services Inc.)가 보유하고 있는 데이터베이스(물리적 저장
                      장소: 일본)에 저장합니다. AWS는 해당 서버의 물리적인
                      관리만을 행하고, 이용자의 개인정보에 접근할 수 없습니다.
                      <br />
                    </Text>
                    <Box overflowX="auto">
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px',
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#f1f1f1' }}>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              수탁업체
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              이전 항목
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              이전 국가
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              이전 일시 및 방법
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              개인정보 보유 및 이용기간
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              Amazon Web Services Inc.
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 이용 기록 또는 수집된 개인정보
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              일본(AWS 도쿄리전)
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 이용 시점에 네트워크를 통한 전송
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              서비스 변경 시까지 (현재 회사가 이용 중인 클라우드
                              서비스 이용 변경 시까지)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                </Box>

                {/* 제4장 개인정보의 보유기간 및 파기 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제4장 개인정보의 보유기간 및 파기
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제9조 (이용자 정보 보유기간 및 파기 방법)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사가 개인정보를 수집하는 경우 개인정보의 처리목적이
                      달성되거나 고객의 동의를 받은 기간까지 보유하며,
                      관계법령(「상법」, 「전자금융거래법」, 「신용정보의 이용
                      및 보호에 관한 법률」, 「정보통신망 이용촉진 및 정보보호
                      등에 관한 법률」, 「개인정보보호법」 등)에 의한 정보보호
                      사유 의무가 있는 경우에는 일정기간 동안 보유한 뒤
                      파기합니다.
                      <br />
                      2. 회사가 개인정보를 수집하는 경우 그 보유기간은
                      원칙적으로 회원탈퇴 즉시 파기하며, 제3자에게 제공된
                      개인정보에 대해서도 지체 없이 파기하도록 조치합니다. 단,
                      특별한 이유가 있는 경우 "제3조 (이용자 정보 처리)"에
                      명시된 보유기간에 따라 개인정보를 보유할 수 있습니다.
                      <br />
                      3. <strong>호텔 예약 관련 정보의 보유기간</strong>:<br />
                      - 호텔 예약 정보는 예약 서비스 제공 완료 후 5년간
                      보유하며, 이후 즉시 파기합니다.
                      <br />
                      - 예약 취소 시 관련 정보는 즉시 파기됩니다. 단, 법령에
                      따라 보존이 필요한 경우 해당 기간 동안 보유 후 파기합니다.
                      <br />
                      4. 회사는 개인정보를 보호하여 개인정보 유출로 인한 피해가
                      발생하지 않도록 하기 위하여 다음과 같은 방법을 통하여
                      개인정보를 파기합니다:
                      <br />
                      - 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을
                      통하여 파기합니다.
                      <br />
                      - 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수
                      없는 기술적 방법을 사용하여 삭제합니다.
                      <br />
                      5.{' '}
                      <strong>법령 및 내부방침에 의한 보유 및 이용기간</strong>:
                      <br />
                    </Text>
                    <Box overflowX="auto">
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px',
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: '#f1f1f1' }}>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              목적
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              보유기간
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              회원 가입 및 관리
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              회원 탈퇴 시까지 (단, 관계 법령 위반에 따른
                              수사/조사 등이 진행 중인 경우 해당 수사/조사 종료
                              시까지, 서비스 이용에 따른 채권/채무관계 정산
                              시까지)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              재화/서비스 제공
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              재화/서비스 공급 완료 및 요금결제/정산 완료 시까지
                              (단, 법령에 따라 보존 필요 시 해당 기간까지)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              계약 또는 청약철회 등에 관한 기록
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              5년 (「전자상거래 등에서의 소비자보호에 관한
                              법률」)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              표시 광고에 관한 기록
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              광고 게재 종료 후 6개월 (「전자상거래 등에서의
                              소비자보호에 관한 법률」)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              대금결제 및 재화 등의 공급에 관한 기록
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              5년 (「전자상거래 등에서의 소비자보호에 관한
                              법률」)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              소비자의 불만 또는 분쟁처리에 관한 기록
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              3년 (「전자상거래 등에서의 소비자보호에 관한
                              법률」)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              전자금융거래에 관한 기록
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              5년 (「전자금융거래법」)
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              부정이용 등에 관한 기록
                            </td>
                            <td
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              10년 (회사 내부방침)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                </Box>

                {/* 제5장 권리 행사 및 개인정보 보호 대책 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제5장 권리 행사 및 개인정보 보호 대책
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제10조 (이용자 권리와 그 행사방법)
                    </Text>
                    <Text fontSize="sm">
                      1. 이용자는 언제든지 등록되어 있는 개인정보를 조회하거나
                      수정할 수 있으며, 회원의 경우 가입해지(탈퇴)를 요청할 수
                      있습니다. 단, 회사는 다음과 같이 조회, 수정, 가입해지 등의
                      요청을 거절할 만한 정당한 공익적 사유가 있는 경우에는
                      요청을 거부할 수 있으며, 거부하는 경우에는 10일 이내에
                      구두 또는 서면으로 거부 사유 및 불복 방법을 정보주체에게
                      통지합니다:
                      <br />
                      - 법률에 따라 열람이 금지되거나 제한되는 경우
                      <br />
                      - 다른 사람의 생명, 신체를 해할 우려가 있거나 다른 사람의
                      재산과 그 밖의 이익을 부당하게 침해할 우려가 있는 경우
                      <br />
                      2. 회원의 정보는 서비스에서 로그인 후 '설정' 메뉴를 통해
                      조회, 수정, 가입해지(탈퇴)가 가능합니다. 호텔 예약 정보는
                      '예약 내역' 메뉴에서 조회 및 취소가 가능합니다.
                      <br />
                      3. 이용자가 개인정보의 오류에 대한 정정을 요청한 경우에는
                      정정을 완료하기 전까지 개인정보를 이용 또는 제공하지
                      않습니다. 또한 잘못된 개인정보를 제3자에게 이미 제공한
                      경우에는 정정 처리결과를 제3자에게 통지합니다.
                      <br />
                      4. 회사는 이용자 요청에 의해 해지 또는 삭제된 개인정보를
                      "제3조 (이용자 정보 처리)"에 명시된 바에 따라 처리하고 그
                      외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제11조 (개인정보의 안전성 확보조치)
                    </Text>
                    <Text fontSize="sm">
                      회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를
                      취하고 있습니다:
                      <br />
                      1. <strong>관리적 조치</strong>:<br />
                      - 내부관리계획 수립·시행, 개인정보 취급자의 최소화 및 교육
                      <br />
                      - 개인정보보호책임자 지정, 개인정보 처리방침 수립 및 공개
                      <br />
                      2. <strong>기술적 조치</strong>:<br />
                      - 개인정보의 암호화, 해킹 등에 대비한 기술적 대책
                      <br />
                      - 접근 통제 시스템 구축, 접속기록의 보관 및 위변조 방지
                      <br />
                      3. <strong>물리적 조치</strong>:<br />- 비인가자에 대한
                      출입 통제, 정기적인 점검 실시
                    </Text>
                  </Box>
                </Box>

                {/* 제6장 책임자 및 관리자 지정 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제6장 책임자 및 관리자 지정
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제12조 (개인정보 보호책임자 및 관리자 지정)
                    </Text>
                    <Text fontSize="sm">
                      1. 개인정보 보호책임자는 이용자의 개인정보를 보호하고
                      유출을 방지하는 책임자로서 이용자가 안심하고 회사가
                      제공하는 서비스를 이용할 수 있도록 도우며, 개인정보를
                      보호하는데 있어 이용자에게 고지한 사항들에 반하여 사고가
                      발생할 시에는 이에 관한 책임을 집니다.
                      <br />
                      2. 회사는 기술적인 보완조치를 취하였음에도 불구하고 예기치
                      못한 사고로 인한 정보의 훼손 및 멸실, 이용자가 회사에
                      제공한 자료에 의한 각종 분쟁 등에 관해서는 책임이
                      없습니다.
                      <br />
                      3. 회사는 「개인정보보호법」에서 규정한 보호책임자를
                      다음과 같이 지정합니다:
                      <br />
                      <strong>개인정보 관련 고충처리 담당부서</strong>
                      <br />
                      - E-mail: help@ztoone.co.kr
                      <br />
                      <strong>개인정보 보호책임자</strong>
                      <br />
                      - 이름: 최정환
                      <br />
                      - 소속: 총괄
                      <br />
                      - 직위: CTO
                      <br />
                      - E-mail: since25@ztoone.co.kr
                      <br />
                      4. 기타 개인정보침해에 대한 신고나 상담이 필요한 경우에는
                      아래 기관에 문의하시기 바랍니다:
                      <br />
                      - 개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)
                      <br />
                      - 대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)
                      <br />
                      - 경찰청 사이버수사국 (ecrm.cyber.go.kr / 국번없이 182)
                      <br />- 개인정보분쟁조정위원회 (www.kopico.go.kr /
                      국번없이 1833-6972)
                    </Text>
                  </Box>
                </Box>

                {/* 제7장 개인위치정보의 처리 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제7장 개인위치정보의 처리
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제13조 (개인위치정보의 처리목적 및 보유기간)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 개인위치정보를 매물 정보 제공 및 호텔 검색
                      서비스 제공의 목적으로만 이용하고 있으며, 위치정보를
                      시스템에 저장하지 않습니다.
                      <br />
                      2. 호텔 예약 서비스 제공 시, 이용자가 선택한 호텔의 위치
                      정보를 기반으로 주변 정보(예: 주변 관광지, 교통 정보)를
                      제공하기 위해 개인위치정보를 이용할 수 있습니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제14조 (개인위치정보의 수집ㆍ이용ㆍ제공사실 확인자료의
                      보유근거 및 보유기간)
                    </Text>
                    <Text fontSize="sm">
                      1. 「위치정보의 보호 및 이용 등에 관한 법률」 제16조
                      제2항에 근거하여 이용자의 위치정보 수집ㆍ이용ㆍ제공사실
                      확인자료를 위치정보시스템에 자동으로 기록하며, 6개월 이상
                      보관합니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제15조 (개인위치정보의 수집, 저장, 파기 절차 및 방법)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 개인의 위치정보 보호를 최우선으로 고려하며,
                      다음과 같은 절차와 방법으로 위치정보를 처리 및 파기합니다:
                      <br />- <strong>위치정보의 수집</strong>:<br />
                      - 개인의 위치정보는 서비스 제공을 위해 필요한 최소한의
                      범위에서만 사용됩니다.
                      <br />
                      - 위치정보는 개인의 단말기에서만 처리되며, 당사의 서버로
                      전송되거나 저장되지 않습니다.
                      <br />- <strong>위치정보의 저장</strong>:<br />
                      - 위치정보는 개인의 단말기 내에서만 일시적으로 저장되며,
                      서비스 이용 종료 시 즉시 삭제됩니다.
                      <br />
                      - 당사는 어떠한 경우에도 개인의 위치정보를 서버에
                      저장하거나 보관하지 않습니다.
                      <br />- <strong>위치정보의 파기</strong>:<br />
                      - 서비스 이용 종료 시: 단말기 내에서 처리된 위치정보는
                      서비스 이용이 종료되는 즉시 자동으로 파기됩니다.
                      <br />- 앱 종료 시: 앱을 완전히 종료하면 메모리에
                      일시적으로 저장된 모든 위치정보가 즉시 삭제됩니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제16조 (개인위치정보의 제3자 제공 및 통보에 관한 사항)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 개인위치정보를 제3자에게 제공하고 있지 않습니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제17조 (8세 이하의 아동 등의 보호의무자의 권리ㆍ의무 및
                      행사방법)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 아래의 경우에 해당하는 이용자(이하 "8세 이하의
                      아동 등"이라 함)의 보호의무자가 8세 이하의 아동 등의 생명
                      또는 신체보호를 위하여 개인위치정보의 이용 또는 제공에
                      동의하는 경우에는 본인의 동의가 있는 것으로 봅니다:
                      <br />
                      - 8세 이하의 아동
                      <br />
                      - 피성년후견인
                      <br />
                      - 「장애인복지법」 제2조제2항제2호에 따른 정신적 장애를
                      가진 사람으로서 「장애인고용촉진 및 직업재활법」
                      제2조제2호에 따른 중증장애인에 해당하는
                      사람(「장애인복지법」 제32조에 따라 장애인 등록을 한 사람
                      한정)
                      <br />
                      2. 8세 이하의 아동 등의 생명 또는 신체의 보호를 위하여
                      개인위치정보의 이용 또는 제공에 동의를 하고자 하는
                      보호의무자는 서면동의서에 보호의무자임을 증명하는 서면을
                      첨부하여 회사에 제출하여야 합니다.
                      <br />
                      3. 보호의무자는 8세 이하의 아동 등의 개인위치정보 이용
                      또는 제공에 동의하는 경우 개인위치정보주체 권리의 전부를
                      행사할 수 있습니다.
                    </Text>
                  </Box>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제18조 (위치정보관리책임자)
                    </Text>
                    <Text fontSize="sm">
                      1. 회사는 위치정보 보호를 위해 위치정보 관리책임자를
                      지정하고 있으며, 위치정보 관리책임자는 개인정보
                      보호책임자가 겸직하고 있습니다.
                    </Text>
                  </Box>
                </Box>

                {/* 제8장 고지의 의무 */}
                <Box>
                  <Heading as="h2" fontSize="lg" mb={3}>
                    제8장 고지의 의무
                  </Heading>

                  <Box mb={4}>
                    <Text fontSize="sm" fontWeight="bold" mb={1}>
                      제19조 (고지의 의무)
                    </Text>
                    <Text fontSize="sm">
                      1. 본 개인정보처리방침은 2012년 1월 17일에 제정되었으며,
                      정부 및 회사의 정책 또는 보안기술의 변경에 따라 내용의
                      추가, 삭제 및 수정이 있을 경우에는 개정 최소 7일 전부터
                      서비스의 공지사항을 통해 고지하며, 본 정책은 시행일자에
                      시행됩니다.
                      <br />
                      2. <strong>공고일자</strong>: 2025년 04월 01일
                      <br />
                      <strong>시행일자</strong>: 2025년 04월 08일
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </Box>

            {/* 동의 체크박스 */}
            <VStack spacing={3} align="stretch" mt={4}>
              <Checkbox
                isChecked={agreements.terms}
                onChange={handleAgreementChange('terms')}
                colorScheme="teal"
              >
                [필수] 서비스 이용약관 동의
              </Checkbox>
              <Checkbox
                isChecked={agreements.privacy}
                onChange={handleAgreementChange('privacy')}
                colorScheme="teal"
              >
                [필수] 개인정보 수집 및 이용 동의
              </Checkbox>
              <Checkbox
                isChecked={agreements.marketing}
                onChange={handleAgreementChange('marketing')}
                colorScheme="teal"
              >
                [선택] 마케팅 정보 수신 동의
              </Checkbox>
              <Text fontSize="xs" color="gray.500">
                마케팅 정보 수신 동의를 거부하셔도 서비스 이용에는 제한이
                없습니다.
              </Text>
            </VStack>
          </VStack>
        </Box>

        <Button
          colorScheme="teal"
          onClick={handleAgree}
          w="full"
          size="md"
          ref={bottomRef}
        >
          전체 동의
        </Button>
      </VStack>
    </Container>
  );
};

export default PrivacyConsentPage;
