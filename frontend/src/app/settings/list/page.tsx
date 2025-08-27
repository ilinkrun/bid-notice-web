import { Metadata } from 'next';
import { SettingsListTable } from '@/components/settings/SettingsListTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';

export const metadata: Metadata = {
  title: '입찰공고 게시판 스크랩 설정 목록 | ILMAC BID',
  description: '입찰공고 게시판 스크랩 설정 목록을 관리합니다.',
};

const GET_SETTINGS_LISTS = gql`
  query GetSettingsLists {
    settingsLists {
      orgName
      detailUrl
      region
      registration
      use
    }
  }
`;

async function getSettingsLists() {
  const client = getClient();
  try {
    const { data } = await client.query({
      query: GET_SETTINGS_LISTS,
      fetchPolicy: 'no-cache',
    });
    return data.settingsLists;
  } catch (error) {
    console.error('Failed to fetch settings lists:', error);
    return [];
  }
}

export default async function SettingsListPage() {
  const settingsLists = await getSettingsLists();

  return (
    <div className="theme-default">
      <div className="container mx-auto">
      <h1 className="text-xl font-bold pt-1 pl-1">입찰공고 게시판 스크랩 설정 목록</h1>
        <ApolloWrapper>
          <SettingsListTable initialData={settingsLists} />
        </ApolloWrapper>
      </div>
    </div>
  );
}
