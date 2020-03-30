export class URLStore {
  static CONFIRMED_CASES_URL =
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';

  static DAILY_REPORTS_REPO_CONTENTS_URL =
    'https://api.github.com/repos/CSSEGISandData/COVID-19/contents/csse_covid_19_data/csse_covid_19_daily_reports';

  /***** NETLIFY LAMBDA URLS *****/

  static NETLIFY_LAMBDA_CONFIRMED_CASES_URL =
    '/.netlify/functions/confirmed-country-cases';

  static NETLIFY_LAMBDA_DAILY_REPORTS_REPO_CONTENTS_URL =
    '/.netlify/functions/daily-reports';
}
