import Axios from 'axios';
import CSV from 'comma-separated-values';

const CONFIRMED_CASES_URL =
  'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';

function convertCSVStringToCountryCasesList(csvString) {
  return new CSV(csvString, {
    cast: false,
    header: true
  })
    .parse()
    .map(rawCasesObj => {
      const caseMap = new Map();

      Object.keys(rawCasesObj)
        .filter(key => RegExp(/^\d{1,2}\/\d{1,2}\/\d{1,2}$/).test(key))
        .forEach(key =>
          caseMap.set(key.trim().slice(0, -3), +rawCasesObj[key])
        );

      return {
        provinceOrState:
          rawCasesObj['Province/State'] || rawCasesObj['Province_State'] || '',
        countryOrRegion:
          rawCasesObj['Country/Region'] || rawCasesObj['Country_Region'] || '',
        lat: rawCasesObj['Lat'],
        long: rawCasesObj['Long'] || rawCasesObj['Long_'] || '',
        caseMap: JSON.stringify(Array.from(caseMap.entries()))
      };
    });
}

exports.handler = (event, context, callback) => {
  return Axios.get(CONFIRMED_CASES_URL)
    .then(res => convertCSVStringToCountryCasesList(res.data))
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
