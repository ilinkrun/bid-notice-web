import { Metadata } from 'next';
import { SettingsCategoryTable } from '@/components/settings/SettingsCategoryTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';

export const metadata: Metadata = {
  title: '입찰공고 카테고리 설정 목록 | ILMAC BID',
  description: '입찰공고 카테고리 설정 목록을 관리합니다.',
};

const GET_SETTINGS_NOTICE_CATEGORYS = gql`
  query GetSettingsCategorys {
    settingsCategorys {
      sn
      category
      keywords
      minPoint
      nots
      creator
      memo
    }
  }
`;

async function getSettingsCategorys() {
  const client = getClient();
  try {
    const { data } = await client.query({
      query: GET_SETTINGS_NOTICE_CATEGORYS,
      fetchPolicy: 'no-cache',
    });
    return data.settingsCategorys;
  } catch (error) {
    console.error('Failed to fetch settings categorys:', error);
    return [];
  }
}

export default async function SettingsCategoryPage() {
  const settingsCategorys = await getSettingsCategorys();

  return (
    <div className="theme-default">
      <div className="container mx-auto">
        <h1 className="text-xl font-bold pt-1 pl-1">입찰공고 카테고리 설정 목록</h1>
        <ApolloWrapper>
          <SettingsCategoryTable initialData={settingsCategorys} />
        </ApolloWrapper>
      </div>
    </div>
  );
} 