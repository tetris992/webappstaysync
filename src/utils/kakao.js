// webapp/src/utils/kakao.js


export const initKakao = () => {
    console.log('Kakao App Key:', process.env.REACT_APP_KAKAO_APP_KEY);
    if (window.Kakao && !window.Kakao.isInitialized()) {
      const kakaoAppKey = process.env.REACT_APP_KAKAO_APP_KEY || '1254f09d92bf9eb27b8d54f091e1d1e1'; // 임시 기본값
      if (!kakaoAppKey) {
        console.error('카카오 앱 키가 환경 변수에 설정되지 않았습니다.');
        throw new Error('카카오 앱 키가 환경 변수에 설정되지 않았습니다. 배포 환경을 확인하세요.');
      }
      try {
        window.Kakao.init(kakaoAppKey);
        console.log('카카오 SDK 초기화 완료');
        return true;
      } catch (error) {
        console.error('카카오 SDK 초기화 실패:', error);
        return false;
      }
    }
    return true;
  };