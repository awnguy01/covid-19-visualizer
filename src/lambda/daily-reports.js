import Axios from 'axios';
import CSV from 'comma-separated-values';

export const STATE_ABB_MAP = new Map([
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AS', 'American Samoa'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['AA', 'Armed Forces Americas'],
  ['AE', 'Armed Forces Europe'],
  ['AP', 'Armed Forces Pacific'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['DC', 'District Of Columbia'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['GU', 'Guam'],
  ['HI', 'Hawaii'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MH', 'Marshall Islands'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['NP', 'Northern Mariana Islands'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['PR', 'Puerto Rico'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['VI', 'US Virgin Islands'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming']
]);

const DAILY_REPORTS_REPO_CONTENTS_URL =
  'https://api.github.com/repos/CSSEGISandData/COVID-19/contents/csse_covid_19_data/csse_covid_19_daily_reports';
const POSS_CTRY_REG_PROPS = ['Country_Region', 'Country/Region'];
const POSS_PROV_STATE_PROPS = ['Province_State', 'Province/State'];
const POSS_CONF_PROPS = ['Confirmed'];
const POSS_RECOVER_PROPS = ['Recovered'];
const POSS_DEATH_PROPS = ['Deaths'];

function parseProp(obj, propList) {
  for (let i = 0; i < propList.length; i++) {
    if (propList[i] in obj) {
      return obj[propList[i]];
    }
  }
  console.error(`Could not parse for ${propList}`, obj);
  return undefined;
}

function parseDailyReportCSV(csvString, date) {
  const rawParsedCSV = new CSV(csvString.trim(), {
    cast: false,
    header: true
  }).parse();

  return rawParsedCSV
    .map(rawParsedCSVObj => {
      return {
        date,
        countryOrRegion: parseProp(rawParsedCSVObj, POSS_CTRY_REG_PROPS) || '',
        provinceOrState:
          parseProp(rawParsedCSVObj, POSS_PROV_STATE_PROPS) || '',
        confirmed: parseProp(rawParsedCSVObj, POSS_CONF_PROPS) || '',
        recovered: parseProp(rawParsedCSVObj, POSS_RECOVER_PROPS) || '',
        deaths: parseProp(rawParsedCSVObj, POSS_DEATH_PROPS) || ''
      };
    })
    .map(dailyRepObj => {
      if (dailyRepObj.countryOrRegion === 'US') {
        const splitStr = dailyRepObj.provinceOrState.split(' ');
        const stateOrAbb = splitStr[splitStr.length - 1];
        if (STATE_ABB_MAP.has(stateOrAbb)) {
          return {
            ...dailyRepObj,
            provinceOrState: STATE_ABB_MAP.get(stateOrAbb)
          };
        }
      }
      return dailyRepObj;
    });
}

function dailyReportsRepoContents() {
  return Axios.get(DAILY_REPORTS_REPO_CONTENTS_URL).then(res => {
    const csvRegExp = /^[\w-]*(\.csv){1}$/;
    return res.data.filter(infoObj => csvRegExp.test(infoObj.name));
  });
}

exports.handler = (event, context, callback) => {
  let sortedUrls = [];
  return dailyReportsRepoContents()
    .then(fileInfoObj => {
      const urls = fileInfoObj.map(infoObj => infoObj.download_url);
      return urls;
    })
    .then(urls => {
      sortedUrls = [...urls];
      sortedUrls.sort((urlA, urlB) => urlA.localeCompare(urlB));
      return Promise.all(sortedUrls.map(url => Axios.get(url)));
    })
    .then(resList => {
      const dateList = sortedUrls.map(url =>
        url.slice(url.length - 14, url.length - 9).replace('-', '/')
      );
      return resList.map((res, dateIndex) => {
        return parseDailyReportCSV(res.data, dateList[dateIndex]);
      });
    })
    .then(dataList => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(dataList)
      });
    })
    .catch(err => {
      callback(err);
    });
};
