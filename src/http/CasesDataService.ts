import { URLStore } from '@/constants/urlStore';

import Axios, { AxiosResponse } from 'axios';
import CSV from 'comma-separated-values';
import { CountryCasesObject } from '@/models/CountryCasesObject';
import { GitHubFileInfoObject } from '@/models/GitHubFileInfoObject';
import { STATE_ABB_SET, STATE_ABB_MAP, STATE_SET } from '@/constants/states';
import { DailyReportObject } from '@/models/DailyReportObject';

const POSS_CTRY_REG_PROPS = ['Country_Region', 'Country/Region'];
const POSS_PROV_STATE_PROPS = ['Province_State', 'Province/State'];
const POSS_CONF_PROPS = ['Confirmed'];
const POSS_RECOVER_PROPS = ['Recovered'];
const POSS_DEATH_PROPS = ['Deaths'];

export class CasesDataService {
  static get dailyCasesReports() {
    let sortedUrls: string[] = [];
    return this.dailyReportsRepoContents
      .then((fileInfoObj: GitHubFileInfoObject[]) => {
        const urls: string[] = fileInfoObj.map(
          (infoObj: GitHubFileInfoObject) => infoObj.download_url
        );
        return urls;
      })
      .then((urls: string[]) => {
        sortedUrls = [...urls];
        sortedUrls.sort((urlA: string, urlB: string) =>
          urlA.localeCompare(urlB)
        );
        return Promise.all(sortedUrls.map((url: string) => Axios.get(url)));
      })
      .then((resList: AxiosResponse[]) => {
        const dateList = sortedUrls.map((url: string) =>
          url.slice(url.length - 14, url.length - 9).replace('-', '/')
        );
        return resList.map((res: AxiosResponse, dateIndex: number) => {
          return CasesDataService.parseDailyReportCSV(
            res.data,
            dateList[dateIndex]
          );
        });

        // console.log(dailyReportListGroups);

        // const stateCasesMap = new Map<string, number[]>(
        //   Array.from(STATE_SET).map((state: string) => [state, []])
        // );

        // dailyReportListGroups.forEach(
        //   (dailyRepList: DailyReportObject[], dayIndex: number) => {
        //     dailyRepList.forEach((dailyRepObj: DailyReportObject) => {
        //       const state: string = dailyRepObj.provinceOrState;
        //       if (stateCasesMap.has(state)) {
        //         const casesList: number[] = stateCasesMap.get(state) || [];
        //         casesList[dayIndex] = casesList[dayIndex - 1] || 0;
        //         casesList[dayIndex] += +dailyRepObj.confirmed;
        //         stateCasesMap.set(state, casesList);
        //       }
        //     });

        //     const currDayCount = dayIndex + 1;

        //     Array.from(stateCasesMap.keys()).forEach((key: string) => {
        //       const casesList: number[] = stateCasesMap.get(key) || [];
        //       if (casesList.length < currDayCount) {
        //         for (let i = 0; i < currDayCount - casesList.length; i++) {
        //           casesList.push(0);
        //         }
        //         stateCasesMap.set(key, casesList);
        //       }
        //     });
        //   }
        // );

        // console.log(stateCasesMap);

        // const countryCasesList: CountryCasesObject[] = Array.from(
        //   stateCasesMap.keys()
        // ).map((state: string) => {
        //   return {
        //     countryOrRegion: 'US',
        //     provinceOrState: state,
        //     caseMap: stateCasesMap.get(state) || [],
        //     lat: 0,
        //     long: 0
        //   };
        // });

        // console.log(stateCasesMap);

        // resList
        //   .map((res: AxiosResponse) =>
        //     CasesDataService.convertCSVStringToCountryCasesList(res.data)
        //   )
        //   .map((dailyCasesList: CountryCasesObject[]) => {
        //     return dailyCasesList.filter(
        //       (casesObj: CountryCasesObject) =>
        //         casesObj.countryOrRegion.toUpperCase() === 'US'
        //     );
        //   })
        //   .forEach((usCasesList: CountryCasesObject[]) => {
        //     usCasesList.forEach((casesObj: CountryCasesObject) => {
        //       const stateAbbRegExp = /^.*(, [A-Z]{2}){1}$/i;

        //       if (stateCasesMap.has(casesObj.provinceOrState)) {
        //         // console.log(`Found ${casesObj.provinceOrState}`);
        //       } else if (stateAbbRegExp.test(casesObj.provinceOrState)) {
        //         const abb: string = casesObj.provinceOrState.slice(-2);
        //         const state: string = US_STATES.get(abb) as string;
        //         // console.log(`Converting ${abb} to ${state}`);
        //         // test
        //       } else {
        //         // console.log(`Could not find ${casesObj.provinceOrState}`);
        //       }
        //     });
        //   });
      });
  }

