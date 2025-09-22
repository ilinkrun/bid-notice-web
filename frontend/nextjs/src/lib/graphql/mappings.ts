import { gql } from '@apollo/client';

// scope별 매핑 데이터 조회
export const GET_MAPPINGS_BY_SCOPE = gql`
  query GetMappingsByScope($scope: String!) {
    mappingsLangByScope(scope: $scope) {
      id
      area
      scope
      ko
      en
      remark
      isActive
    }
  }
`;

// 한글->영어 변환
export const CONVERT_KO_TO_EN = gql`
  query ConvertKoToEn($scope: String!, $ko: String!) {
    mappingsLangKoToEn(scope: $scope, ko: $ko)
  }
`;

// 영어->한글 변환
export const CONVERT_EN_TO_KO = gql`
  query ConvertEnToKo($scope: String!, $en: String!) {
    mappingsLangEnToKo(scope: $scope, en: $en)
  }
`;