import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RedirectPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  // Create search string from searchParams
  const searchString = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => searchString.append(key, v));
    } else if (value) {
      searchString.set(key, value);
    }
  });

  const queryString = searchString.toString();
  const redirectUrl = `/notices/gov/${resolvedParams.category}${queryString ? `?${queryString}` : ''}`;

  redirect(redirectUrl);
}