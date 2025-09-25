import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';

const GET_APP_SETTING_VALUE = gql`
  query GetAppSettingValue($area: String!, $name: String!) {
    appSettingValue(area: $area, name: $name)
  }
`;

const GET_APP_SETTINGS_BY_AREA = gql`
  query GetAppSettingsByArea($area: String!) {
    appSettingsByArea(area: $area) {
      name
      value
    }
  }
`;

export async function getAppSettingValue(area: string, name: string): Promise<string | null> {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_APP_SETTING_VALUE,
      variables: { area, name },
      fetchPolicy: 'no-cache'
    });

    return data.appSettingValue;
  } catch (error) {
    console.error(`Failed to fetch app setting ${area}.${name}:`, error);
    return null;
  }
}

export async function getAppSettingsByArea(area: string): Promise<Record<string, string>> {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_APP_SETTINGS_BY_AREA,
      variables: { area },
      fetchPolicy: 'no-cache'
    });

    const settings: Record<string, string> = {};
    data.appSettingsByArea.forEach((setting: { name: string; value: string }) => {
      settings[setting.name] = setting.value;
    });

    return settings;
  } catch (error) {
    console.error(`Failed to fetch app settings for area ${area}:`, error);
    return {};
  }
}

// Helper function to get notice defaults
export async function getNoticeDefaults(): Promise<{
  gap: string;
  categoryDefault: string;
}> {
  try {
    const settings = await getAppSettingsByArea('frontend');

    return {
      gap: settings.notice_date_gap || '5',
      categoryDefault: settings.category_view_default || '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타'
    };
  } catch (error) {
    console.error('Failed to fetch notice defaults:', error);
    return {
      gap: '5',
      categoryDefault: '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타'
    };
  }
}