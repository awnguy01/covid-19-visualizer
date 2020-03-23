export interface CountryCasesObject {
  provinceOrState: string;
  countryOrRegion: string;
  lat: number;
  long: number;
  caseMap: Map<string, number>;
}
