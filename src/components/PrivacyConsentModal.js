import React, { useState } from 'react';
import {
  Container,
  VStack,
  Text,
  Button,
  Box,
  Checkbox,
} from '@chakra-ui/react';

const PrivacyConsent = ({ onClose, onConsentComplete }) => {
  const [checked, setChecked] = useState(false);

  const handleAgree = () => {
    if (!checked) {
      alert('약관에 동의하려면 체크박스를 선택해주세요.');
      return;
    }
    onConsentComplete();
    onClose();
  };

  return (
    <Container
      maxW="container.sm"
      py={6}
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={4} align="stretch" flex="1">
        <Box
          w="full"
          p={{ base: 3, md: 4 }}
          bg="white"
          borderRadius="lg"
          boxShadow="md"
          flex="1"
        >
          <VStack spacing={4} align="stretch">
            <Text
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="bold"
              textAlign="center"
              color="teal.500"
            >
              개인정보 이용 및 서비스 약관
            </Text>
            <Box maxH="600px" overflowY="auto" mb={4}>
              <Text fontSize="sm" mb={2} fontWeight="bold">
                ㈜단잠
              </Text>

              <Text fontSize="sm" mb={2}>
                제 1 장 총 칙
              </Text>
              <Text fontSize="sm" mb={2}>
                제 1 조 목적: 본 약관은 서비스 이용자가 주식회사 단잠(이하
                “회사”라 합니다)가 제공하는 온라인상의 숙박 예약관리 인터넷
                서비스인 “Danjam” (이하 “서비스”라고 하며, 접속 가능한 유∙무선
                단말기의 종류와는 상관없이 이용 가능한 “회사”가 제공하는 모든
                “서비스”를 의미합니다. 이하 같습니다)에 회원으로 가입하고 이를
                이용함에 있어 회사와 회원(본 약관에 동의하고 회원등록을 완료한
                서비스 이용자를 말합니다. 이하 “회원”이라고 합니다)의 권리∙의무
                및 책임사항을 규정함을 목적으로 합니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 2 조 약관의 명시, 효력 및 개정
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기
                화면에 게시합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회사는 온라인 디지털콘텐츠산업 발전법, 전자상거래 등에서의
                소비자보호에 관한 법률, 약관의 규제에 관한 법률, 소비자기본법 등
                관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 회사가 약관을 개정할 경우에는 기존약관과 개정약관 및
                개정약관의 적용일자와 개정사유를 명시하여 현행약관과 함께 그
                적용일자 일십오(15)일 전부터 적용일 이후 상당한 기간 동안, 개정
                내용이 회원에게 불리한 경우에는 그 적용일자 삼십(30)일 전부터
                적용일 이후 상당한 기간 동안 각각 이를 서비스 홈페이지에
                공지하고 기존 회원에게는 회사가 부여한 이메일 주소로 개정약관을
                발송하여 고지합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                4. 회사가 전항에 따라 회원에게 통지하면서 공지∙고지일로부터
                개정약관 시행일 7일 후까지 거부의사를 표시하지 아니하면 승인한
                것으로 본다는 뜻을 명확하게 고지하였음에도 의사표시가 없는
                경우에는 변경된 약관을 승인한 것으로 봅니다. 회원이 개정약관에
                동의하지 않을 경우 회원은 제17조 제1항의 규정에 따라 이용계약을
                해지할 수 있습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 2 장 회원의 가입 및 관리
              </Text>
              <Text fontSize="sm" mb={2}>
                제 3 조 회원가입절차
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 서비스 이용자가 본 약관을 읽고 “동의” 버튼을 누르거나 “확인”
                등에 체크하는 방법을 취한 경우 본 약관에 동의한 것으로
                간주합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회사의 서비스 이용을 위한 회원가입은 서비스 이용자가 제1항과
                같이 동의한 후, 회사가 정한 온라인 회원가입 신청서에 회원 ID를
                포함한 필수사항을 입력하고, “등록하기” 또는 “확인” 단추를 누르는
                방법으로 합니다. 단, 회사가 필요하다고 인정하는 경우 회원에게
                별도의 서류를 제출하도록 할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 법인고객 회원가입의 경우, 회원가입 신청서 제출, 서비스
                이용대금 납부 이외에 회사가 정하는 추가 서류의 제출이
                필요합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                4. 법인고객 회원가입의 경우, 서비스 이용자와 이용요금 납입자가
                다를 경우 회사는 이를 확인하기 위해 증명을 요구할 수 있습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 4 조 회원등록의 성립과 유보 및 거절
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회원등록은 제3조에 따른 회원가입 신청과 회사의 승낙에 의해
                성립합니다. 회사는 회원가입 신청자가 필수사항을 성실히 입력한
                경우, 필요한 사항을 확인한 후 지체 없이 승낙하여야 합니다. 단,
                별도의 자료 제출이 요구되는 경우는 예외로 합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회사는 다음 각 호에 해당하는 경우 회원등록 승낙을 유보할 수
                있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                1) 제공서비스 설비용량에 현실적인 여유가 없는 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                2) 서비스 제공에 기술적 문제가 있다고 판단되는 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                3) 법인 고객으로 가입 신청 후 필수 의무를 이행하지 않은 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                4) 기타 회사가 재정적∙기술적으로 필요하다고 인정하는 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 회사는 다음 각 호에 해당하는 경우 회원등록을 거절할 수
                있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                1) 가입 신청서에 허위 내용 기재 또는 허위서류 첨부 시
              </Text>
              <Text fontSize="sm" mb={2}>
                2) 법인 고객 가입 신청 후 필수 의무를 정해진 기간 내에 이행하지
                않은 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                3) 14세 미만의 아동이 법정대리인의 동의 없이 가입한 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                4) 기타 사회질서 및 미풍양속에 반하는 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                5) 이전에 계약 해지된 회원이 재가입하는 경우
              </Text>

              <Text fontSize="sm" mb={2}>
                제 5 조 회원 ID 등의 관리책임
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회원은 서비스 이용을 위한 ID와 비밀번호 관리에 책임을 지며,
                부정사용 등으로 인한 불이익은 본인 부담입니다. 단, 회사의
                고의∙과실이 원인인 경우는 예외로 합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회원은 ID, 비밀번호 도난이나 부정 사용이 의심되는 경우 즉시
                비밀번호 수정 등 조치를 취하고 회사에 통보해야 합니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 6 조 개인정보의 수집 등
              </Text>
              <Text fontSize="sm" mb={2}>
                회사는 서비스를 제공하기 위해 관련 법령에 따라 필요한 개인정보를
                회원으로부터 수집합니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 7 조 회원정보의 변경
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회원은 이메일, 전화번호 등 가입 시 제공한 정보가 변경되었을
                경우 즉시 회원정보 관리페이지에서 변경해야 합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회원정보 변경 미이행으로 발생하는 손해에 대해서 회사는
                책임지지 않습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 3 장 서비스의 이용
              </Text>
              <Text fontSize="sm" mb={2}>
                제 8 조 서비스 이용
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 서비스 이용은 회사의 승낙 직후부터 가능하며, 유료 서비스의
                경우 결제 확인 후 이용할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 미성년자가 유료 서비스를 이용할 경우 법정대리인의 동의가
                필요합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 서비스 이용 시간은 원칙 24시간이며, 정기점검 등의 사유로 일부
                시간에 제한될 수 있습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 9 조 서비스내용변경 통지 등
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회사는 CP 계약종료, 서비스 정책 변경 등으로 서비스 내용이
                변경되거나 종료될 경우, 회원에게 이메일 및 공지사항 등을 통해
                사전에 통지합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 중대한 사항의 경우 개별 통지를 통해 회원에게 알리며, 재로그인
                또는 추가 동의 절차가 필요할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 유료 서비스 종료 시에도 반드시 이메일로 고지하고 환불 절차를
                진행합니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 10 조 권리의 귀속 및 저작물의 이용
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회원이 서비스 내에 게시한 게시물 등의 저작권은 해당
                게시자에게 귀속됩니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 게시물은 회사의 사이트 및 앱을 통해 노출될 수 있으며, 필요한
                경우 일부 수정∙편집될 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 회사는 게시물 이용 전 사전 동의를 받습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 11 조 서비스 이용의 제한 및 중지
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회사는 회원이 서비스 운영을 방해하거나 약관을 위반하는 경우
                이용을 제한∙중지할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 서비스 제한 시 사유 및 기간을 회원에게 통지합니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 12 조 회사의 의무
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회사는 안정적이고 안전한 서비스 제공을 위해 설비를
                유지∙점검∙복구해야 합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회원에게 불필요한 광고성 메시지를 발송하지 않습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 회원의 개인정보는 보호하며, 관련 법령 및 개인정보관리지침을
                준수합니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 13 조 회원의 의무
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회원은 허위정보 등록, 타인 정보 도용, 불법 정보 전송 등 금지
                행위를 해서는 안 됩니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 위 행위를 할 경우 회사는 해당 게시물 삭제 및 이용 제한, 계약
                해지 등의 조치를 취할 수 있습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 14 조 양도금지
              </Text>
              <Text fontSize="sm" mb={2}>
                회원의 서비스 이용 권리는 양도∙증여 또는 질권의 목적으로 사용할
                수 없습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 15 조 이용요금의 납입
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 유료 서비스 이용 시 회원은 이용대금을 납부한 후 서비스를
                이용합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 결제 방식은 신용카드, 계좌이체, 무통장입금 등이 있으며,
                서비스마다 차이가 있을 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 정기 결제 서비스의 경우 회원의 해지 요청이 없으면 매월 자동
                결제가 이루어집니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 16 조 이용요금의 환불 및 이의제기
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 과오 납입한 요금은 환불되어야 합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회원 귀책 사유로 인한 환불은 이용일수에 해당하는 금액을
                제외한 금액을 환불합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 아래 경우 회원이 전액 환불받습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                1) 결제 후 서비스 이용 내역이 없는 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                2) 서비스 장애 등 회사 귀책 사유로 이용하지 못한 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                3) 제공되지 않은 서비스인 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                4) 광고 등과 현저히 상이한 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                5) 서비스 결함으로 정상 이용이 불가능한 경우
              </Text>
              <Text fontSize="sm" mb={2}>
                4. 환불은 3영업일 이내에 이루어지며, 지연 시 연리 11%의 이자율이
                적용됩니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 17 조 이용계약의 해지
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회원은 언제든지 탈퇴할 수 있으며, 해지 시 환불 절차를
                진행합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 약관 위반 시 회사는 일방적으로 계약을 해지할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                3. 장기간 로그인이 없는 경우 회사는 회원 자격을 상실시킬 수
                있습니다.
              </Text>

              <Text fontSize="sm" mb={2}>
                제 4 장 기타
              </Text>
              <Text fontSize="sm" mb={2}>
                제 18 조 청소년 보호
              </Text>
              <Text fontSize="sm" mb={2}>
                회사는 청소년 보호정책을 별도로 시행하며, 서비스 초기 화면
                등에서 확인할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                제 19 조 게시판 이용 상거래
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 게시판 이용 통신판매업자등 회원은 전자상거래법에 따른 의무를
                준수해야 합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 해당 회원은 신원정보를 제공하며, 분쟁 발생 시 회사는 요청하는
                기관에 제공할 수 있습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                제 20 조 면책
              </Text>
              <Text fontSize="sm" mb={2}>
                1. 회사는 천재지변, 제3자 서비스 방해, 회원 귀책 사유 등으로
                인한 손해에 대해 책임을 지지 않습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                2. 회사는 회원 게시물의 신뢰도나 정확성에 대해 보증하지
                않습니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                제 21 조 분쟁의 해결
              </Text>
              <Text fontSize="sm" mb={2}>
                본 약관은 대한민국 법령에 따라 규정되며, 분쟁 발생 시 관할
                법원은 민사소송법상의 주소지를 관할하는 법원으로 합니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                제 22 조 규정의 준용
              </Text>
              <Text fontSize="sm" mb={2}>
                본 약관에 명시되지 않은 사항은 관련 법령 및 관습에 따릅니다.
              </Text>
              <Text fontSize="sm" mb={2}>
                부칙
              </Text>
              <Text fontSize="sm" mb={2}>
                본 약관은 2025년 05월 01일부터 적용됩니다. 단, 공지 시점으로부터
                적용일 전일까지 가입한 신규회원에 대해서는 가입 시부터 본 약관이
                적용됩니다.
              </Text>
            </Box>
            <Checkbox
              isChecked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              colorScheme="teal"
            >
              위 약관에 동의합니다
            </Checkbox>
          </VStack>
        </Box>
        <Button
          variant="outline"
          onClick={onClose}
          w="full"
          size="md"
          color="gray.600"
          borderColor="gray.300"
        >
          닫기
        </Button>
        <Button colorScheme="teal" onClick={handleAgree} w="full" size="md">
          동의하기
        </Button>
      </VStack>
    </Container>
  );
};

export default PrivacyConsent;
