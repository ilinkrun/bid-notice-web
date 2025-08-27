'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import BidTable from '@/components/bids/BidTable';

const GET_BIDS_BY_STATUS = gql`
  query GetBidsByStatus($status: String!) {
    bidByStatus(status: $status) {
      bid
      nid
      status
      title
      started_at
      ended_at
      detail
      memo
      orgName
      region
      postedAt
      category
    }
  }
`;

export default function BidsPage() {
  const params = useParams();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentStatus] = useState(params.status as string);

  const { data } = useQuery(GET_BIDS_BY_STATUS, {
    variables: { status: currentStatus },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm('');
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const filteredBids = data?.bidByStatus?.filter((bid: { title: string; orgName: string; region: string }) => {
    if (!debouncedSearchTerm) return true;
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      bid.title.toLowerCase().includes(searchLower) ||
      bid.orgName.toLowerCase().includes(searchLower) ||
      (bid.region && bid.region.toLowerCase().includes(searchLower))
    );
  }) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <BidTable
        bids={filteredBids}
        currentStatus={currentStatus}
      />
    </div>
  );
}
