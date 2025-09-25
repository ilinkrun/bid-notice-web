import gql from 'graphql-tag';

export const mappingsTypeDefs = gql`
  type LangMapping {
    id: Int!
    area: String!
    scope: String!
    ko: String!
    en: String!
    remark: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input LangMappingInput {
    area: String!
    scope: String!
    ko: String!
    en: String!
    remark: String
    isActive: Boolean
  }

  input LangMappingUpdateInput {
    id: Int!
    area: String
    scope: String
    ko: String
    en: String
    remark: String
    isActive: Boolean
  }

  extend type Query {
    # 전체 매핑 데이터 조회
    mappingsLangAll: [LangMapping!]!
    
    # 영역별 매핑 데이터 조회
    mappingsLangByArea(area: String!): [LangMapping!]!

    # scope별 매핑 데이터 조회
    mappingsLangByScope(scope: String!): [LangMapping!]!

    # 특정 매핑 데이터 조회
    mappingsLangById(id: Int!): LangMapping

    # 한글->영어 변환 (scope 포함)
    mappingsLangKoToEn(scope: String!, ko: String!): String

    # 영어->한글 변환 (scope 포함)
    mappingsLangEnToKo(scope: String!, en: String!): String
  }

  extend type Mutation {
    # 매핑 데이터 생성
    mappingsLangCreate(input: LangMappingInput!): LangMapping!
    
    # 매핑 데이터 수정
    mappingsLangUpdate(input: LangMappingUpdateInput!): LangMapping!
    
    # 매핑 데이터 삭제
    mappingsLangDelete(id: Int!): Boolean!
    
    # 매핑 캐시 초기화
    mappingsLangClearCache(area: String): Boolean!
  }
`;