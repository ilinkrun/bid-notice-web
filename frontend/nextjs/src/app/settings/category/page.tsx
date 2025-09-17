import { Metadata } from 'next';
import { SettingsCategoryTable } from '@/components/settings/SettingsCategoryTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ButtonWithIcon } from '@/components/shared/FormComponents';

export const metadata: Metadata = {
  title: '입찰공고 카테고리 설정 목록 | ILMAC BID',
  description: '입찰공고 카테고리 설정 목록을 관리합니다.',
};

const GET_SETTINGS_NOTICE_CATEGORYS = gql`
  query GetSettingsCategorys {
    settingsNoticeCategoryAll {
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
    return data.settingsNoticeCategoryAll;
  } catch (error) {
    console.error('Failed to fetch settings categorys:', error);
    return [];
  }
}

export default async function SettingsCategoryPage() {
  const settingsCategorys = await getSettingsCategorys();

  return (
    <PageContainer>
      <PageHeader
        title="업무구분 설정"
        breadcrumbs={[
          { label: '설정', href: '/settings' },
          { label: '업무구분 설정', href: '/settings/category' }
        ]}
        action={
          <Link href="/settings/category/new">
            <ButtonWithIcon
              icon={<Plus className="h-4 w-4 mr-2" />}
            >
              추가
            </ButtonWithIcon>
          </Link>
        }
      />
      <ApolloWrapper>
        <SettingsCategoryTable initialData={settingsCategorys} />
      </ApolloWrapper>
    </PageContainer>
  );
} 