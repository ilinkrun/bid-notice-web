import { Metadata } from 'next';
import { SettingsListTable } from '@/components/settings/SettingsListTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';

export const metadata: Metadata = {
  title: '스크랩 설정 목록 | ILMAC BID',
  description: '입찰공고 스크랩 설정 목록을 관리합니다.',
};

const GET_SETTINGS_NOTICE_LISTS = gql`
  query GetSettingsLists {
    settingsLists {
      oid
      orgName
      detailUrl
      region
      registration
      use
      companyInCharge
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
    return data.settingsLists;
  } catch (error) {
    console.error('Failed to fetch settings lists:', error);
    return [];
  }
}

export default async function ScrappingSettingsPage() {
  const settingsLists = await getSettingsLists();

  return (
    <div className="theme-default">
      <div className="container mx-auto">
        <div className="flex justify-between items-center pt-1 pl-1 pr-1 mb-4">
          <h1 className="text-xl font-bold">스크랩 설정 목록</h1>
          <a
            href="/settings/scrapping/new"
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 gap-1.5 px-3 has-[>svg]:px-2.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            추가
          </a>
        </div>
        <ApolloWrapper>
          <SettingsListTable initialData={settingsLists} />
        </ApolloWrapper>
      </div>
    </div>
  );
}