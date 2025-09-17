import { Metadata } from 'next';
import { SettingsListTable } from '@/components/settings/SettingsListTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ButtonWithIcon } from '@/components/shared/FormComponents';

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
    <PageContainer>
      <PageHeader
        title="스크랩 설정 목록"
        breadcrumbs={[
          { label: '설정', href: '/settings' },
          { label: '스크랩 설정', href: '/settings/scrapping' }
        ]}
        action={
          <Link href="/settings/scrapping/new">
            <ButtonWithIcon
              icon={<Plus className="h-4 w-4 mr-2" />}
            >
              추가
            </ButtonWithIcon>
          </Link>
        }
      />
      <ApolloWrapper>
        <SettingsListTable initialData={settingsLists} />
      </ApolloWrapper>
    </PageContainer>
  );
}