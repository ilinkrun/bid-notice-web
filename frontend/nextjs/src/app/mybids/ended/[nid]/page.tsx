import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import EndedBidDetailView from '@/components/mybids/EndedBidDetailView';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { notFound } from 'next/navigation';
import '@/app/themes.css';

const GET_BID_DETAIL = gql`
  query GetMyBidDetail($nid: Int!) {
    mybidsOne(nid: $nid) {
      mid
      nid
      title
      status
      startedAt
      endedAt
      memo
      orgName
      postedAt
      detail
      category
      region
    }
  }
`;

async function getBidDetail(nid: string) {
  try {
    const client = getClient();
    const result = await client.query({
      query: GET_BID_DETAIL,
      variables: { nid: parseInt(nid) },
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    return result.data?.mybidsOne || null;
  } catch (error) {
    console.error('Failed to fetch bid detail:', error);
    return null;
  }
}

export default async function BidEndedDetailPage({ params }: { params: Promise<{ nid: string }> }) {
  const { nid } = await params;
  const bid = await getBidDetail(nid);

  if (!bid) {
    notFound();
  }

  return (
    <div className="theme-default">
      <ApolloWrapper>
        <EndedBidDetailView bid={bid} />
      </ApolloWrapper>
    </div>
  );
}