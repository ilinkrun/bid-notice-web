import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import ErrorScrapingContent from './ErrorScrapingContent';

export const metadata: Metadata = {
  title: '스크래핑 오류 통계 | ILMAC BID',
  description: '스크래핑 오류 통계를 확인합니다.',
};

const GET_ERROR_SCRAPINGS = gql`
  query GetErrorScrapings($gap: Int!) {
    logsErrorAll(gap: $gap) {
      id
      orgName
      errorMessage
      time
    }
  }
`;

async function getErrorScrapings() {
  try {
    const client = getClient();
    const { data, error } = await client.query({
      query: GET_ERROR_SCRAPINGS,
      variables: { gap: 7 },
      fetchPolicy: 'no-cache', // 캐시를 사용하지 않고 항상 새로운 데이터를 가져옴
    });

    if (error) {
      console.error('GraphQL 에러:', error);
      return [];
    }

    if (!data?.logsErrorAll) {
      console.error('데이터가 없습니다.');
      return [];
    }

    return data.logsErrorAll;
  } catch (error) {
    console.error('스크래핑 오류 데이터를 불러오는데 실패했습니다:', error);
    return [];
  }
}

export default async function ErrorScrapingPage() {
  const initialData = await getErrorScrapings();
  
  return <ErrorScrapingContent initialData={initialData} />;
}
