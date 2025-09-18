import { redirect } from 'next/navigation';

export default function NoticesRootPage() {
  // Redirect to the default government notices page
  redirect('/notices/gov/공사점검?gap=1');
}