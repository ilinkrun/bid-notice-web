import { Metadata } from 'next';
import { SettingsListTable } from '@/components/settings/SettingsListTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '스크랩 설정 목록 | ILMAC BID',
  description: '입찰공고 스크랩 설정 목록을 관리합니다.',
};

const GET_SETTINGS_NOTICE_LISTS = gql`
  query GetSettingsLists {
    settingsNoticeListAll {
      oid
      orgName
      url
      detailUrl
      use
      orgRegion
      companyInCharge
      orgMan
    }
  }
`;

async function getSettingsLists() {
  const client = getClient();
  try {
    const { data } = await client.query({
      query: GET_SETTINGS_NOTICE_LISTS,
      fetchPolicy: 'no-cache',
    });
    return data.settingsNoticeListAll;
  } catch (error) {
    console.error('Failed to fetch settings lists:', error);
    return [];
  }
}

export default async function ScrappingSettingsPage() {
  const settingsLists = await getSettingsLists();

  return (
    <PageContainer title="스크랩 설정 목록">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <Link
          href="/settings/scrapping/new"
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-1.5 px-3 rounded-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          추가
        </Link>
      </div>
      <ApolloWrapper>
        <SettingsListTable initialData={settingsLists} />
      </ApolloWrapper>
    </PageContainer>
  );
}