  private static get dailyReportsRepoContents(): Promise<
    GitHubFileInfoObject[]
  > {
    return Axios.get(URLStore.DAILY_REPORTS_REPO_CONTENTS_URL).then(
      (res: AxiosResponse) => {
        const csvRegExp = /^[\w-]*(\.csv){1}$/;
        return (res.data as GitHubFileInfoObject[]).filter(
          (infoObj: GitHubFileInfoObject) => csvRegExp.test(infoObj.name)
        );
      }
    );
  }

  static get confirmedCases(): Promise<CountryCasesObject[]> {
    return Axios.get(URLStore.CONFIRMED_CASES_URL).then((res: AxiosResponse) =>
      CasesDataService.convertCSVStringToCountryCasesList(res.data)
    );
  }

  private static parseDailyReportCSV(
    csvString: string,
    date: string
  ): DailyReportObject[] {
    const rawParsedCSV: any[] = new CSV(csvString, {
      cast: false,
      header: true
    }).parse();

    return rawParsedCSV
      .map((rawParsedCSVObj: any) => {
        return {
          date,
          countryOrRegion:
            CasesDataService.parseProp(rawParsedCSVObj, POSS_CTRY_REG_PROPS) ||
            '',
          provinceOrState:
            CasesDataService.parseProp(
              rawParsedCSVObj,
              POSS_PROV_STATE_PROPS
            ) || '',
          confirmed:
            CasesDataService.parseProp(rawParsedCSVObj, POSS_CONF_PROPS) || '',
          recovered:
            CasesDataService.parseProp(rawParsedCSVObj, POSS_RECOVER_PROPS) ||
            '',
          deaths:
            CasesDataService.parseProp(rawParsedCSVObj, POSS_DEATH_PROPS) || ''
        };
      })
      .map((dailyRepObj: DailyReportObject) => {
        if (dailyRepObj.countryOrRegion === 'US') {
          const splitStr: string[] = dailyRepObj.provinceOrState.split(' ');
          const stateOrAbb: string = splitStr[splitStr.length - 1];
          if (STATE_ABB_MAP.has(stateOrAbb)) {
            return {
              ...dailyRepObj,
              provinceOrState: STATE_ABB_MAP.get(stateOrAbb) as string
            };
          }
        }
        return dailyRepObj;
      });
  }

  private static convertCSVStringToCountryCasesList(
    csvString: string
  ): CountryCasesObject[] {
    return new CSV(csvString, {
      cast: false,
      header: true
    })
      .parse()
      .map((rawCasesObj: any) => {
        const caseMap = new Map<string, number>();

        Object.keys(rawCasesObj)
          .filter((key: string) =>
            RegExp(/^\d{1,2}\/\d{1,2}\/\d{1,2}$/).test(key)
          )
          .forEach((key: string) =>
            caseMap.set(key.trim().slice(0, -3), +rawCasesObj[key])
          );

        return {
          provinceOrState:
            rawCasesObj['Province/State'] ||
            rawCasesObj['Province_State'] ||
            '',
          countryOrRegion:
            rawCasesObj['Country/Region'] ||
            rawCasesObj['Country_Region'] ||
            '',
          lat: rawCasesObj['Lat'],
          long: rawCasesObj['Long'] || rawCasesObj['Long_'] || '',
          caseMap
        };
      });
  }

  private static parseProp(obj: any, propList: string[]) {
    for (let i = 0; i < propList.length; i++) {
      if (propList[i] in obj) {
        return obj[propList[i]];
      }
    }
    console.error(`Could not parse for ${propList}`, obj);
    return undefined;
  }
}
