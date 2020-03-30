import { CountryCasesObject } from '@/models/CountryCasesObject';
import Axios, { AxiosResponse } from 'axios';
import { URLStore } from '@/constants/urlStore';
import { DailyReportObject } from '@/models/DailyReportObject';

export class NetlifyCasesDataService {
  static get confirmedCases(): Promise<CountryCasesObject[]> {
    return Axios.get(URLStore.NETLIFY_LAMBDA_CONFIRMED_CASES_URL).then(
      (res: AxiosResponse) => {
        return res.data.map((casesObj: any) => ({
          ...casesObj,
          caseMap: new Map(JSON.parse(casesObj.caseMap))
        }));
      }
    );
  }

  static get dailyCasesReports(): Promise<DailyReportObject[][]> {
    return Axios.get(
      URLStore.NETLIFY_LAMBDA_DAILY_REPORTS_REPO_CONTENTS_URL
    ).then((res: AxiosResponse) => res.data);
  }
}
