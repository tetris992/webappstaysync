// webapp/src/utils/kakao.js

export const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    // 환경 변수에서 카카오 앱 키 가져오기 또는 기본값 사용
    const kakaoAppKey = process.env.REACT_APP_KAKAO_APP_KEY || '1254f09d92bf9eb27b8d54f091e1d1e1';
    
    try {
      window.Kakao.init(kakaoAppKey);
      console.log('카카오 SDK 초기화 완료');
      return true;
    } catch (error) {
      console.error('카카오 SDK 초기화 실패:', error);
      return false;
    }
  }
  return window.Kakao?.isInitialized() || false;
};